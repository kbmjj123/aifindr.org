import { escapeXml, renderMarkdown, safeUrl, unixSecondsToRfc822, textDateToRfc822 } from './rss-utils.mjs'

export const FEED_LIMIT = 50
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_RETRIES = 2

export async function fetchJson(url, fetchImpl = fetch, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'user-agent': 'aifindr-rss-builder/1.0' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < retries) await sleep(200 * (attempt + 1))
    }
  }
  throw lastError
}

export async function collectBlogItems({ siteUrl, fetchImpl = fetch, limit = FEED_LIMIT, logger = console }) {
  const list = await fetchJson(`${siteUrl}/api/blog?pageSize=${limit}`, fetchImpl)
  const posts = Array.isArray(list?.posts) ? list.posts.slice(0, limit) : []
  const items = []

  for (const post of posts) {
    if (!post?.slug) continue
    let detail
    try {
      detail = await fetchJson(`${siteUrl}/api/blog/${encodeURIComponent(post.slug)}`, fetchImpl)
    } catch (error) {
      logger.warn(`[rss] skip blog post ${post.slug}: ${error.message}`)
      continue
    }
    const en = detail?.translations?.en
    if (!en) continue

    const cover = safeUrl(en.cover_image || post.cover_image, siteUrl)
    const prefix = cover ? `<p><img src="${escapeXml(cover)}" alt="" /></p>` : ''
    const link = `${siteUrl}/blog/${post.slug}`
    items.push({
      title: en.title || post.title || post.slug,
      link,
      guid: link,
      pubDate: unixSecondsToRfc822(post.published_at || post.created_at),
      description: en.meta_desc || post.meta_desc || '',
      content: `${prefix}${renderMarkdown(en.content || '', siteUrl)}`,
      categories: ['Blog'],
    })
  }

  return items
}

export async function collectToolItems({ siteUrl, fetchImpl = fetch, limit = FEED_LIMIT }) {
  const data = await fetchJson(`${siteUrl}/api/tools?sort=latest&pageSize=${limit}`, fetchImpl)
  const tools = Array.isArray(data?.tools) ? data.tools.slice(0, limit) : []

  return tools
    .filter(tool => tool?.slug && tool?.category)
    .map((tool) => {
      const link = `${siteUrl}/tools/${tool.category}/${tool.slug}`
      return {
        title: tool.name || tool.slug,
        link,
        guid: link,
        pubDate: textDateToRfc822(tool.submitted_at),
        description: tool.short_description || tool.meta_description || '',
        content: renderMarkdown(tool.body || '', siteUrl),
        categories: [tool.category],
      }
    })
}
