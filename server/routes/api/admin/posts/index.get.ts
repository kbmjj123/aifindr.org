import { createError, getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const query = getQuery(event)
  const status = query.status as string | undefined
  const search = query.q as string | undefined
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt((query.pageSize as string) || '20')))
  const offset = (page - 1) * pageSize

  let where = '1=1'
  const params: unknown[] = []

  if (status === 'draft' || status === 'published') {
    where += ' AND p.status = ?'
    params.push(status)
  }

  if (search) {
    where += ' AND (pt.title LIKE ? OR p.slug LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM posts p
     LEFT JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = 'en'
     WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: posts } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.status, p.author_id, p.created_at, p.updated_at, p.published_at,
            pt.title, pt.locale
     FROM posts p
     LEFT JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = 'en'
     WHERE ${where}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return { posts, total, page, pageSize }
})
