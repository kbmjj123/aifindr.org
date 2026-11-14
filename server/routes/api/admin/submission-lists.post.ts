import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { validateFilterExpression, validateSortRules } from '~/server/utils/submissionFilters'
import { invalidateSubmissionCaches, refreshList } from '~/server/utils/submissionLists'
import type { FilterExpression, ListDimension, ListKind, SortRule, SubmissionList } from '~/types/submissionSite'

const DIMENSIONS: ListDimension[] = ['pricing', 'link', 'authority', 'speed', 'topic']
const KINDS: ListKind[] = ['rule', 'curated', 'hybrid']

/** 新建榜单：DSL 校验 → 落库 → 立即物化成员。成员不足 min_items 时强制留为 draft */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)
  const str = (key: string, fallback = '', max = 2000) => String(body[key] ?? '').trim().slice(0, max) || fallback
  const slug = str('slug', '', 80)
  const title = str('title', '', 160)
  const dimension = str('dimension', 'topic', 20) as ListDimension
  const kind = str('kind', 'rule', 20) as ListKind
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  if (!title) throw createError({ statusCode: 400, statusMessage: 'title is required' })
  if (!DIMENSIONS.includes(dimension)) throw createError({ statusCode: 400, statusMessage: 'Invalid dimension' })
  if (!KINDS.includes(kind)) throw createError({ statusCode: 400, statusMessage: 'Invalid kind' })

  const existing = await env.DB.prepare('SELECT slug FROM submission_lists WHERE slug = ?').bind(slug).first()
  if (existing) throw createError({ statusCode: 409, statusMessage: 'A list with this slug already exists' })

  const filters: FilterExpression | null = body.filters
    ? (typeof body.filters === 'string'
      ? (safeParse(body.filters) as FilterExpression | null)
      : (body.filters as FilterExpression))
    : null
  const sort: SortRule[] | null = body.sort
    ? (typeof body.sort === 'string'
      ? (safeParse(body.sort) as SortRule[] | null)
      : (body.sort as SortRule[]))
    : null
  const filterCheck = validateFilterExpression(filters)
  if (!filterCheck.ok) throw createError({ statusCode: 400, statusMessage: `Invalid filters: ${filterCheck.reason}` })
  const sortCheck = validateSortRules(sort)
  if (!sortCheck.ok) throw createError({ statusCode: 400, statusMessage: `Invalid sort: ${sortCheck.reason}` })

  const limitMode = str('limit_mode', 'all', 10) === 'topN' ? 'topN' : 'all'
  const limitCount = Math.max(0, Math.min(1000, Math.floor(Number(body.limit_count) || 0)))
  const minItems = Math.max(1, Math.min(100, Math.floor(Number(body.min_items) || 10)))
  const requestedStatus = ['draft', 'published', 'archived'].includes(str('status', 'draft', 20))
    ? str('status', 'draft', 20)
    : 'draft'
  const description = str('description', '', 600)
  const intro = str('intro', `${description} This list is generated from the aifindr.org submission directory.`, 2000)
  const methodology = str('methodology',
    'Members are selected by the published filter expression and ordered by the list sort rule. Domain rating is a third-party metric and is not measured by aifindr.org.',
    2000)
  const arrays = (key: string) => Array.isArray(body[key])
    ? JSON.stringify((body[key] as unknown[]).slice(0, 100).map(String))
    : '[]'
  const faq = Array.isArray(body.faq)
    ? JSON.stringify((body.faq as unknown[]).slice(0, 20))
    : '[]'

  const snapshotRow = await env.DB.prepare(
    'SELECT snapshot_id FROM submission_lists WHERE snapshot_id IS NOT NULL ORDER BY item_count DESC LIMIT 1'
  ).first<{ snapshot_id: string }>()
  const snapshotId = snapshotRow?.snapshot_id || 'manual'

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await env.DB.prepare(`
    INSERT INTO submission_lists (
      slug, title, description, dimension, kind, filters, sort, limit_mode, limit_count, min_items,
      include_slugs, exclude_slugs, pinned_order, intro, methodology, faq,
      seo_title, seo_description, canonical_policy, status, snapshot_id, item_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    slug, title, description, dimension, kind,
    filters ? JSON.stringify(filters) : null,
    sort ? JSON.stringify(sort) : null,
    limitMode, limitCount, minItems,
    arrays('include_slugs'), arrays('exclude_slugs'), arrays('pinned_order'),
    intro, methodology, faq,
    `${title} (2026)`, `${description} ${minItems}+ platforms, ordered by the published criteria.`,
    'self', 'draft', snapshotId, 0, now, now,
  ).run()

  const list = await env.DB.prepare('SELECT * FROM submission_lists WHERE slug = ?').bind(slug).first<SubmissionList>()
  if (!list) throw createError({ statusCode: 500, statusMessage: 'List was not created' })
  const result = await refreshList(env, list, snapshotId)

  const finalStatus = result.after >= minItems ? requestedStatus : 'draft'
  if (finalStatus !== 'draft' || requestedStatus !== 'draft') {
    await env.DB.prepare('UPDATE submission_lists SET status = ?, updated_at = ? WHERE slug = ?')
      .bind(finalStatus, now, slug).run()
  }
  await invalidateSubmissionCaches(env, slug)

  return {
    ok: true,
    slug,
    status: finalStatus,
    itemCount: result.after,
    message: result.after >= minItems
      ? `List created with ${result.after} members (${finalStatus}).`
      : `List created as draft: only ${result.after} members, below min_items (${minItems}). Add more sites or lower the threshold.`,
  }
})

function safeParse(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}
