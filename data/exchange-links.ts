export interface ExchangeLink {
  name: string
  url: string
  /** 'text' = plain link, 'image' = badge/image link */
  type: 'text' | 'image'
  /** Required when type=image */
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  alt?: string
}

/**
 * Friend Links / Link Exchange
 *
 * Edit this file to add/remove exchange partners.
 * ──────────────────────────────────────────────────────
 * For text links: { name, url, type: 'text' }
 * For image badges: { name, url, type: 'image', imageUrl, imageWidth, imageHeight }
 *
 * Badge example:
 *   {
 *     name: 'FWFW',
 *     url: 'https://fwfw.app/item/bulkpictools',
 *     type: 'image',
 *     imageUrl: 'https://fwfw.app/badge-white.svg',
 *     imageWidth: 250,
 *     imageHeight: 54,
 *     alt: 'Featured on FWFW',
 *   }
 */
/** Add your exchange links here. Component hides when array is empty. */
export const exchangeLinks: ExchangeLink[] = [
  // ── Text links ──
  { name: 'Futurepedia',      url: 'https://www.futurepedia.io',            type: 'text' },
  { name: 'FutureTools',      url: 'https://futuretools.io',                type: 'text' },
  { name: 'Toolify',          url: 'https://www.toolify.ai',                type: 'text' },
  { name: 'AI Tool Hunt',     url: 'https://www.aitoolhunt.com',            type: 'text' },
  { name: 'TopAI.tools',      url: 'https://topai.tools',                   type: 'text' },
  { name: 'Supertools',       url: 'https://supertools.therundown.ai',      type: 'text' },
  { name: 'SaaS Hub',         url: 'https://www.saashub.com',               type: 'text' },
  { name: 'There\'s An AI',   url: 'https://theresanai.com',                type: 'text' },
  { name: 'GPTE.ai',          url: 'https://gpte.ai',                       type: 'text' },
  { name: 'AiLib',            url: 'https://www.ailib.ai',                  type: 'text' },

  // ── Image badges ──
  {
    name: 'FWFW',
    url: 'https://fwfw.app/item/bulkpictools',
    type: 'image',
    imageUrl: 'https://fwfw.app/badge-white.svg',
    imageWidth: 250,
    imageHeight: 54,
    alt: 'Featured on FWFW',
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com',
    type: 'image',
    imageUrl: 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg',
    imageWidth: 250,
    imageHeight: 54,
    alt: 'Product Hunt featured badge',
  },
]
