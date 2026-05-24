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

  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM tools WHERE status = 'pending'"
  ).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: tools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' ORDER BY submitted_at ASC LIMIT ? OFFSET ?"
  ).bind(pageSize, offset).all()

  return { tools, total, page, pageSize }
})
