import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const query = getQuery(event)

  const q = (query.q as string) || ''
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt((query.pageSize as string) || '20')))

  if (!q.trim()) {
    return { tools: [], query: q, total: 0, page, pageSize }
  }

  const like = `%${q.trim()}%`
  const offset = (page - 1) * pageSize

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM tools t WHERE t.status = 'active' AND (t.name LIKE ? OR t.meta_description LIKE ? OR EXISTS (SELECT 1 FROM tool_tags tt WHERE tt.tool_id = t.id AND tt.tag LIKE ?))`
  ).bind(like, like, like).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: tools } = await env.DB.prepare(
    `SELECT t.* FROM tools t WHERE t.status = 'active' AND (t.name LIKE ? OR t.meta_description LIKE ? OR EXISTS (SELECT 1 FROM tool_tags tt WHERE tt.tool_id = t.id AND tt.tag LIKE ?)) ORDER BY t.featured DESC, t.click_count DESC LIMIT ? OFFSET ?`
  ).bind(like, like, like, pageSize, offset).all()

  return { tools, query: q, total, page, pageSize }
})
