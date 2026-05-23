/**
 * server/api/admin/logs.get.ts
 *
 * 查询 KV 中存储的接口日志，供监控面板使用
 * 建议加鉴权保护此接口
 */

import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  // TODO: 在此加你的管理员鉴权校验
  // const user = await requireAdminAuth(event)

  const env = getEnv(event)
  const query = getQuery(event)

  const level = query.level as string | undefined      // INFO | WARN | ERROR
  const path = query.path as string | undefined        // 筛选路径
  const limit = Math.min(Number(query.limit) || 50, 200)

  // 读取日志 key 列表
  const listRaw = await env.CACHE.get('logs:index', 'json') as string[] | null
  const list = listRaw ?? []

  // 批量读取日志内容
  const logs = await Promise.all(
    list.slice(0, limit * 3).map((key) =>
      env.CACHE.get(key, 'json').catch(() => null)
    )
  )

  // 过滤 + 限制条数
  const filtered = logs
    .filter(Boolean)
    .filter((log: any) => !level || log.level === level)
    .filter((log: any) => !path || log.path.includes(path))
    .slice(0, limit)

  // 统计摘要
  const all = logs.filter(Boolean) as any[]
  const summary = {
    total: all.length,
    error_count: all.filter((l) => l.level === 'ERROR').length,
    warn_count: all.filter((l) => l.level === 'WARN').length,
    avg_duration_ms: all.length
      ? Math.round(all.reduce((s, l) => s + (l.duration_ms ?? 0), 0) / all.length)
      : 0,
    slow_requests: all.filter((l) => l.duration_ms > 3000).length,
  }

  return {
    summary,
    logs: filtered,
  }
})