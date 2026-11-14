import { getQuery, setResponseHeader } from 'h3'
import { getEnv } from '~/server/utils/env'
import {
  compileFilters, compileSearch, compileSort, csvEscape, parseSiteQuery,
} from '~/server/utils/submissionFilters'
import { SUBMISSION_ATTRIBUTION } from '~/types/submissionSite'

const EXPORT_FIELDS = [
  'slug', 'name', 'site_url', 'submit_url', 'submit_method', 'domain_rating',
  'pricing', 'has_free_submission', 'approval', 'approval_bucket',
  'dofollow_link', 'backlink_required', 'categories', 'page_rank', 'source_snapshot',
  'verification_status', 'summary',
] as const

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const query = getQuery(event) as Record<string, unknown>
  const parsed = parseSiteQuery(query)
  const filters = compileFilters(parsed.expression)
  const search = compileSearch(parsed.search)
  const where = `s.status = 'active'${filters.where}${search.where}`
  const params = [...filters.params, ...search.params]

  const { results } = await env.DB.prepare(
    `SELECT s.* FROM submission_sites s WHERE ${where} ORDER BY ${compileSort(parsed.sort)} LIMIT 5000`
  ).bind(...params).all<Record<string, unknown>>()
  const { results: categoryRows } = await env.DB.prepare(
    'SELECT site_slug, category_slug FROM site_categories ORDER BY category_slug'
  ).all<{ site_slug: string; category_slug: string }>()
  const categoriesBySlug = new Map<string, string[]>()
  for (const item of categoryRows || []) {
    const bucket = categoriesBySlug.get(item.site_slug) || []
    bucket.push(item.category_slug)
    categoriesBySlug.set(item.site_slug, bucket)
  }
  const rows = (results || []).map(row => ({
    ...row,
    categories: categoriesBySlug.get(String(row.slug)) || [],
  }))

  const format = query.format === 'csv' ? 'csv' : 'json'
  const filename = `aifindr-submission-sites-${new Date().toISOString().slice(0, 10)}.${format}`

  if (format === 'csv') {
    const lines = [EXPORT_FIELDS.join(',')]
    for (const row of rows) {
      lines.push(EXPORT_FIELDS.map(field =>
        csvEscape(field === 'categories' ? (row.categories as string[]).join(' | ') : row[field])
      ).join(','))
    }
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
    total: rows.length,
    fields: EXPORT_FIELDS,
    sites: rows.map(row => Object.fromEntries(EXPORT_FIELDS.map(field => [field, row[field]]))),
  }
})
