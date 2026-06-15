import { createError, getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const query = getQuery(event)

  // counts mode — return aggregate counts per status
  if (query.counts === 'true') {
    const rows = await env.DB.prepare(
      "SELECT status, COUNT(*) as count FROM tools WHERE status IN ('pending','active','rejected') GROUP BY status"
    ).all<{ status: string; count: number }>()
    const counts: Record<string, number> = { pending: 0, active: 0, rejected: 0 }
    for (const row of rows.results || []) {
      counts[row.status] = row.count
    }
    return counts
  }

  const validStatuses = ['pending', 'active', 'rejected', 'needs_info']
  const status = (query.status as string) || 'pending'
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
  }

  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt((query.pageSize as string) || '20')))
  const offset = (page - 1) * pageSize

  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM tools WHERE status = ?'
  ).bind(status).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: tools } = await env.DB.prepare(
    'SELECT * FROM tools WHERE status = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?'
  ).bind(status, pageSize, offset).all()

  return { tools, total, page, pageSize }
})
