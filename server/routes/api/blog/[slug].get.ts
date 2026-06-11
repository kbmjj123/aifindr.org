import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  // Try KV cache first
  const cacheKey = `blog:${slug}`
  const cached = await env.CACHE.get(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) } catch { /* stale, re-fetch */ }
  }

  const post = await env.DB.prepare(
    `SELECT p.id, p.slug, p.status, p.published_at, p.created_at, p.updated_at,
            pt.locale, pt.title, pt.content, pt.cover_image, pt.meta_desc
     FROM posts p
     INNER JOIN post_translations pt ON pt.post_id = p.id
     WHERE p.slug = ? AND p.status = 'published'`
  ).bind(slug).all<{
    id: number; slug: string; status: string
    published_at: number | null; created_at: number; updated_at: number | null
    locale: string; title: string; content: string | null
    cover_image: string | null; meta_desc: string | null
  }>()

  if (!post.results || post.results.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  // Group translations by locale
  const translations: Record<string, any> = {}
  for (const row of post.results) {
    translations[row.locale] = {
      title: row.title,
      content: row.content,
      cover_image: row.cover_image,
      meta_desc: row.meta_desc,
    }
  }

  const first = post.results[0]!
  const result = {
    id: first.id,
    slug: first.slug,
    status: first.status,
    published_at: first.published_at,
    created_at: first.created_at,
    updated_at: first.updated_at,
    translations,
  }

  // Cache for 1 hour
  await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 })

  return result
})
