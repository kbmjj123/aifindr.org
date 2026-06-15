import { logger } from '~/server/utils/logger'
import { getEnv, siteUrl } from '~/server/utils/env'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const { results: stats } = await env.DB.prepare(
    `SELECT
       p.user_id,
       COUNT(*) as total_links,
       SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_links,
       SUM(CASE WHEN p.is_active = 0 THEN 1 ELSE 0 END) as dead_links,
       SUM(CASE WHEN p.created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as new_links
     FROM published_links p
     WHERE p.user_id IS NOT NULL
     GROUP BY p.user_id`
  ).all<Record<string, unknown>>()

  let recipients = 0

  for (const row of stats) {
    const userId = Number(row.user_id)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue

    recipients++
    const total = Number(row.total_links || 0)
    const active = Number(row.active_links || 0)
    const dead = Number(row.dead_links || 0)
    const newLinks = Number(row.new_links || 0)

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'E-02',
      subject: '[aifindr] Your monthly backlink report',
      html: [
        `<p>Here's your monthly backlink report from aifindr.org:</p>`,
        `<table>`,
        `<tr><td><strong>Total backlinks:</strong></td><td>${total}</td></tr>`,
        `<tr><td><strong>Active:</strong></td><td>${active}</td></tr>`,
        `<tr><td><strong>New this month:</strong></td><td>${newLinks}</td></tr>`,
        ...(dead > 0 ? [`<tr><td><strong>Broken:</strong></td><td>${dead}</td></tr>`] : []),
        `</table>`,
        `<p><a href="${siteUrl(env, '/settings')}">View detailed report →</a></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  logger.info('cron', `Cron 3: Sent monthly reports to ${recipients} recipients`)
  return { success: true, recipients }
})
