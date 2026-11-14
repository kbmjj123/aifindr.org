import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { slugify } from '~/server/utils/utils'
import { normalizeSiteInput, persistSite, refreshRuleLists } from '~/server/utils/submissionSiteWrite'

/** 管理员新增平台：字段门禁 + 自动重算规则型榜单（新增即累加） */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)
  const row = normalizeSiteInput(body)
  row.slug = /^[a-z0-9-]{1,120}$/.test(String(body.slug || '').trim())
    ? String(body.slug).trim()
    : slugify(row.name)
  if (!row.slug || !row.name || !row.site_url) {
    throw createError({ statusCode: 400, statusMessage: 'name and site_url are required' })
  }

  const existing = await env.DB.prepare('SELECT slug FROM submission_sites WHERE slug = ?').bind(row.slug).first()
  if (existing) throw createError({ statusCode: 409, statusMessage: 'A platform with this slug already exists' })

  const result = await persistSite(env, row, true)
  const refreshed = await refreshRuleLists(env)
  const joined = refreshed.reduce((sum, item) => sum + item.joined, 0)

  return {
    ok: true,
    slug: row.slug,
    ...result,
    joinedLists: joined,
    message: result.complete
      ? `Site added and automatically included in ${refreshed.length} recalculated lists (${joined} new memberships).`
      : 'Site saved as needs_info. Complete the required fields before it can appear in lists.',
  }
})
