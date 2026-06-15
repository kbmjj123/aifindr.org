import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid post ID' })

  const existing = await env.DB.prepare('SELECT id, slug FROM posts WHERE id = ?').bind(id).first()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const body = await readBody(event)
  const { slug, status, translations = {}, custom_fields } = body
  const oldSlug = (existing as any).slug

  const now = Math.floor(Date.now() / 1000)

  // Update post record
  if (slug || status) {
    const updates: string[] = ['updated_at = ?']
    const params: unknown[] = [now]

    if (slug) {
      // Check slug uniqueness (exclude self)
      const slugExists = await env.DB.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').bind(slug, id).first()
      if (slugExists) throw createError({ statusCode: 409, statusMessage: 'Slug already taken' })
      updates.push('slug = ?')
      params.push(slug)
    }

    if (status) {
      if (!['draft', 'published'].includes(status)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
      }
      updates.push('status = ?')
      params.push(status)
      if (status === 'published') {
        updates.push('published_at = COALESCE(published_at, ?)')
        params.push(now)
      }
    }

    params.push(id)
    await env.DB.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()
  }

  // Upsert translations
  for (const [locale, t] of Object.entries(translations) as [string, any][]) {
    if (!t.title && !t.content) continue
    await env.DB.prepare(
      `INSERT INTO post_translations (post_id, locale, title, content, cover_image, meta_desc)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(post_id, locale) DO UPDATE SET
         title = excluded.title,
         content = excluded.content,
         cover_image = excluded.cover_image,
         meta_desc = excluded.meta_desc`
    ).bind(id, locale, t.title || '', t.content || '', t.cover_image || '', t.meta_desc || '').run()
  }

  // Replace custom fields
  if (Array.isArray(custom_fields)) {
    await env.DB.prepare('DELETE FROM custom_fields WHERE post_id = ?').bind(id).run()
    for (const cf of custom_fields) {
      if (!cf.key) continue
      await env.DB.prepare(
        'INSERT INTO custom_fields (post_id, key, value) VALUES (?, ?, ?)'
      ).bind(id, cf.key, cf.value || '').run()
    }
  }

  // Clear cache
  await env.CACHE.delete(`blog:${oldSlug}`)
  if (slug && slug !== oldSlug) {
    await env.CACHE.delete(`blog:${slug}`)
  }

  return { success: true }
})
