import { getEnv, siteUrl } from '~/server/utils/env'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  const { results: links } = await env.DB.prepare(
    `SELECT * FROM published_links
     WHERE is_active = 1 AND (last_checked IS NULL OR last_checked < datetime('now', '-1 day'))
     ORDER BY last_checked ASC LIMIT 20`
  ).all<Record<string, unknown>>()

  let deadCount = 0

  for (const link of links) {
    const sourceUrl = String(link.source_url || '')
    if (!sourceUrl) continue

    let isAlive = true
    try {
      const res = await fetch(sourceUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'aifindr-link-checker/1.0' },
      })
      isAlive = res.ok || res.status === 403 || res.status === 401
    } catch {
      isAlive = false
    }

    await env.DB.prepare(
      'UPDATE published_links SET is_active = ?, last_checked = ? WHERE id = ?'
    ).bind(isAlive ? 1 : 0, now, link.id).run()

    if (!isAlive) {
      deadCount++
      const userId = link.user_id as number | null
      if (userId) {
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRecord>()
        const userEmail = getNotifyEmail(user)
        if (userEmail) {
          const targetUrl = String(link.target_url || '')
          const platform = String(link.platform || '')
          void sendEmail(env, {
            to: userEmail,
            sceneId: 'E-01',
            subject: `[aifindr] Backlink alert: link on ${platform} may be broken`,
            html: [
              `<p>We detected that your backlink on <strong>${platform}</strong> may have gone offline:</p>`,
              `<ul>`,
              `<li><strong>Source:</strong> <a href="${sourceUrl}">${sourceUrl}</a></li>`,
              `<li><strong>Target:</strong> ${targetUrl}</li>`,
              `</ul>`,
              `<p>The link has been marked as inactive in your dashboard. If this is a mistake, it will be re-checked in the next scan.</p>`,
              `<p><a href="${siteUrl(env, '/settings')}">View your backlinks →</a></p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    }
  }

  console.log(`Cron 2: Checked ${links.length} links, ${deadCount} dead`)
  return { success: true, total: links.length, dead: deadCount }
})
