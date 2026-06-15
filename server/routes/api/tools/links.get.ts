import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const cached = await env.CACHE.get('tools-links', 'json')
  if (cached) return cached

  const { results } = await env.DB.prepare(
    `SELECT website, slug, category FROM tools WHERE status = 'active' AND website != ''`
  ).all<{ website: string; slug: string; category: string }>()

  const map: Record<string, { slug: string; category: string }> = {}
  for (const row of results) {
    const normalized = row.website.replace(/\/$/, '').toLowerCase()
    map[normalized] = { slug: row.slug, category: row.category }
    // Also map www variant
    const www = normalized.replace(/^https?:\/\//, 'https://www.')
    if (www !== normalized) map[www] = { slug: row.slug, category: row.category }
    const noWww = normalized.replace(/^https?:\/\/www\./, 'https://')
    if (noWww !== normalized) map[noWww] = { slug: row.slug, category: row.category }
  }

  await env.CACHE.put('tools-links', JSON.stringify(map), { expirationTtl: 3600 })

  return map
})
