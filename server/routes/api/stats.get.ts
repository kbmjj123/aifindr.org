import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const cacheKey = 'stats:v2'

  const cached = await env.CACHE.get(cacheKey, 'json') as {
    tools: number; categories: number; contributors: number; sites: number; lists: number
  } | null
  if (cached) {
    return cached
  }

  const toolCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE status = 'active'"
  ).first<{ count: number }>()

  const categoryCount = await env.DB.prepare(
    "SELECT COUNT(DISTINCT category) as count FROM tools WHERE status = 'active'"
  ).first<{ count: number }>()

  const contributorCount = await env.DB.prepare(
    "SELECT COUNT(DISTINCT submitter_github) as count FROM tools WHERE status = 'active' AND submitter_github IS NOT NULL AND submitter_github != ''"
  ).first<{ count: number }>()

  const siteCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM submission_sites WHERE status = 'active'"
  ).first<{ count: number }>()

  const listCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM submission_lists WHERE status = 'published' AND item_count >= min_items"
  ).first<{ count: number }>()

  const stats = {
    tools: toolCount?.count || 0,
    categories: categoryCount?.count || 0,
    contributors: contributorCount?.count || 0,
    sites: siteCount?.count || 0,
    lists: listCount?.count || 0,
  }

  await env.CACHE.put(cacheKey, JSON.stringify(stats), { expirationTtl: 3600 })

  return stats
})
