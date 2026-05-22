import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { sendEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const token = getTokenFromEvent(event)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })

  const body = await readBody<Record<string, unknown>>(event)

  const contactEmail = String(body.contact_email || '').trim()
  if (!contactEmail) {
    throw createError({ statusCode: 400, statusMessage: 'contact_email is required' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email format' })
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const verifyToken = crypto.randomUUID()

  await env.DB.prepare(
    'UPDATE users SET contact_email = ?, email_verified = 0, email_verify_token = ?, updated_at = ? WHERE id = ?'
  ).bind(contactEmail, verifyToken, now, payload.sub).run()

  // A-02: Send verification email
  const verifyUrl = siteUrl(env, `/api/user/email/verify/${verifyToken}`)
  void sendEmail(env, {
    to: contactEmail,
    sceneId: 'A-02',
    subject: '[aifindr] Verify your email address',
    html: [
      `<p>Thanks for adding your contact email to aifindr.org.</p>`,
      `<p>Click the link below to verify your email address:</p>`,
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      `<p>This link is one-time use and won't expire.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })

  return { success: true, contact_email: contactEmail, email_verified: 0 }
})
