/**
 * yo.directory → aifindr.org 爬虫适配器（本地专用，不进仓库）
 * ─────────────────────────────────────────────────────────────
 * 此文件保留在本地，已加入 .gitignore。
 * 转换逻辑复用 scripts/to-markdown.ts（已公开提提交）。
 *
 * 运行：npx tsx scripts/scrape-yo-directory.ts
 */

import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import { convertTool, writeMarkdownFiles } from './to-markdown'
import type { RawTool } from './to-markdown'

// ─── 类型 ──────────────────────────────────────────────────

interface YoTool {
  name: string
  domain: string
  short_description: string
  detail_url: string
  features: string
  votes: number | null
  logo_url: string
  long_description: string
  visit_url: string
  screenshot_url: string
  video_url: string
  google_traffic: number | null
  domain_rating: number | null
  popularity: string
  built_with: string
  is_verified: boolean
  is_dead: boolean
  has_affiliate: boolean
}

// ─── 配置 ──────────────────────────────────────────────────

const CONFIG = {
  baseUrl: 'https://yo.directory/',
  pageParam: 'aa3a79a4_page',
  maxPages: 999,
  listDelay: 1500,
  detailDelay: 1000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
}

const FEATURE_KW = new Set(['Submissions', 'Newsletter', 'Ads', 'Affiliate'])
const PLATFORM_SKIP = ['webflow', 'framer', 'softr', 'wordpress', 'paved', 'seoify']
const TLDS = ['com', 'io', 'ai', 'co', 'net', 'org', 'app', 'dev', 'design', 'tools']

// ─── 工具函数 ──────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const log = (msg: string) => {
  console.log(`[${new Date().toTimeString().slice(0, 8)}] ${msg}`)
}

async function fetchHtml(url: string) {
  const res = await axios.get(url, { headers: CONFIG.headers, timeout: 20000 })
  return res.data
}

function extractDomain(name: string, slug: string) {
  if (name.includes('.')) return name.trim().toLowerCase()
  const parts = slug.replace(/\/$/, '').split('-')
  if (parts.length) {
    const raw = parts[parts.length - 1]
    for (const tld of TLDS) {
      if (raw.endsWith(tld) && raw.length > tld.length) {
        return raw.slice(0, -tld.length) + '.' + tld
      }
    }
    return raw
  }
  return ''
}

// ─── 爬虫（适配 2026 版 yo.directory 结构）──────────────────

/**
 * 列表页结构：
 *   div[role="listitem"].navsearch-active-search_item
 *     a.navsearch-active-results_link[href^="/directory/"]
 *       img.navsearch-active-icon_image                    ← logo
 *       div.grid-item-title_text                            ← name
 *       div.grid-item-description_text                      ← description
 *     input.jetboost-list-item[value]                       ← slug
 *
 * 注意：yo.directory 2026 版使用 Webflow CMS，列表可能通过 JS 加载。
 * 如果 axios 拿不到完整数据，需改用 Playwright 渲染。
 */
function parseListPage(html: string) {
  const $ = cheerioLoad(html)
  const tools: YoTool[] = []
  const seen = new Set<string>()

  $('[role="listitem"]').each((_, listItem) => {
    const $card = $(listItem)
    const $link = $card.find('a.navsearch-active-results_link[href^="/directory/"]').first()
    if (!$link.length) return

    const detailPath = $link.attr('href')!
    const detailUrl = 'https://yo.directory' + detailPath
    if (seen.has(detailUrl)) return
    seen.add(detailUrl)

    const name = $card.find('.grid-item-title_text').first().text().trim()
    if (!name) return

    const shortDesc = $card.find('.grid-item-description_text').first().text().trim()
    const logoUrl = $card.find('.navsearch-active-icon_image').first().attr('src') || ''

    let votes: number | null = null
    const voteText = $card.find('[class*="vote"], [class*="upvote"], .jetboost-votes').text().trim()
    if (voteText && /^\d+/.test(voteText)) {
      votes = parseInt(voteText.match(/\d+/)![0], 10)
    }

    const cardText = $card.text()
    const features = Array.from(FEATURE_KW).filter(kw => cardText.includes(kw))

    const jetboostSlug = $card.find('input.jetboost-list-item').attr('value') || ''
    const domain = jetboostSlug
      ? extractDomain(name, jetboostSlug)
      : extractDomain(name, detailPath)

    tools.push({
      name,
      domain,
      short_description: shortDesc,
      detail_url: detailUrl,
      features: features.join(', '),
      votes,
      logo_url: logoUrl,
      long_description: '',
      visit_url: '',
      screenshot_url: '',
      video_url: '',
      google_traffic: null,
      domain_rating: null,
      popularity: '',
      built_with: '',
      is_verified: false,
      is_dead: false,
      has_affiliate: false,
    })
  })

  return tools
}

