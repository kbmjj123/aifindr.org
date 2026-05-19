import type { Env } from '../types'
import { json, CORS } from '../lib/response'

/** GET /api/__sitemap__/urls — return all active tool URLs for the sitemap */
export async function handleSitemapUrls(env: Env): Promise<Response> {
  const { results: tools } = await env.DB.prepare(
    "SELECT slug, category, updated_at, submitted_at FROM tools WHERE status = 'active'"
  ).all<{ slug: string; category: string; updated_at: string | null; submitted_at: string }>()

  const urls = tools.map(tool => ({
    url: `https://aifindr.org/tools/${tool.category}/${tool.slug}`,
    lastmod: tool.updated_at || tool.submitted_at,
    changefreq: 'weekly',
    priority: 0.8,
  }))

  return json(urls)
}

/** Ping Google & Bing sitemap endpoints to notify them of new content.
 *  Also pings the specific tool URL to Google's PubSubHubbub hub.
 *  Non-blocking — failures are logged but don't affect the response. */
export async function notifySearchEngines(newUrl: string): Promise<void> {
  const sitemapUrl = 'https://aifindr.org/sitemap.xml'

  // Google sitemap ping
  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Google sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Google ping failed:', e)
  }

  // Bing sitemap ping
  try {
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Bing sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Bing ping failed:', e)
  }

  // Google PubSubHubbub — helps with faster discovery
  try {
    const hubParams = new URLSearchParams({
      'hub.url': newUrl,
      'hub.mode': 'publish',
    })
    await fetch(`https://pubsubhubbub.appspot.com/publish?${hubParams.toString()}`, {
      method: 'POST',
    })
    console.log('SEO: PubSubHubbub ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: PubSubHubbub ping failed:', e)
  }

  console.log(`SEO: Search engines notified for ${newUrl}`)
}

/** GET /api/sitemap.xml — dynamic XML sitemap with all active tools + static pages */
export async function handleSitemapXml(env: Env): Promise<Response> {
  // Check KV cache first
	debugger
  const cached = await env.CACHE.get('sitemap-xml')
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/xml', ...CORS },
    })
  }

  const BASE = 'https://aifindr.org'

  // Static pages
  const staticPages = [
    { url: `${BASE}/`,            lastmod: '2026-05-19', changefreq: 'daily',   priority: '1.0' },
    { url: `${BASE}/tools`,       lastmod: '2026-05-19', changefreq: 'daily',   priority: '0.9' },
    { url: `${BASE}/submit`,      lastmod: '2026-05-19', changefreq: 'monthly', priority: '0.7' },
    { url: `${BASE}/settings`,    lastmod: '2026-05-19', changefreq: 'monthly', priority: '0.5' },
  ]

  // Category pages
  const categories = [
    'image', 'writing', 'video', 'audio', 'code', 'productivity',
    'marketing', 'data', 'education', 'business', 'research', 'other',
  ]
  const categoryPages = categories.map(c => ({
    url: `${BASE}/tools/${c}`,
    lastmod: '2026-05-19',
    changefreq: 'daily' as const,
    priority: '0.8',
  }))

  // Dynamic tools from D1
  const { results: tools } = await env.DB.prepare(
    "SELECT slug, category, updated_at, submitted_at FROM tools WHERE status = 'active'"
  ).all<{ slug: string; category: string; updated_at: string | null; submitted_at: string }>()

  const toolPages = tools.map(t => ({
    url: `${BASE}/tools/${t.category}/${t.slug}`,
    lastmod: (t.updated_at || t.submitted_at).slice(0, 10),
    changefreq: 'weekly' as const,
    priority: '0.8',
  }))

  const allPages = [...staticPages, ...categoryPages, ...toolPages]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPages.map(p =>
      `  <url>\n` +
      `    <loc>${p.url}</loc>\n` +
      `    <lastmod>${p.lastmod}</lastmod>\n` +
      `    <changefreq>${p.changefreq}</changefreq>\n` +
      `    <priority>${p.priority}</priority>\n` +
      `  </url>`
    ),
    '</urlset>',
  ].join('\n')

  // Cache for 1 hour in KV
  await env.CACHE.put('sitemap-xml', xml, { expirationTtl: 3600 })

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', ...CORS },
  })
}
