import { logger } from './logger'
import type { CloudflareEnv } from './env'
import { siteUrl } from './env'

/** Ping Google & Bing sitemap endpoints to notify them of new content.
 *  Also pings the specific tool URL to Google's PubSubHubbub hub.
 *  Non-blocking — failures are logged but don't affect the response. */
export async function notifySearchEngines(env: CloudflareEnv, newUrl: string): Promise<void> {
  const sitemapUrl = siteUrl(env, '/sitemap.xml')

  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    logger.info('seo', 'Google sitemap ping sent', { url: newUrl })
  } catch (e) {
    logger.error('seo', 'Google ping failed', { error: e })
  }

  try {
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    logger.info('seo', 'Bing sitemap ping sent', { url: newUrl })
  } catch (e) {
    logger.error('seo', 'Bing ping failed', { error: e })
  }

  try {
    const hubParams = new URLSearchParams({
      'hub.url': newUrl,
      'hub.mode': 'publish',
    })
    await fetch(`https://pubsubhubbub.appspot.com/publish?${hubParams.toString()}`, {
      method: 'POST',
    })
    logger.info('seo', 'PubSubHubbub ping sent', { url: newUrl })
  } catch (e) {
    logger.error('seo', 'PubSubHubbub ping failed', { error: e })
  }

  logger.info('seo', 'Search engines notified', { url: newUrl })
}
