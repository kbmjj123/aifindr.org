import type { Env } from '../types'
import { json } from '../lib/response'

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
