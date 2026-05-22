import { createError, getQuery, getRequestURL, sendRedirect } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { signJWT } from '~/server/utils/jwt'
import { sendEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const url = getRequestURL(event)
  const query = getQuery(event)

  const code = query.code as string | undefined
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing code' })

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
    throw createError({ statusCode: 502, statusMessage: `GitHub token exchange failed: ${e}` })
  }
  if (!tokenData.access_token) {
    throw createError({ statusCode: 400, statusMessage: tokenData.error_description || tokenData.error || 'Failed to get access token' })
  }
  const accessToken = tokenData.access_token

  let ghUser: { id: number; login: string; avatar_url: string }
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
    })
    if (!userRes.ok) {
      const errText = await userRes.text()
      throw createError({ statusCode: 502, statusMessage: `GitHub API ${userRes.status}: ${errText}` })
    }
    ghUser = await userRes.json()
  } catch (e) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e
    throw createError({ statusCode: 502, statusMessage: `GitHub user fetch failed: ${e}` })
  }

  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
  })
  const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[]
  const primaryEmail = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email || ''

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, email = ?, avatar_url = ?, updated_at = ? WHERE github_id = ?')
      .bind(ghUser.login, primaryEmail, ghUser.avatar_url, now, ghUser.id).run()
  } else {
    await env.DB.prepare('INSERT INTO users (github_id, username, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(ghUser.id, ghUser.login, primaryEmail, ghUser.avatar_url, now).run()
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first() as { id: number }
  const jwt = await signJWT({ sub: user.id, gh_id: ghUser.id }, env.JWT_SECRET)

  // A-01: Guide user to set contact_email if GitHub email is noreply
  const isNoreply = !primaryEmail || primaryEmail.includes('noreply.github.com')
  const existingContact = existing
    ? (await env.DB.prepare('SELECT contact_email FROM users WHERE github_id = ?').bind(ghUser.id).first<{ contact_email: string | null }>())?.contact_email
    : null

  if (isNoreply && !existingContact) {
    void sendEmail(env, {
      to: primaryEmail || '',
      sceneId: 'A-01',
      subject: '[aifindr] Add your contact email to receive notifications',
      html: [
        `<p>Hi <strong>@${ghUser.login}</strong>! Welcome to aifindr.org.</p>`,
        `<p>Your GitHub email is set to private, so we can't send you important notifications — like submission status updates, review results, and backlink confirmations.</p>`,
        `<p><strong>Add your contact email here:</strong></p>`,
        `<p><a href="${siteUrl(env, '/settings')}">Go to Settings →</a></p>`,
        `<p>It's optional and only takes a moment. We'll only email you about your submissions and reviews.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }
  await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE github_id = ?').bind(now, ghUser.id).run()

  const frontendOrigin = (query.state as string) || url.origin
  const frontendUrl = new URL(frontendOrigin)
  frontendUrl.searchParams.set('token', jwt)
  await sendRedirect(event, frontendUrl.toString(), 302)
})
