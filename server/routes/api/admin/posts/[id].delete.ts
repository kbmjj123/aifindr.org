import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid post ID' })

  const existing = await env.DB.prepare('SELECT slug FROM posts WHERE id = ?').bind(id).first()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  // Clear cache
  await env.CACHE.delete(`blog:${(existing as any).slug}`)

  return { success: true }
})
