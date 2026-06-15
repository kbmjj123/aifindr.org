import { logger } from '~/server/utils/logger'
import { getEnv, siteUrl } from '~/server/utils/env'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  // Check for pending tools older than 7 days
  const { results: staleTools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' AND submitted_at < datetime('now', '-7 days')"
  ).all<Record<string, unknown>>()

  if (staleTools.length > 0) {
    const adminGhIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
    if (adminGhIds.length > 0) {
      const placeholders = adminGhIds.map(() => '?').join(',')
      const { results: admins } = await env.DB.prepare(
        `SELECT * FROM users WHERE github_id IN (${placeholders})`
      ).bind(...adminGhIds).all<UserRecord>()

      const toolList = (staleTools as Record<string, unknown>[])
        .map(t => `• ${t.name} (submitted ${String(t.submitted_at || '').slice(0, 10)})`)
        .join('<br>')

      for (const admin of admins) {
        const adminEmail = getNotifyEmail(admin)
        if (adminEmail) {
          void sendEmail(env, {
            to: adminEmail,
            sceneId: 'B-07',
            subject: `[aifindr] ${staleTools.length} tool(s) awaiting review for 7+ days`,
            html: [
              `<p>The following tools have been pending review for more than 7 days:</p>`,
              `<p>${toolList}</p>`,
              `<p><a href="${siteUrl(env, '/admin')}">Review in admin panel →</a></p>`,
            ].join(''),
          })
        }
      }
    }

    logger.info('cron', `Cron 1: Found ${staleTools.length} stale pending tools, sent B-07 reminders`)
  }

  // Refresh KV stats cache
  await env.CACHE.delete('stats')
  logger.info('cron', 'Cron 1: KV stats cache cleared')

  return { success: true, message: 'Daily ops completed' }
})
