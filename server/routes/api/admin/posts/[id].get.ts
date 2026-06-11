import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid post ID' })

  const post = await env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(id).first()

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  // Get translations
  const { results: translations } = await env.DB.prepare(
    'SELECT * FROM post_translations WHERE post_id = ?'
  ).bind(id).all<{ locale: string; title: string; content: string | null; cover_image: string | null; meta_desc: string | null }>()

  // Get custom fields
  const { results: customFields } = await env.DB.prepare(
    'SELECT * FROM custom_fields WHERE post_id = ?'
  ).bind(id).all<{ key: string; value: string }>()

  // Shape translations as { en: {...}, zh: {...} }
  const tMap: Record<string, any> = {}
  for (const t of translations || []) {
    tMap[t.locale] = {
      title: t.title,
      content: t.content,
      cover_image: t.cover_image,
      meta_desc: t.meta_desc,
    }
  }

  return {
    ...post,
    translations: tMap,
    custom_fields: customFields || [],
  }
})
