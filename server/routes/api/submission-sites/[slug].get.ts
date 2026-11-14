import { createError, getRouterParam } from 'h3'
import { getEnv } from '~/server/utils/env'
import type { SubmissionSite } from '~/types/submissionSite'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const cacheKey = `submission-site:${slug}`
  const cached = await env.CACHE.get(cacheKey, 'json')
  if (cached) return cached

  const site = await env.DB.prepare(
    "SELECT * FROM submission_sites WHERE slug = ? AND status = 'active'"
  ).bind(slug).first<SubmissionSite>()
  if (!site) throw createError({ statusCode: 404, statusMessage: 'Submission site not found' })

  const { results: categoryRows } = await env.DB.prepare(
    'SELECT category_slug FROM site_categories WHERE site_slug = ? ORDER BY confidence DESC'
  ).bind(slug).all<{ category_slug: string }>()

  const { results: listRows } = await env.DB.prepare(`
    SELECT l.slug, l.title, l.dimension
    FROM submission_list_items li
    JOIN submission_lists l ON l.slug = li.list_slug
    WHERE li.site_slug = ? AND l.status = 'published'
    GROUP BY l.slug
    ORDER BY l.dimension, l.slug
  `).bind(slug).all<{ slug: string; title: string; dimension: string }>()

  const { results: relatedRows } = await env.DB.prepare(`
    SELECT s.slug, s.name, s.domain_rating, s.pricing, r.weight
    FROM site_relations r
    JOIN submission_sites s ON s.slug = r.related_slug AND s.status = 'active'
    WHERE r.site_slug = ? AND r.relation_type = 'similar' AND r.weight >= 3
    ORDER BY r.weight DESC, s.domain_rating DESC
    LIMIT 6
  `).bind(slug).all()

  const response = {
    site,
    categories: (categoryRows || []).map(row => row.category_slug),
    lists: listRows || [],
    related: relatedRows || [],
  }

  await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 })
  return response
})
