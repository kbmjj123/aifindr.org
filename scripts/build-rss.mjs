import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectBlogItems, collectToolItems } from './lib/rss-data.mjs'
import { buildRss2 } from './lib/rss-utils.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function generateRss({
  siteUrl,
  fetchImpl = fetch,
  root = ROOT,
  strict = false,
  now = new Date(),
  logger = console,
} = {}) {
  const base = (siteUrl || process.env.AIFINDR_SITE_URL || 'https://aifindr.org').replace(/\/+$/, '')
  const targets = [
    {
      key: 'blog',
      file: resolve(root, 'public/rss.xml'),
      title: 'aifindr.org Blog',
      link: `${base}/blog`,
      description: 'Latest updates, tool reviews, and AI industry insights from aifindr.org.',
      selfUrl: `${base}/rss.xml`,
    },
    {
      key: 'tools',
      file: resolve(root, 'public/tools.rss.xml'),
      title: 'aifindr.org New AI Tools',
      link: `${base}/tools`,
      description: 'Newly listed AI tools from aifindr.org.',
      selfUrl: `${base}/tools.rss.xml`,
    },
  ]

  mkdirSync(resolve(root, 'public'), { recursive: true })
  const counts = {}

  for (const target of targets) {
    const { key, file, ...channel } = target
    try {
      const items = key === 'blog'
        ? await collectBlogItems({ siteUrl: base, fetchImpl, logger })
        : await collectToolItems({ siteUrl: base, fetchImpl })
      writeFileSync(file, buildRss2({ ...channel, items, lastBuildDate: now.toUTCString() }), 'utf8')
      counts[key] = items.length
      logger.log(`[rss] ${file}: ${items.length} items`)
    } catch (error) {
      if (strict) throw error
      logger.warn(`[rss] ${key} feed failed (${error.message}); keeping previous file`)
      if (!existsSync(file)) {
        writeFileSync(file, buildRss2({ ...channel, items: [], lastBuildDate: now.toUTCString() }), 'utf8')
        logger.warn(`[rss] no previous file for ${key}; wrote empty feed`)
      }
      counts[key] = null
    }
  }

  return counts
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  generateRss({ strict: process.argv.includes('--strict') }).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
