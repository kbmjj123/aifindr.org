import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import type { CloudflareEnv } from './env'

/**
 * 保护 /api/cron/* 的 HTTP 入口。
 * cloudflare:scheduled 直接调用 server/utils/cron.ts，不经过这些路由，因此不受影响。
 * 外部定时任务仍可在请求头带 `x-cron-secret` 触发这些端点。
 */
export function assertCronSecret(event: H3Event, env: CloudflareEnv): void {
  const expected = env.CRON_SECRET
  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'CRON_SECRET is not configured' })
  }
  const provided = getHeader(event, 'x-cron-secret')
  if (!provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
