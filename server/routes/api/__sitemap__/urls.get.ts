import { CATEGORIES } from '~/types/category'
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

  // Subcategory pages
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      urls.push({
        url: siteUrl(env, `/tools/${cat.slug}/sub/${sub.id}`),
        changefreq: 'weekly',
        priority: 0.5,
      })
    }
  }

  // 外链提交平台：仅输出 indexed=1 的高价值子集，避免 848 个薄页
  const { results: submissionSites } = await env.DB.prepare(
    "SELECT slug, updated_at, created_at FROM submission_sites WHERE status = 'active' AND indexed = 1"
  ).all<{ slug: string; updated_at: string | null; created_at: string }>()
  for (const site of submissionSites || []) {
    urls.push({
      url: siteUrl(env, `/backlink-sites/${site.slug}`),
      lastmod: site.updated_at || site.created_at,
      changefreq: 'monthly',
      priority: 0.6,
    })
  }

  // 榜单页：只输出已发布且有成员的
  const { results: submissionLists } = await env.DB.prepare(
    "SELECT slug, updated_at, created_at FROM submission_lists WHERE status = 'published' AND item_count >= min_items"
  ).all<{ slug: string; updated_at: string | null; created_at: string }>()
  for (const list of submissionLists || []) {
    urls.push({
      url: siteUrl(env, `/submission-lists/${list.slug}`),
      lastmod: list.updated_at || list.created_at,
      changefreq: 'weekly',
      priority: 0.7,
    })
  }

  return urls
})
