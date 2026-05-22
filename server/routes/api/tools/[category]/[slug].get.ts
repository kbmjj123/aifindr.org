import { createError, getRouterParams } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { category, slug } = getRouterParams(event)

  const tool = await env.DB.prepare(
    "SELECT * FROM tools WHERE slug = ? AND category = ? AND status = 'active'"
  ).bind(slug, category).first()

  if (!tool) {
    throw createError({ statusCode: 404, statusMessage: 'Tool not found' })
  }

  const { results: tagRows } = await env.DB.prepare(
    'SELECT tag FROM tool_tags WHERE tool_id = ?'
  ).bind((tool as Record<string, unknown>).id).all()

  const tags = (tagRows as { tag: string }[]).map(r => r.tag)

  return {
    ...tool as Record<string, unknown>,
    tags,
  }
})
