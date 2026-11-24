import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { writeListingPage, safeHttpUrl } from '~/server/utils/githubBacklink'

interface BackfillPayload {
  dryRun?: boolean       // 默认 true：只预览不写入
  force?: boolean        // 默认 false：已有 content_path 的工具跳过
  limit?: number         // 单次最多处理多少条，默认 100
}

interface ListingRow {
  id: number
  slug: string
  category: string
  name: string
  website: string | null
  pricing: string | null
  short_description: string | null
  submitter_github: string | null
  submitter_site: string | null
  content_path: string | null
}

/**
 * 一次性批量补生成 GitHub Pages 收录页。
 * 只对 status=active 且 submitter_site 为合法 http(s) 的工具生效；
 * 成功生成后回写 tools.content_path。失败只记入报告，不中断批次。
 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody<BackfillPayload>(event).catch(() => ({}))
  const dryRun = body.dryRun !== false
  const force = body.force === true
  const limit = Math.max(1, Math.min(Number(body.limit) || 100, 500))

  const tokenConfigured = !!env.GITHUB_BACKLINK_TOKEN
  if (!dryRun && !tokenConfigured) {
    throw createError({
      statusCode: 400,
      statusMessage: 'GITHUB_BACKLINK_TOKEN is not configured in this Worker',
    })
  }

  const { results } = await env.DB.prepare(`
    SELECT id, slug, category, name, website, pricing, short_description,
           submitter_github, submitter_site, content_path
    FROM tools
    WHERE status = 'active' AND submitter_site IS NOT NULL AND submitter_site != ''
    ORDER BY id
    LIMIT ?
  `).bind(limit).all<ListingRow>()

  const report = {
    dryRun, force, tokenConfigured,
    candidates: results.length,
    wouldWrite: 0, written: 0, skipped: 0, failed: 0,
    skippedByInvalidUrl: 0, skippedByExisting: 0,
    details: [] as { id: number; slug: string; action: string; reason?: string; path?: string }[],
  }

  for (const row of results) {
    if (!safeHttpUrl(row.submitter_site)) {
      report.skippedByInvalidUrl++
      report.details.push({ id: row.id, slug: row.slug, action: 'skipped', reason: 'invalid submitter_site' })
      continue
    }
    if (row.content_path && !force) {
      report.skippedByExisting++
      report.details.push({ id: row.id, slug: row.slug, action: 'skipped', reason: 'already has content_path' })
      continue
    }
    if (dryRun) {
      report.wouldWrite++
      report.details.push({ id: row.id, slug: row.slug, action: 'would_write' })
      continue
    }
    try {
      const listing = await writeListingPage(env, {
        slug: row.slug,
        category: row.category,
        name: row.name,
        website: row.website,
        pricing: row.pricing,
        shortDescription: row.short_description,
        submitterGithub: row.submitter_github,
        submitterSite: row.submitter_site,
        existingPath: row.content_path,
      })
      if (listing) {
        if (listing.path !== row.content_path) {
          await env.DB.prepare('UPDATE tools SET content_path = ? WHERE id = ?')
            .bind(listing.path, row.id).run()
        }
        report.written++
        report.details.push({ id: row.id, slug: row.slug, action: 'written', path: listing.path })
      } else {
        report.skipped++
        report.details.push({ id: row.id, slug: row.slug, action: 'skipped', reason: 'writeListingPage returned null' })
      }
    } catch (e) {
      report.failed++
      report.details.push({
        id: row.id, slug: row.slug, action: 'failed',
        reason: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (!dryRun && report.written > 0) {
    await env.CACHE.delete('stats').catch(() => {})
    await env.CACHE.delete('sitemap-xml').catch(() => {})
    await env.CACHE.delete('contributors').catch(() => {})
    await env.CACHE.delete('tools-links').catch(() => {})
  }

  return report
})
