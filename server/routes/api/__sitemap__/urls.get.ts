import { getEnv, siteUrl } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const { results: tools } = await env.DB.prepare(
    "SELECT slug, category, updated_at, submitted_at FROM tools WHERE status = 'active'"
  ).all<{ slug: string; category: string; updated_at: string | null; submitted_at: string }>()

  const urls = tools.map(tool => ({
    url: siteUrl(env, `/tools/${tool.category}/${tool.slug}`),
    lastmod: tool.updated_at || tool.submitted_at,
    changefreq: 'weekly',
    priority: 0.8,
  }))

  return urls
})
