/**
 * Sitemap — proxy to Worker /api/sitemap.xml
 * Local dev: Nuxt → Worker (via devProxy)
 * Production: Worker handles aifindr.org/sitemap.xml directly
 */
export default defineEventHandler(async () => {
  const res = await fetch('http://localhost:8787/api/sitemap.xml')
  if (!res.ok) throw createError({ statusCode: 502, message: 'Sitemap unavailable' })
  return new Response(await res.text(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
})
