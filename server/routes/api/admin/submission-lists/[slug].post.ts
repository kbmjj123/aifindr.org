import { createError, getRouterParam, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { invalidateSubmissionCaches } from '~/server/utils/submissionLists'
import { validateFilterExpression, validateSortRules } from '~/server/utils/submissionFilters'

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (!value.trim()) return null
  try { return JSON.parse(value) } catch { throw new Error('invalid JSON') }
}

const EDITABLE: Record<string, (value: unknown) => string | number | null> = {
  title: v => String(v).trim().slice(0, 160),
  description: v => String(v).trim().slice(0, 600),
  intro: v => String(v).trim().slice(0, 2000),
  methodology: v => String(v).trim().slice(0, 2000),
  seo_title: v => String(v).trim().slice(0, 160),
  seo_description: v => String(v).trim().slice(0, 300),
  canonical_policy: (v) => {
    const value = String(v)
    if (!['self', 'parent'].includes(value)) throw new Error('invalid canonical policy')
    return value
  },
  dimension: (v) => {
    const value = String(v)
    if (!['pricing', 'link', 'authority', 'speed', 'topic', 'alternatives'].includes(value)) throw new Error('invalid dimension')
    return value
  },
  status: (v) => {
    const value = String(v)
    if (!['draft', 'published', 'archived'].includes(value)) throw new Error('invalid status')
    return value
  },
  kind: (v) => {
    const value = String(v)
    if (!['rule', 'curated', 'hybrid'].includes(value)) throw new Error('invalid kind')
    return value
  },
  limit_mode: (v) => {
    const value = String(v)
    if (!['all', 'topN'].includes(value)) throw new Error('invalid limit mode')
    return value
  },
  limit_count: v => Math.max(0, Math.min(1000, Math.floor(Number(v) || 0))),
  min_items: v => Math.max(1, Math.min(100, Math.floor(Number(v) || 10))),
  pinned_order: v => JSON.stringify(Array.isArray(v) ? v.slice(0, 100).map(String) : []),
  include_slugs: v => JSON.stringify(Array.isArray(v) ? v.slice(0, 100).map(String) : []),
  exclude_slugs: v => JSON.stringify(Array.isArray(v) ? v.slice(0, 100).map(String) : []),
  faq: (v) => {
    const parsed = parseMaybeJson(v)
    if (parsed === null) return '[]'
    if (!Array.isArray(parsed)) throw new Error('faq must be an array')
    return JSON.stringify(parsed.slice(0, 20))
  },
  filters: (v) => {
    const parsed = parseMaybeJson(v)
    if (parsed === null || parsed === '') return null
    const check = validateFilterExpression(parsed)
    if (!check.ok) throw new Error(check.reason || 'invalid filters')
    return JSON.stringify(parsed)
  },
  sort: (v) => {
    const parsed = parseMaybeJson(v)
    if (parsed === null || parsed === '') return null
    const check = validateSortRules(parsed)
    if (!check.ok) throw new Error(check.reason || 'invalid sort')
    return JSON.stringify(parsed)
  },
}

/** 编辑榜单定义：策展位、筛选规则、维度、FAQ 与 SEO 字段均可后台调整 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid list slug' })
  }
  const existing = await env.DB.prepare('SELECT slug FROM submission_lists WHERE slug = ?').bind(slug).first()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'List not found' })

  const body = await readBody<Record<string, unknown>>(event)
  const sets: string[] = []
  const params: (string | number | null)[] = []
  for (const [key, parse] of Object.entries(EDITABLE)) {
    if (!Object.hasOwn(body, key)) continue
    try {
      sets.push(`${key} = ?`)
      params.push(parse(body[key]))
    } catch {
      throw createError({ statusCode: 400, statusMessage: `Invalid value for ${key}` })
    }
  }
  if (sets.length === 0) throw createError({ statusCode: 400, statusMessage: 'No fields to update' })

  sets.push('updated_at = ?')
  params.push(new Date().toISOString().replace('T', ' ').slice(0, 19), slug)
  await env.DB.prepare(`UPDATE submission_lists SET ${sets.join(', ')} WHERE slug = ?`).bind(...params).run()

  await invalidateSubmissionCaches(env, slug)
  return {
    ok: true,
    slug,
    updated: sets.length - 1,
    message: 'Definition saved. Refresh the list to apply rule or curation changes to its members.',
  }
})
