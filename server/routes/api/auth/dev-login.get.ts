import { sendRedirect } from 'h3'
import { getEnv } from '~/server/utils/env'
import { signJWT } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const devUser = {
    github_id: 284824170,
    username: 'aifindr-bot',
    email: 'ngoctoquang2@gmail.com',
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
  await sendRedirect(event, frontendUrl.toString(), 302)
})
