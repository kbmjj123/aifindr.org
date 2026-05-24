import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)

  const subject = String(body.subject || '').trim()
  const htmlBody = String(body.body || body.html || '').trim()

  if (!subject || !htmlBody) {
    throw createError({ statusCode: 400, statusMessage: 'subject and body are required' })
  }

  const { results: recipients } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let sent = 0
  for (const user of recipients) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    sent++
    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-03',
      subject: `[aifindr] ${subject}`,
      html: [
        htmlBody,
        `<p style="color:#666;font-size:11px;margin-top:16px;">You're receiving this as an aifindr.org member. <a href="${siteUrl(env, '/settings')}">Manage email preferences</a>.</p>`,
      ].join(''),
    })
  }

  return { success: true, recipients: recipients.length, sent }
})