function parseDetailPage(html: string, tool: YoTool) {
  const $ = cheerioLoad(html)

  const ogDesc = $('meta[property="og:description"]').attr('content')
  if (ogDesc) tool.long_description = ogDesc.trim()

  const ogImg = $('meta[property="og:image"]').attr('content')
  if (ogImg) tool.screenshot_url = ogImg.trim()

  if (!tool.logo_url) {
    $('img[src]').each((_, img) => {
      if (tool.logo_url) return
      const src = $(img).attr('src') || ''
      if ((src.includes('-logo') || src.includes('favicon')) && src.includes('website-files.com')) {
        tool.logo_url = src
      }
    })
  }

  $('a[href]').each((_, el) => {
    if (tool.visit_url) return
    const href = $(el).attr('href') || ''
    if (/^https?:\/\/to\.yo\.directory\//i.test(href)) {
      const sl = href.split('to.yo.directory/')[1] || ''
      if (!PLATFORM_SKIP.some(p => sl.toLowerCase().includes(p))) {
        tool.visit_url = href
      }
    }
  })

  if (!tool.visit_url) {
    $('a').each((_, el) => {
      if (tool.visit_url) return
      const text = $(el).text().trim().toLowerCase()
      const href = $(el).attr('href') || ''
      if ((text === 'visit' || text === 'visit site' || text === 'website') &&
          /^https?:\/\//.test(href) &&
          !href.includes('yo.directory') && !href.includes('webflow') && !href.includes('website-files')) {
        tool.visit_url = href
      }
    })
  }

  const videoSrc = $('video[src]').first().attr('src') || $('video source[src]').first().attr('src') || ''
  if (videoSrc) tool.video_url = videoSrc.trim()

  const lines = $.root().text().split('\n').map(l => l.trim()).filter(l => l.length > 0)
  for (let i = 0; i < lines.length - 1; i++) {
    const clean = lines[i].replace(/,/g, '')
    if (!/^\d+$/.test(clean)) continue
    const next = lines[i + 1].toLowerCase()
    if ((next.includes('google') || next.includes('traffic')) && tool.google_traffic === null) {
      tool.google_traffic = parseInt(clean, 10)
    } else if ((next.includes('domain rating') || next.includes('ahrefs')) && tool.domain_rating === null) {
      tool.domain_rating = parseInt(clean, 10)
    }
  }

  const popIdx = lines.findIndex(l => l.toLowerCase() === 'popularity')
  if (popIdx !== -1) {
    const pop = lines.slice(popIdx, popIdx + 8).find(l => l === 'High' || l === 'Medium' || l === 'Low')
    if (pop) tool.popularity = pop
  }

  const fullText = $.root().text()
  tool.built_with = ['Webflow', 'Framer', 'Softr', 'Wordpress'].filter(p => fullText.includes(`Built with ${p}`)).join(', ')
  tool.is_verified = fullText.includes('Verified site')
  tool.is_dead = fullText.includes('Dead site')
  tool.has_affiliate = fullText.toLowerCase().includes('affiliate program') || fullText.includes('Has affiliate')
}

function hasNextPage($: ReturnType<typeof cheerioLoad>) {
  return $('a').toArray().some(el => {
    const text = $(el).text().trim().toLowerCase()
    return text === 'next' || text === 'next page' || text.includes('next')
  })
}

// ─── 主流程 ────────────────────────────────────────────────

async function scrapeAll() {
  const allTools: YoTool[] = []
  const seenUrls = new Set<string>()

  log('=== 阶段 1：列表页 ===')
  let emptyPages = 0
  for (let page = 1; page <= CONFIG.maxPages; page++) {
    const url = page === 1 ? CONFIG.baseUrl : `${CONFIG.baseUrl}?${CONFIG.pageParam}=${page}`
    log(`列表第 ${page} 页 → ${url}`)

    let html: string
    try {
      html = await fetchHtml(url)
    } catch (err: any) {
      log(`  请求失败：${err.message}，跳过`)
      break
    }

    const tools = parseListPage(html)
    const $ = cheerioLoad(html)

    let newCount = 0
    for (const t of tools) {
      if (!seenUrls.has(t.detail_url)) {
        seenUrls.add(t.detail_url)
        allTools.push(t)
        newCount++
      }
    }
    log(`  新增 ${newCount} 条，累计 ${allTools.length} 条`)

    if (newCount === 0) {
      emptyPages++
      if (emptyPages >= 3) { log('  → 连续 3 页无新数据，停止翻页'); break }
    } else {
      emptyPages = 0
    }
    await sleep(CONFIG.listDelay)
  }

  log(`\n=== 阶段 2：详情页（共 ${allTools.length} 条）===`)
  for (let i = 0; i < allTools.length; i++) {
    const tool = allTools[i]
    log(`[${i + 1}/${allTools.length}] ${tool.detail_url}`)
    try {
      const html = await fetchHtml(tool.detail_url)
      parseDetailPage(html, tool)
    } catch (err: any) {
      log(`  失败：${err.message}`)
    }
    await sleep(CONFIG.detailDelay)
  }

  return allTools
}

// ─── YoTool → RawTool 映射 ─────────────────────────────────

function yoToolToRaw(yo: YoTool): RawTool {
  return {
    name: yo.name,
    website: yo.visit_url || `https://${yo.domain}`,
    short_description: yo.short_description,
    long_description: yo.long_description || yo.short_description,
    logo_url: yo.logo_url,
    screenshot_url: yo.screenshot_url,
    video_url: yo.video_url,
    verified: yo.is_verified,
  }
}

// ─── 入口 ──────────────────────────────────────────────────

(async () => {
  console.log('')
  console.log('╔══════════════════════════════════════╗')
  console.log('║  yo.directory → aifindr.org 爬虫     ║')
  console.log('╚══════════════════════════════════════╝')
  console.log('')

  const yoTools = await scrapeAll()
  const rawTools = yoTools.map(yoToolToRaw)
  const aifindrTools = rawTools.map(convertTool)

  const result = writeMarkdownFiles(aifindrTools)

  console.log('')
  console.log(`✅ 完成！共 ${aifindrTools.length} 条工具`)
  console.log('分类分布：')
  for (const [cat, count] of Object.entries(result.byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(15)} ${count}`)
  }
  console.log('')
  console.log('下一步：pnpm run sync-d1    → 同步到 D1')
  console.log('')
})()
