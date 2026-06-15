import { createError, getRouterParams, getQuery, getHeader } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyJWT } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { category, slug } = getRouterParams(event)
  const query = getQuery(event)
  const isPreview = query.preview === '1'

  let statusFilter = "status = 'active'"
  if (isPreview) {
    const auth = getHeader(event, 'Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      throw createError({ statusCode: 401, statusMessage: 'Login required to preview' })
    }
    const token = auth.slice(7)
    const payload = await verifyJWT(token, env.JWT_SECRET)
    if (!payload) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
    }
    statusFilter = "status IN ('active', 'pending')"
  }

  const tool = await env.DB.prepare(
    `SELECT t.*, u.avatar_url AS submitter_avatar
     FROM tools t
     LEFT JOIN users u ON u.id = t.submitter_id
     WHERE t.slug = ? AND t.category = ? AND ${statusFilter}`
  ).bind(slug, category).first()

  if (!tool) {
    throw createError({ statusCode: 404, statusMessage: 'Tool not found' })
  }

  const { results: tagRows } = await env.DB.prepare(
    'SELECT tag, type FROM tool_tags WHERE tool_id = ?'
  ).bind((tool as Record<string, unknown>).id).all()

  const typedTags = (tagRows as { tag: string; type: string }[]).map(r => ({
    tag: r.tag,
    type: r.type,
  }))

  return {
    ...tool as Record<string, unknown>,
    tags: typedTags,
  }
})
