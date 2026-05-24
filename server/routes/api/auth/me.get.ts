import { createError, getHeader } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  let token = getTokenFromEvent(event)
  if (!token) {
    const cookie = getHeader(event, 'Cookie') || ''
    const match = cookie.match(/(?:^|;\s*)aifindr-token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })

  const user = await env.DB.prepare(
    'SELECT id, username, email, avatar_url, contact_email, email_verified FROM users WHERE id = ?'
  ).bind(payload.sub).first<Record<string, unknown>>()
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const isNoreply = !user.email || String(user.email).includes('noreply.github.com')
  const needsContactEmail = isNoreply && !user.contact_email

  return { ...user, needs_contact_email: needsContactEmail }
})
