/**
 * server/middleware/api-logger.ts
 *
 * Cloudflare Workers 兼容的接口日志中间件
 * 记录：请求路径、方法、耗时、状态码、错误信息
 * 存储：Cloudflare KV（可选）+ console（Cloudflare Dashboard 可查）
 */

import { getEnv } from '~/server/utils/env'

// ---- 类型定义 ----
interface ApiLog {
  level: 'INFO' | 'WARN' | 'ERROR'
  time: string
  method: string
  path: string
  status: number
  duration_ms: number
  cf_ray?: string     // Cloudflare Ray ID，方便关联 CF 日志
  error?: string
}

// ---- 慢请求阈值（ms） ----
const SLOW_THRESHOLD = 3000

// ---- KV 日志最大存储条数（超出则丢弃旧的） ----
const MAX_KV_LOGS = 500

export default defineEventHandler(async (event) => {
  // 只监控 /api/* 请求
  if (!event.path?.startsWith('/api/')) return

  const start = Date.now()
  const method = getMethod(event)
  const path = event.path
  const cfRay = getHeader(event, 'cf-ray') ?? undefined

  // ---- 用 hook 在响应结束后记录 ----
  // Workers 环境下没有 Node.js res.on('finish')，改用 Nuxt 的 afterResponse hook
  event.context.__apiLogStart = start

  event.node.res.on('finish', () => {
    // Workers 环境此处不执行，由下方 hook 兜底
  })

  // 注册 afterResponse hook（Nuxt ≥ 3.8 支持）
  // 此 hook 在 Workers 环境中也能正常触发
  useNitroApp().hooks.callHookWith(
    async (hooks) => {
      for (const hook of hooks) {
        await hook(event, async () => {
          const duration = Date.now() - start
          const status = event.node.res.statusCode ?? 200

          const level: ApiLog['level'] =
            status >= 500 ? 'ERROR' :
            status >= 400 ? 'WARN' :
            duration > SLOW_THRESHOLD ? 'WARN' :
            'INFO'

          const log: ApiLog = {
            level,
            time: new Date().toISOString(),
            method,
            path,
            status,
            duration_ms: duration,
            cf_ray: cfRay,
          }

          // 慢请求额外标注
          if (duration > SLOW_THRESHOLD) {
            log.error = `Slow request: ${duration}ms exceeded ${SLOW_THRESHOLD}ms threshold`
          }

          // 1. 输出到 console（Cloudflare Dashboard > Workers > Logs 可查）
          const logStr = JSON.stringify(log)
          if (level === 'ERROR') {
            console.error(logStr)
          } else if (level === 'WARN') {
            console.warn(logStr)
          } else {
            console.log(logStr)
          }

          // 2. 持久化到 KV（可选，用于自建监控面板）
          try {
            const env = getEnv(event)
            if (env?.CACHE) {
              await persistLogToKV(env.CACHE, log)
            }
          } catch {
            // KV 写入失败不影响主流程
          }
        })
      }
    },
    'request:after',
    [event]
  )
})

// ---- KV 持久化逻辑 ----
// 用 "logs:list" 维护一个日志 key 列表，每条日志单独存一个 key
async function persistLogToKV(
  kv: KVNamespace,
  log: ApiLog
): Promise<void> {
  const logKey = `logs:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // 日志保留 7 天
  await kv.put(logKey, JSON.stringify(log), { expirationTtl: 60 * 60 * 24 * 7 })

  // 维护 key 列表（用于面板查询）
  const listRaw = await kv.get('logs:index', 'json') as string[] | null
  const list: string[] = listRaw ?? []

  list.unshift(logKey)

  // 超出上限则移除最旧的
  if (list.length > MAX_KV_LOGS) {
    const removed = list.splice(MAX_KV_LOGS)
    // 异步删除旧 key，不阻塞
    Promise.all(removed.map((k) => kv.delete(k))).catch(() => {})
  }

  await kv.put('logs:index', JSON.stringify(list), {
    expirationTtl: 60 * 60 * 24 * 7,
  })
}