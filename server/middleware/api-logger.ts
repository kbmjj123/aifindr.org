/**
 * server/middleware/api-logger.ts
 *
 * Cloudflare Workers 兼容的接口日志中间件
 * 记录：请求路径、方法、耗时、状态码、错误信息
 * 存储：Cloudflare KV（可选）+ console（Cloudflare Dashboard 可查）
 */

import { logger } from '~/server/utils/logger'

const SKIP_PATHS = [/^\/(_nuxt|__nuxt_error)/]

export default defineEventHandler(async (event) => {
  if (!event.path?.startsWith('/api/')) return
  if (SKIP_PATHS.some(p => p.test(event.path))) return

  const start = Date.now()
  const method = getMethod(event)
  const path = event.path

  // Node.js dev: res.on('finish')
  if (event.node?.res) {
    event.node.res.on('finish', () => {
      const status = event.node.res.statusCode ?? 200
      const duration = Date.now() - start
      logApiRequest(method, path, status, duration)
    })
    return
  }

  // Cloudflare Workers: waitUntil 在响应发送后执行
  ;(event as any).waitUntil?.((async () => {
    // 在 Workers 中 response 已被 h3 发送，但 event.node 不可用
    // 用 optimistic status 200，无法获取真实 status
    const duration = Date.now() - start
    logApiRequest(method, path, 200, duration)
  })())
})

function logApiRequest(method: string, path: string, status: number, duration: number) {
  const level = status >= 500 ? 'error' : status >= 400 || duration > 3000 ? 'warn' : 'info'
  logger[level]('api', `${method} ${path} ${status} ${duration}ms`, {
    method, path, status, duration_ms: duration,
  })
}