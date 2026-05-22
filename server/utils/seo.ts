import type { CloudflareEnv } from './env'
import { siteUrl } from './env'

/** Ping Google & Bing sitemap endpoints to notify them of new content.
 *  Also pings the specific tool URL to Google's PubSubHubbub hub.
 *  Non-blocking — failures are logged but don't affect the response. */
export async function notifySearchEngines(env: CloudflareEnv, newUrl: string): Promise<void> {
  const sitemapUrl = siteUrl(env, '/sitemap.xml')

  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Google sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Google ping failed:', e)
  }

  try {
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Bing sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Bing ping failed:', e)
  }

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
