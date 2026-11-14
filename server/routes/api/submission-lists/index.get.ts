import { getEnv } from '~/server/utils/env'
import type { SubmissionList } from '~/types/submissionSite'

const CACHE_KEY = 'submission-lists:index'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const cached = await env.CACHE.get(CACHE_KEY, 'json')
  if (cached) return cached

  const { results } = await env.DB.prepare(`
    SELECT slug, title, description, dimension, kind, item_count, snapshot_id, updated_at
    FROM submission_lists
    WHERE status = 'published' AND item_count >= min_items
    ORDER BY dimension, slug
  `).all<SubmissionList>()

  const response = { lists: results || [], total: (results || []).length }
  await env.CACHE.put(CACHE_KEY, JSON.stringify(response), { expirationTtl: 3600 })
  return response
})
