import { createError, getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import type { SubmissionSite } from '~/types/submissionSite'

/** 后台站点列表：供定位、编辑、补齐 needs_info 条目 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const query = getQuery(event)
  const q = String(query.q || '').trim().slice(0, 120)
  const status = String(query.status || '').trim()
  const conditions: string[] = []
  const params: unknown[] = []
  if (['active', 'needs_info', 'hidden'].includes(status)) {
    conditions.push('s.status = ?')
    params.push(status)
  }
  if (q) {
    conditions.push('(s.name LIKE ? OR s.slug LIKE ? OR s.site_url LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.page) || 1)))
  const pageSize = Math.max(1, Math.min(100, Math.floor(Number(query.pageSize) || 20)))

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM submission_sites s ${where}`
  ).bind(...params).first<{ total: number }>()

  const { results } = await env.DB.prepare(`
    SELECT s.slug, s.name, s.site_url, s.submit_url, s.domain_rating, s.pricing,
           s.status, s.indexed, s.data_source, s.verification_status, s.updated_at,
           (SELECT COUNT(*) FROM site_categories sc WHERE sc.site_slug = s.slug) AS category_count
    FROM submission_sites s ${where}
    ORDER BY s.status ASC, s.domain_rating DESC, s.slug ASC
    LIMIT ? OFFSET ?
  `).bind(...params, pageSize, (page - 1) * pageSize).all<SubmissionSite & { category_count: number }>()

  return { sites: results || [], total: countRow?.total ?? 0, page, pageSize }
})
