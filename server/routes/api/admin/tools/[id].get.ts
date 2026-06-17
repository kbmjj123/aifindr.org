import { createError, getRouterParam } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id || isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid tool ID' })

  const tool = await env.DB.prepare(
    'SELECT * FROM tools WHERE id = ?'
  ).bind(id).first<Record<string, unknown>>()

  if (!tool) throw createError({ statusCode: 404, statusMessage: 'Tool not found' })

  // ── fetch tags ─────────────────────────────────────────────
  const { results: tags } = await env.DB.prepare(
    'SELECT tag, type FROM tool_tags WHERE tool_id = ? ORDER BY type, tag'
  ).bind(id).all<{ tag: string; type: string }>()

  return { ...tool, tags: tags || [] }
})
