import type { Env, JWTPayload } from '../types'
import { json, error } from '../lib/response'
import { signJWT, verifyJWT, getTokenFromRequest } from '../lib/jwt'
import { getNotifyEmail, sendEmail } from '../lib/email'

/** Verify the request comes from an admin user. Returns JWT payload or null. */
export async function verifyAdmin(request: Request, env: Env): Promise<JWTPayload | null> {
  const authToken = getTokenFromRequest(request)
  if (!authToken) return null
  const payload = await verifyJWT(authToken, env.JWT_SECRET)
  if (!payload) return null
  const adminIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
  if (!adminIds.includes(payload.gh_id)) return null
  return payload
}

export async function handleAuthRedirect(url: URL, request: Request, env: Env) {
  const redirectUri = `${url.origin}/api/auth/callback`
  // Store frontend origin in state so we can redirect back after callback
  const referer = request.headers.get('Referer')
  const frontendOrigin = request.headers.get('Origin') || (referer ? new URL(referer).origin : url.origin)
  const ghUrl = new URL('https://github.com/login/oauth/authorize')
  ghUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
  ghUrl.searchParams.set('redirect_uri', redirectUri)
  ghUrl.searchParams.set('scope', 'read:user user:email')
  ghUrl.searchParams.set('state', frontendOrigin)
  return Response.redirect(ghUrl.toString(), 302)
}

export async function handleAuthCallback(url: URL, request: Request, env: Env): Promise<Response> {
  const code = url.searchParams.get('code')
  if (!code) return error('Missing code', 400)

  // Exchange code for access token
  let tokenData: { access_token?: string; error?: string; error_description?: string }
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    tokenData = await tokenRes.json()
  } catch (e) {
    return error(`GitHub token exchange failed: ${e}`, 502)
  }
  if (!tokenData.access_token) {
    return error(tokenData.error_description || tokenData.error || 'Failed to get access token', 400)
  }
  const accessToken = tokenData.access_token

  // Fetch GitHub user
  let ghUser: { id: number; login: string; avatar_url: string }
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
    })
    if (!userRes.ok) {
      const errText = await userRes.text()
      return error(`GitHub API ${userRes.status}: ${errText}`, 502)
    }
    ghUser = await userRes.json()
  } catch (e) {
    return error(`GitHub user fetch failed: ${e}`, 502)
  }

  // Fetch primary email
  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
  })
  const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[]
  const primaryEmail = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email || ''

  // Upsert user in D1
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, email = ?, avatar_url = ?, updated_at = ? WHERE github_id = ?')
      .bind(ghUser.login, primaryEmail, ghUser.avatar_url, now, ghUser.id).run()
  } else {
    await env.DB.prepare('INSERT INTO users (github_id, username, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(ghUser.id, ghUser.login, primaryEmail, ghUser.avatar_url, now).run()
  }

  // Get user ID
  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first() as { id: number }

  // Sign JWT
  const jwt = await signJWT({ sub: user.id, gh_id: ghUser.id }, env.JWT_SECRET)

  // ── A-01: Guide user to set contact_email if GitHub email is noreply ──
  const isNoreply = !primaryEmail || primaryEmail.includes('noreply.github.com')
  const existingContact = existing
    ? (await env.DB.prepare('SELECT contact_email FROM users WHERE github_id = ?').bind(ghUser.id).first<{ contact_email: string | null }>())?.contact_email
    : null

  if (isNoreply && !existingContact) {
    void sendEmail(env, {
      to: primaryEmail || '',  // Will fail gracefully if no email, but email_logs will record it
      sceneId: 'A-01',
      subject: '[aifindr] Add your contact email to receive notifications',
      html: [
        `<p>Hi <strong>@${ghUser.login}</strong>! Welcome to aifindr.org.</p>`,
        `<p>Your GitHub email is set to private, so we can't send you important notifications — like submission status updates, review results, and backlink confirmations.</p>`,
        `<p><strong>Add your contact email here:</strong></p>`,
        `<p><a href="https://aifindr.org/settings">Go to Settings →</a></p>`,
        `<p>It's optional and only takes a moment. We'll only email you about your submissions and reviews.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }
  // Also update last_login_at
  await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE github_id = ?').bind(now, ghUser.id).run()

  // Redirect back to frontend with token (use state param or fallback to origin)
  const frontendOrigin = url.searchParams.get('state') || url.origin
  const frontendUrl = new URL(frontendOrigin)
  frontendUrl.searchParams.set('token', jwt)
  return Response.redirect(frontendUrl.toString(), 302)
}

export async function handleAuthMe(request: Request, env: Env): Promise<Response> {
  // Try Authorization header first, then cookie
  let token = getTokenFromRequest(request)
  if (!token) {
    const cookie = request.headers.get('Cookie') || ''
    const match = cookie.match(/(?:^|;\s*)aifindr-token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  const user = await env.DB.prepare(
    'SELECT id, username, email, avatar_url, contact_email, email_verified FROM users WHERE id = ?'
  ).bind(payload.sub).first<Record<string, unknown>>()
  if (!user) return error('User not found', 404)

  const isNoreply = !user.email || String(user.email).includes('noreply.github.com')
  const needsContactEmail = isNoreply && !user.contact_email

  return json({ ...user, needs_contact_email: needsContactEmail })
}

/** GET /api/auth/dev-login — mock login for local development */
export async function handleDevLogin(env: Env) {
  const devUser = {
    github_id: 12345678,
    username: 'dev-user',
    email: 'dev@example.com',
    avatar_url: '',
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(devUser.github_id).first()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, email = ?, updated_at = ? WHERE github_id = ?')
      .bind(devUser.username, devUser.email, now, devUser.github_id).run()
  } else {
    await env.DB.prepare('INSERT INTO users (github_id, username, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(devUser.github_id, devUser.username, devUser.email, devUser.avatar_url, now).run()
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(devUser.github_id).first() as { id: number }
  const jwt = await signJWT({ sub: user.id, gh_id: devUser.github_id }, env.JWT_SECRET)

  const frontendUrl = new URL('http://localhost:3000')
  frontendUrl.searchParams.set('token', jwt)
  return Response.redirect(frontendUrl.toString(), 302)
}
