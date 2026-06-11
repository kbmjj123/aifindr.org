import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody(event)
  const { slug, status = 'draft', translations = {}, custom_fields = [] } = body

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }
  if (!translations.en?.title && !translations.zh?.title) {
    throw createError({ statusCode: 400, statusMessage: 'At least one translation requires a title' })
  }

  // Check slug uniqueness
  const existing = await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first()
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
  }

  const now = Math.floor(Date.now() / 1000)
  const publishedAt = status === 'published' ? now : null

  const result = await env.DB.prepare(
    'INSERT INTO posts (slug, status, author_id, published_at) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(slug, status, admin.sub, publishedAt).first<{ id: number }>()

  if (!result) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create post' })
  }

  const postId = result.id

  // Insert translations
  for (const [locale, t] of Object.entries(translations) as [string, any][]) {
    if (!t.title && !t.content) continue
    await env.DB.prepare(
      'INSERT INTO post_translations (post_id, locale, title, content, cover_image, meta_desc) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(postId, locale, t.title || '', t.content || '', t.cover_image || '', t.meta_desc || '').run()
  }

  // Insert custom fields
  if (Array.isArray(custom_fields)) {
    for (const cf of custom_fields) {
      if (!cf.key) continue
      await env.DB.prepare(
        'INSERT INTO custom_fields (post_id, key, value) VALUES (?, ?, ?)'
      ).bind(postId, cf.key, cf.value || '').run()
    }
  }

  // Clear cache
  await env.CACHE.delete(`blog:${slug}`)

  return { id: postId, slug }
})
