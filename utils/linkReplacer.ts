export type ToolLinksMap = Record<string, { slug: string; category: string }>

/**
 * Replace external links in rendered HTML with internal tool links
 * when the target website exists in the directory.
 */
export function replaceToolLinks(html: string, map: ToolLinksMap): string {
  return html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
    (match, before: string, url: string, after: string) => {
      const normalized = url.replace(/\/$/, '').toLowerCase()
      const entry = map[normalized]
      if (!entry) return match

      // Already an internal link? skip
      if (match.includes('/tools/')) return match

      const internalPath = `/tools/${entry.category}/${entry.slug}`
      return `<a ${before}href="${internalPath}"${after}>`
    }
  )
}
