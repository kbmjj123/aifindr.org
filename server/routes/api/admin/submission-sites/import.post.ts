import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { slugify } from '~/server/utils/utils'
import {
  loadSiteCategories, normalizeSiteInput, persistSite, refreshRuleLists, siteRowToInput,
} from '~/server/utils/submissionSiteWrite'
import type { SubmissionSite } from '~/types/submissionSite'

/** 批量增量导入：JSON 数组或粘贴的 JSON 文本，单次最多 200 条，最后统一重算榜单 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)
  let items: unknown[] = []
  if (Array.isArray(body.sites)) items = body.sites
  else if (typeof body.json === 'string') {
    try {
      const parsed: unknown = JSON.parse(body.json)
      items = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'json is not valid JSON' })
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Provide sites[] or a json string' })
  }
  if (items.length === 0) throw createError({ statusCode: 400, statusMessage: 'No sites provided' })
  if (items.length > 200) throw createError({ statusCode: 400, statusMessage: 'At most 200 sites per import' })

  const mode = body.mode === 'skip' ? 'skip' : 'update'
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`#${index + 1}: not an object`)
      continue
    }
    const raw = item as Record<string, unknown>
    const name = String(raw.name || '').trim()
    const candidate = String(raw.slug || '').trim()
    const slug = /^[a-z0-9-]{1,120}$/.test(candidate) ? candidate : slugify(name)
    if (!slug || !name || !String(raw.site_url || '').trim()) {
      errors.push(`#${index + 1}: name and site_url are required`)
      continue
    }

    const existing = await env.DB.prepare('SELECT * FROM submission_sites WHERE slug = ?')
      .bind(slug).first<SubmissionSite>()
    if (existing && mode === 'skip') { skipped++; continue }

    try {
      const base = existing
        ? siteRowToInput(existing, await loadSiteCategories(env, slug))
        : undefined
      const row = normalizeSiteInput(raw, base)
      row.slug = slug
      await persistSite(env, row, !existing)
      if (existing) updated++; else created++
    } catch (error) {
      errors.push(`${slug}: ${(error as Error).message || 'write failed'}`)
    }
  }

  const refreshed = await refreshRuleLists(env)
  const joined = refreshed.reduce((sum, item) => sum + item.joined, 0)
  return {
    ok: true,
    created, updated, skipped,
    errors,
    recalculatedLists: refreshed.length,
    newMemberships: joined,
    message: `Imported ${created} new / ${updated} updated (${skipped} skipped). ${refreshed.length} lists recalculated, ${joined} new memberships.`,
  }
})
