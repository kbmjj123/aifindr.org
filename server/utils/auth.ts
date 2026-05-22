import type { H3Event } from 'h3'
import { getEnv } from './env'
import { verifyJWT, getTokenFromEvent } from './jwt'
import type { JWTPayload } from './jwt'

/** Verify the request comes from an admin user. Returns JWT payload or null. */
export async function verifyAdmin(event: H3Event): Promise<JWTPayload | null> {
  const env = getEnv(event)
  const authToken = getTokenFromEvent(event)
  if (!authToken) return null
  const payload = await verifyJWT(authToken, env.JWT_SECRET)
  if (!payload) return null
  const adminIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
  if (!adminIds.includes(payload.gh_id)) return null
  return payload
}
