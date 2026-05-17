import type { Env, UserRecord } from '../types'
import { getNotifyEmail, sendEmail } from '../lib/email'

/** Cron 1: Daily operations — check stale pending tools + refresh cache */
export async function handleCronDailyOps(env: Env): Promise<void> {
  // Check for pending tools older than 7 days
  const { results: staleTools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' AND submitted_at < datetime('now', '-7 days')"
  ).all<Record<string, unknown>>()

  if (staleTools.length > 0) {
    // B-07: Send admin reminder
    const adminGhIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
    if (adminGhIds.length > 0) {
      const placeholders = adminGhIds.map(() => '?').join(',')
      const { results: admins } = await env.DB.prepare(
        `SELECT * FROM users WHERE github_id IN (${placeholders})`
      ).bind(...adminGhIds).all<UserRecord>()

      const toolList = (staleTools as Record<string, unknown>[])
        .map(t => `• ${t.name} (submitted ${String(t.submitted_at || '').slice(0, 10)})`)
        .join('<br>')

      for (const admin of admins) {
        const adminEmail = getNotifyEmail(admin)
        if (adminEmail) {
          void sendEmail(env, {
            to: adminEmail,
            sceneId: 'B-07',
            subject: `[aifindr] ${staleTools.length} tool(s) awaiting review for 7+ days`,
            html: [
              `<p>The following tools have been pending review for more than 7 days:</p>`,
              `<p>${toolList}</p>`,
              `<p><a href="https://aifindr.org/admin">Review in admin panel →</a></p>`,
            ].join(''),
          })
        }
      }
    }

    console.log(`Cron 1: Found ${staleTools.length} stale pending tools, sent B-07 reminders`)
  }

  // Refresh KV stats cache
  await env.CACHE.delete('stats')
  console.log('Cron 1: KV stats cache cleared')
}

/** Cron 2: Link checker — verify published backlinks and alert on failures (E-01) */
export async function handleCronLinkChecker(env: Env): Promise<{ total: number; dead: number }> {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  // Get links that haven't been checked in the last 24 hours, limit to 20 per run
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
      isAlive = res.ok || res.status === 403 || res.status === 401 // 403/401 = page exists but requires auth
    } catch {
      isAlive = false
    }

    // Update link status
    await env.DB.prepare(
      'UPDATE published_links SET is_active = ?, last_checked = ? WHERE id = ?'
    ).bind(isAlive ? 1 : 0, now, link.id).run()

    if (!isAlive) {
      deadCount++
      // E-01: Backlink failure alert
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
              `<p><a href="https://aifindr.org/settings">View your backlinks →</a></p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    }
  }

  console.log(`Cron 2: Checked ${links.length} links, ${deadCount} dead`)
  return { total: links.length, dead: deadCount }
}

/** Cron 3: Monthly backlink report (E-02) */
export async function handleCronMonthlyReport(env: Env): Promise<{ recipients: number }> {
  // Aggregate stats for all users with published links this month
  const { results: stats } = await env.DB.prepare(
    `SELECT
       p.user_id,
       COUNT(*) as total_links,
       SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_links,
       SUM(CASE WHEN p.is_active = 0 THEN 1 ELSE 0 END) as dead_links,
       SUM(CASE WHEN p.created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as new_links
     FROM published_links p
     WHERE p.user_id IS NOT NULL
     GROUP BY p.user_id`
  ).all<Record<string, unknown>>()

  let recipients = 0

  for (const row of stats) {
    const userId = Number(row.user_id)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue

    recipients++
    const total = Number(row.total_links || 0)
    const active = Number(row.active_links || 0)
    const dead = Number(row.dead_links || 0)
    const newLinks = Number(row.new_links || 0)

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'E-02',
      subject: '[aifindr] Your monthly backlink report',
      html: [
        `<p>Here's your monthly backlink report from aifindr.org:</p>`,
        `<table>`,
        `<tr><td><strong>Total backlinks:</strong></td><td>${total}</td></tr>`,
        `<tr><td><strong>Active:</strong></td><td>${active}</td></tr>`,
        `<tr><td><strong>New this month:</strong></td><td>${newLinks}</td></tr>`,
        ...(dead > 0 ? [`<tr><td><strong>Broken:</strong></td><td>${dead}</td></tr>`] : []),
        `</table>`,
        `<p><a href="https://aifindr.org/settings">View detailed report →</a></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  console.log(`Cron 3: Sent monthly reports to ${recipients} recipients`)
  return { recipients }
}

/** Cron 4: Newsletter — send to users who haven't unsubscribed (F-01) */
export async function handleCronNewsletter(env: Env, subject?: string, body?: string): Promise<{ recipients: number }> {
  const newsletterSubject = subject || 'aifindr Newsletter — Latest AI Tools & Backlink Tips'
  const newsletterBody = body || [
    '<h2>Latest from aifindr.org</h2>',
    '<p>New AI tools have been added this week. Check them out on the <a href="https://aifindr.org/tools?sort=latest">Tools page</a>.</p>',
    '<p><a href="https://aifindr.org">Visit aifindr.org →</a></p>',
    '<p style="color:#666;font-size:11px;">You\'re receiving this because you have aifindr.org notifications enabled. <a href="https://aifindr.org/settings">Unsubscribe</a>.</p>',
  ].join('')

  // Get users who haven't unsubscribed and have email notifications enabled
  const { results: subscribers } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let recipients = 0
  for (const user of subscribers) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    recipients++

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-01',
      subject: newsletterSubject,
      html: newsletterBody,
    })
  }

  console.log(`Cron 4: Sent newsletter to ${recipients} recipients`)
  return { recipients }
}
