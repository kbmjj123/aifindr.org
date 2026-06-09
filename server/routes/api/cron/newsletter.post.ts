import { readBody } from 'h3'
import { logger } from '~/server/utils/logger'
import { getEnv, siteUrl } from '~/server/utils/env'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const body = await readBody<Record<string, unknown>>(event).catch(() => ({}))
  const subject = String(body.subject || 'aifindr Newsletter — Latest AI Tools & Backlink Tips')
  const newsletterBody = String(body.body || '')

  const htmlBody = newsletterBody || [
    '<h2>Latest from aifindr.org</h2>',
    `<p>New AI tools have been added this week. Check them out on the <a href="${siteUrl(env, '/tools')}?sort=latest">Tools page</a>.</p>`,
    `<p><a href="${siteUrl(env)}">Visit aifindr.org →</a></p>`,
    `<p style="color:#666;font-size:11px;">You're receiving this because you have aifindr.org notifications enabled. <a href="${siteUrl(env, '/settings')}">Unsubscribe</a>.</p>`,
  ].join('')

  const { results: subscribers } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let recipients = 0
  for (const user of subscribers) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    recipients++

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-01',
      subject,
      html: htmlBody,
    })
  }

  logger.info('cron', `Cron 4: Sent newsletter to ${recipients} recipients`)
  return { success: true, recipients }
})
