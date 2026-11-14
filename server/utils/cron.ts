import { logger } from './logger'
import type { CloudflareEnv } from './env'
import { siteUrl } from './env'
import { getNotifyEmail, sendEmail } from './email'
import type { UserRecord } from './jwt'

/** Cron 1: Daily operations — check stale pending tools + refresh cache */
export async function handleCronDailyOps(env: CloudflareEnv): Promise<void> {
  const { results: staleTools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' AND submitted_at < datetime('now', '-7 days')"
  ).all<Record<string, unknown>>()

  if (staleTools.length > 0) {
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
              `<p><a href="${siteUrl(env, '/admin')}">Review in admin panel →</a></p>`,
            ].join(''),
          })
        }
      }
    }

    logger.info('cron', `Cron 1: Found ${staleTools.length} stale pending tools, sent B-07 reminders`)
  }

  await env.CACHE.delete('stats')
  logger.info('cron', 'Cron 1: KV stats cache cleared')
}

/** Cron 2: Link checker — verify published backlinks and alert on failures (E-01) */
export async function handleCronLinkChecker(env: CloudflareEnv): Promise<{ total: number; dead: number }> {
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

  logger.info('cron', `Cron 2: Checked ${links.length} links, ${deadCount} dead`)
  return { total: links.length, dead: deadCount }
}

/** Cron 3: Monthly backlink report (E-02) */
export async function handleCronMonthlyReport(env: CloudflareEnv): Promise<{ recipients: number }> {
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
        `<p><a href="${siteUrl(env, '/settings')}">View detailed report →</a></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  logger.info('cron', `Cron 3: Sent monthly reports to ${recipients} recipients`)
  return { recipients }
}

/** Cron 4: Newsletter — send to users who haven't unsubscribed (F-01) */
export async function handleCronNewsletter(env: CloudflareEnv, subject?: string, body?: string): Promise<{ recipients: number }> {
  const newsletterSubject = subject || 'aifindr Newsletter — Latest AI Tools & Backlink Tips'
  const newsletterBody = body || [
    '<h2>Latest from aifindr.org</h2>',
    `<p>New AI tools have been added this week. Check them out on the <a href="${siteUrl(env, '/tools')}?sort=latest">Tools page</a>.</p>`,
    `<p><a href="${siteUrl(env)}">Visit aifindr.org →</a></p>`,
    `<p style="color:#666;font-size:11px;">You're receiving this because you have aifindr.org notifications enabled. <a href="${siteUrl(env, '/settings')}">Unsubscribe</a>.</p>`,
  ].join('')

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

  logger.info('cron', `Cron 4: Sent newsletter to ${recipients} recipients`)
  return { recipients }
}

/**
 * Cron 5: Submission-site availability check — keep `last_checked_at` and `availability` fresh.
 * Note: this cannot refresh domain_rating. Ahrefs has no free public API; its free tools are
 * front-end forms behind Cloudflare and cannot be queried in bulk. DR stays a 2026-11-13 snapshot.
 */
export async function handleCronSubmissionSitesCheck(env: CloudflareEnv): Promise<{ checked: number; unreachable: number }> {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const { results: sites } = await env.DB.prepare(`
    SELECT slug, site_url, submit_url
    FROM submission_sites
    WHERE status = 'active'
      AND (last_checked_at IS NULL OR last_checked_at < datetime('now', '-30 days'))
    ORDER BY last_checked_at ASC LIMIT 60
  `).all<{ slug: string; site_url: string | null; submit_url: string | null }>()

  let unreachable = 0
  for (const site of sites || []) {
    const urls = [site.site_url, site.submit_url].filter(Boolean) as string[]
    let reachable = false
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'aifindr-site-checker/1.0' },
        })
        if (res.ok || res.status === 403 || res.status === 401) { reachable = true; break }
      } catch { /* try the next URL */ }
    }
    if (!reachable) unreachable++
    await env.DB.prepare(
      'UPDATE submission_sites SET last_checked_at = ?, availability = ? WHERE slug = ?'
    ).bind(now, reachable ? 'reachable' : 'unreachable', site.slug).run()
  }

  logger.info('cron', `Cron 5: checked ${(sites || []).length} submission sites, ${unreachable} unreachable`)
  await env.CACHE.delete('submission-sites-facets').catch(() => {})
  return { checked: (sites || []).length, unreachable }
}

/**
 * Cron 6: Refresh `page_rank` from Open PageRank's free API (legitimate, key-based, rate-limited).
 * Returns a 0–10 PageRank estimate — a different scale from Ahrefs `domain_rating` (0–100), so the
 * two are stored separately and labelled by source. No key configured → skip gracefully.
 * Free tier is ~100 requests/month; batching 50 hosts/request keeps us well under that.
 */
export async function handleCronDomainRating(env: CloudflareEnv): Promise<{ checked: number; updated: number; skipped: boolean }> {
  const apiKey = env.OPENPAGERANK_API_KEY
  if (!apiKey) {
    logger.warn('cron', 'Cron 6: OPENPAGERANK_API_KEY not set, skipping domain rating refresh')
    return { checked: 0, updated: 0, skipped: true }
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const { results: sites } = await env.DB.prepare(`
    SELECT slug, site_url, submit_url
    FROM submission_sites
    WHERE status = 'active'
      AND (page_rank_checked_at IS NULL OR page_rank_checked_at < datetime('now', '-30 days'))
    ORDER BY page_rank_checked_at ASC LIMIT 50
  `).all<{ slug: string; site_url: string | null; submit_url: string | null }>()

  const targets = (sites || [])
    .map((s) => {
      const url = s.site_url || s.submit_url
      if (!url) return null
      try {
        return { slug: s.slug, host: new URL(url).host.replace(/^www\./, '') }
      } catch {
        return null
      }
    })
    .filter((t): t is { slug: string; host: string } => t !== null)

  if (!targets.length) return { checked: 0, updated: 0, skipped: false }

  const hosts = [...new Set(targets.map((t) => t.host))]
  const url = `https://openpagerank.com/api/v1.0/getPageRank?${hosts.map((h) => `domains[]=${encodeURIComponent(h)}`).join('&')}`

  let data: { response?: Array<{ domain?: string; page_rank_decimal?: string }> }
  try {
    const res = await fetch(url, { headers: { 'API-OPR': apiKey } })
    if (!res.ok) {
      logger.error('cron', `Cron 6: Open PageRank returned HTTP ${res.status}`)
      return { checked: 0, updated: 0, skipped: false }
    }
    data = await res.json() as typeof data
  } catch (e) {
    logger.error('cron', `Cron 6: Open PageRank fetch failed: ${String(e)}`)
    return { checked: 0, updated: 0, skipped: false }
  }

  const rankByHost = new Map<string, number | null>()
  for (const item of data?.response || []) {
    const raw = Number(item?.page_rank_decimal)
    rankByHost.set(String(item?.domain), Number.isFinite(raw) && raw > 0 ? raw : null)
  }

  let updated = 0
  for (const t of targets) {
    const value = rankByHost.has(t.host) ? (rankByHost.get(t.host) ?? null) : null
    await env.DB.prepare(
      'UPDATE submission_sites SET page_rank = ?, page_rank_checked_at = ? WHERE slug = ?'
    ).bind(value, now, t.slug).run()
    if (value !== null) updated++
  }

  logger.info('cron', `Cron 6: refreshed page_rank for ${targets.length} sites, ${updated} ranked`)
  await env.CACHE.delete('submission-sites-facets').catch(() => {})
  return { checked: targets.length, updated, skipped: false }
}
