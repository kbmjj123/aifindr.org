import { createError, getQuery, getRouterParam } from 'h3'
import { getEnv } from '~/server/utils/env'
import type { SubmissionList, SubmissionSite, SubmissionListDetailResponse } from '~/types/submissionSite'

export default defineEventHandler(async (event): Promise<SubmissionListDetailResponse> => {
  const env = getEnv(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid list slug' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Math.min(1000, Math.floor(Number(query.page) || 1)))
  const pageSize = Math.max(1, Math.min(100, Math.floor(Number(query.pageSize) || 50)))

  const list = await env.DB.prepare(
    "SELECT * FROM submission_lists WHERE slug = ? AND status = 'published'"
  ).bind(slug).first<SubmissionList>()
  if (!list) throw createError({ statusCode: 404, statusMessage: 'List not found' })

  const cacheKey = `submission-list:${slug}:${page}:${pageSize}`
  const cached = await env.CACHE.get(cacheKey, 'json')
  if (cached) return cached as SubmissionListDetailResponse

  const snapshotId = list.snapshot_id || ''
  const countRow = await env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM submission_list_items li
    JOIN submission_sites s ON s.slug = li.site_slug AND s.status = 'active'
    WHERE li.list_slug = ? AND li.snapshot_id = ?
  `).bind(slug, snapshotId).first<{ total: number }>()

  const { results } = await env.DB.prepare(`
    SELECT s.*, li.position, li.pinned
    FROM submission_list_items li
    JOIN submission_sites s ON s.slug = li.site_slug
    WHERE li.list_slug = ? AND li.snapshot_id = ? AND s.status = 'active'
    ORDER BY li.position ASC
    LIMIT ? OFFSET ?
  `).bind(slug, snapshotId, pageSize, (page - 1) * pageSize).all<SubmissionSite>()

  const response: SubmissionListDetailResponse = {
    list,
    sites: results || [],
    total: countRow?.total ?? 0,
    page,
    pageSize,
  }

  await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 })
  return response
})
