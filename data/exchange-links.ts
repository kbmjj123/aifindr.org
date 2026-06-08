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
export const exchangeLinks: ExchangeLink[] = []
