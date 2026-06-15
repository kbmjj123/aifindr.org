import { createError, getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const query = getQuery(event)
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt((query.pageSize as string) || '20')))
  const offset = (page - 1) * pageSize
  const search = (query.q as string || '').trim()

  let countSql = 'SELECT COUNT(*) as total FROM users'
  let listSql = `
    SELECT u.*,
      (SELECT COUNT(*) FROM tools WHERE submitter_id = u.id) as tool_count
    FROM users u
  `
  const params: any[] = []

  if (search) {
    const where = 'WHERE u.username LIKE ? OR u.email LIKE ? OR u.contact_email LIKE ?'
    const like = `%${search}%`
    countSql += ` ${where}`
    listSql += ` ${where}`
    params.push(like, like, like)
  }

  listSql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  const countResult = await env.DB.prepare(countSql).bind(...params.slice(0, search ? 3 : 0)).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: users } = await env.DB.prepare(listSql).bind(...params).all()

  return { users, total, page, pageSize }
})
