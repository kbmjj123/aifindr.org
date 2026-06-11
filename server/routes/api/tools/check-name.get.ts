import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import { slugify } from '~/server/utils/utils'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { name } = getQuery(event)

  if (!name || !String(name).trim()) {
    return { exists: false }
  }

  const slug = slugify(String(name))

  const existing = await env.DB.prepare(
    "SELECT name, slug, category, status FROM tools WHERE slug LIKE ? AND status IN ('active', 'pending') LIMIT 1"
  ).bind(`%${slug}%`).first<{ name: string; slug: string; category: string; status: string }>()

  if (existing) {
    return { exists: true, tool: existing }
  }

  return { exists: false }
})
