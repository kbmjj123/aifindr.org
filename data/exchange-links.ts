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
  {
    name: 'Twelve Tools',
    url: 'https://twelve.tools',
    type: 'image',
    imageUrl: 'https://twelve.tools/badge0-white.svg',
    imageWidth: 148,
    imageHeight: 40,
    alt: 'Featured on Twelve Tools',
  },
  {
    name: 'FWFW',
    url: 'https://fwfw.app/item/aifindrorg',
    type: 'image',
    imageUrl: 'https://fwfw.app/badge-white.svg',
    imageWidth: 250,
    imageHeight: 54,
    alt: 'Featured on FWFW',
  },
  {
    name: 'Findly.tools',
    url: 'https://findly.tools/aifindr?utm_source=aifindr',
    type: 'image',
    imageUrl: 'https://findly.tools/badges/findly-tools-badge-light.svg',
    imageWidth: 175,
    imageHeight: 55,
    alt: 'Featured on Findly.tools',
  }
]
