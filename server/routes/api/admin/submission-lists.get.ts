import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const { results: lists } = await env.DB.prepare(
    'SELECT * FROM submission_lists ORDER BY dimension, slug'
  ).all()
  const { results: reports } = await env.DB.prepare(
    "SELECT * FROM submission_site_reports WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50"
  ).all()
  const { results: statusRows } = await env.DB.prepare(
    'SELECT status, COUNT(*) AS count FROM submission_sites GROUP BY status'
  ).all<{ status: string; count: number }>()
  const { results: categoryRows } = await env.DB.prepare(
    'SELECT category_slug, COUNT(*) AS count FROM site_categories GROUP BY category_slug ORDER BY count DESC'
  ).all<{ category_slug: string; count: number }>()
  const { results: changes } = await env.DB.prepare(`
    SELECT c.list_slug, c.site_slug, c.change_type, c.created_at, s.name
    FROM submission_list_changelog c
    LEFT JOIN submission_sites s ON s.slug = c.site_slug
    ORDER BY c.id DESC LIMIT 20
  `).all()
  const relationRow = await env.DB.prepare(
    'SELECT COUNT(*) AS total FROM site_relations WHERE confirmed = 0'
  ).first<{ total: number }>()

  return {
    lists: lists || [],
    reports: reports || [],
    siteCounts: Object.fromEntries((statusRows || []).map(row => [row.status, row.count])),
    categories: categoryRows || [],
    recentChanges: changes || [],
    unconfirmedRelations: relationRow?.total ?? 0,
  }
})
