import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const query = getQuery(event)

  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt((query.pageSize as string) || '20')))
  const offset = (page - 1) * pageSize
  const search = query.q as string | undefined

  let where = "p.status = 'published'"
  const params: unknown[] = []

  if (search) {
    where += ' AND (pt.title LIKE ? OR pt.meta_desc LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM posts p
     INNER JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = 'en'
     WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: posts } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.status, p.published_at, p.created_at,
            pt.title, pt.meta_desc, pt.cover_image
     FROM posts p
     INNER JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = 'en'
     WHERE ${where}
     ORDER BY p.published_at DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return { posts, total, page, pageSize }
})
