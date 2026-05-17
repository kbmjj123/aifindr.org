import type { Env } from '../types'
import { json, error } from '../lib/response'
import { verifyJWT, getTokenFromRequest } from '../lib/jwt'
import { getNotifyEmail, sendEmail } from '../lib/email'

/** POST /api/user/email — update contact email for notifications */
export async function handleUserEmail(request: Request, env: Env): Promise<Response> {
  const token = getTokenFromRequest(request)
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const contactEmail = String(body.contact_email || '').trim()
  if (!contactEmail) {
    return error('contact_email is required', 400, 'MISSING_FIELDS')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return error('Invalid email format', 400, 'INVALID_EMAIL')
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const verifyToken = crypto.randomUUID()

  await env.DB.prepare(
    'UPDATE users SET contact_email = ?, email_verified = 0, email_verify_token = ?, updated_at = ? WHERE id = ?'
  ).bind(contactEmail, verifyToken, now, payload.sub).run()

  // A-02: Send verification email
  const verifyUrl = `https://aifindr.org/api/user/email/verify/${verifyToken}`
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

  return json({ success: true, contact_email: contactEmail, email_verified: 0 })
}

/** GET /api/user/email/verify/:token — verify contact email */
export async function handleEmailVerify(token: string, env: Env): Promise<Response> {
  if (!token) return error('Missing verification token', 400)

  const user = await env.DB.prepare(
    'SELECT id, email_verify_token FROM users WHERE email_verify_token = ?'
  ).bind(token).first<{ id: number } | null>()

  if (!user) {
    return new Response(
      '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;">' +
      '<div style="text-align:center"><p style="font-size:24px">❌</p><p>Invalid or already used verification link.</p></div>' +
      '</body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(
    'UPDATE users SET email_verified = 1, email_verify_token = NULL, updated_at = ? WHERE id = ?'
  ).bind(now, user.id).run()

  return new Response(
    '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;">' +
    '<div style="text-align:center"><p style="font-size:24px">✅</p><p>Email verified successfully!</p><p style="color:#666">You can close this page.</p></div>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
