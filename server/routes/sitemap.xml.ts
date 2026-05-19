/**
 * Dynamic sitemap proxy — fetches from Worker /api/sitemap.xml
 * Overrides Nuxt SEO static sitemap at /sitemap.xml
 */
export default defineEventHandler(async (event) => {
  // In production, call our own Worker API
  const url = new URL(event.node.req.url || '/', 'http://localhost')
  const base = `${url.protocol}//${url.host}`

  const res = await fetch(`${base}/api/sitemap.xml`)
  if (!res.ok) throw createError({ statusCode: res.status, message: 'Sitemap unavailable' })

  const xml = await res.text()
  event.node.res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  return xml
})
