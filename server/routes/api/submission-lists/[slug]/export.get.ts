import { createError, getQuery, getRouterParam, setResponseHeader } from 'h3'
import { getEnv } from '~/server/utils/env'
import { csvEscape } from '~/server/utils/submissionFilters'
import { SUBMISSION_ATTRIBUTION } from '~/types/submissionSite'

const EXPORT_FIELDS = [
  'position', 'slug', 'name', 'site_url', 'submit_url', 'domain_rating',
  'pricing', 'dofollow_link', 'backlink_required', 'approval', 'summary',
] as const

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid list slug' })
  }

  const list = await env.DB.prepare(
    "SELECT slug, title, snapshot_id, methodology FROM submission_lists WHERE slug = ? AND status = 'published'"
  ).bind(slug).first<{ slug: string; title: string; snapshot_id: string | null; methodology: string | null }>()
  if (!list) throw createError({ statusCode: 404, statusMessage: 'List not found' })

  const { results } = await env.DB.prepare(`
    SELECT s.slug, s.name, s.site_url, s.submit_url, s.domain_rating, s.pricing,
           s.dofollow_link, s.backlink_required, s.approval, s.summary, li.position
    FROM submission_list_items li
    JOIN submission_sites s ON s.slug = li.site_slug
    WHERE li.list_slug = ? AND li.snapshot_id = ? AND s.status = 'active'
    ORDER BY li.position ASC
    LIMIT 5000
  `).bind(slug, list.snapshot_id || '').all<Record<string, unknown>>()
  const rows = results || []

  const format = (getQuery(event) as Record<string, unknown>).format === 'csv' ? 'csv' : 'json'
  const filename = `aifindr-${slug}.${format}`

  if (format === 'csv') {
    const lines = [EXPORT_FIELDS.join(',')]
    for (const row of rows) lines.push(EXPORT_FIELDS.map(field => csvEscape(row[field])).join(','))
    setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'content-disposition', `attachment; filename="${filename}"`)
    setResponseHeader(event, 'cache-control', 'public, max-age=3600')
    return lines.join('\n')
  }

  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')
  setResponseHeader(event, 'content-disposition', `attachment; filename="${filename}"`)
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return {
    license: 'CC0-1.0 applies to aifindr.org\'s compilation and editorial text only.',
    attribution: SUBMISSION_ATTRIBUTION,
    list: { slug: list.slug, title: list.title, methodology: list.methodology },
    total: rows.length,
    sites: rows.map(row => Object.fromEntries(EXPORT_FIELDS.map(field => [field, row[field]]))),
  }
})
