import { createError, getRouterParams, setResponseHeader } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { token } = getRouterParams(event)

  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing verification token' })

  const user = await env.DB.prepare(
    'SELECT id, email_verify_token FROM users WHERE email_verify_token = ?'
  ).bind(token).first<{ id: number } | null>()

  if (!user) {
    setResponseHeader(event, 'Content-Type', 'text/html')
    return '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;"><div style="text-align:center"><p style="font-size:24px">❌</p><p>Invalid or already used verification link.</p></div></body></html>'
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(
    'UPDATE users SET email_verified = 1, email_verify_token = NULL, updated_at = ? WHERE id = ?'
  ).bind(now, user.id).run()

  setResponseHeader(event, 'Content-Type', 'text/html')
  return '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;"><div style="text-align:center"><p style="font-size:24px">✅</p><p>Email verified successfully!</p><p style="color:#666">You can close this page.</p></div></body></html>'
})
