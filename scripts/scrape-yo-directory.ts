/**
 * yo.directory → aifindr.org 爬虫适配器
 * ───────────────────────────────────────────
 * 爬取 yo.directory 全部工具，转换为 aifindr.org 的 Markdown 格式，
 * 写入 content/tools/{category}/{slug}.md。
 *
 * 依赖：npm install axios cheerio
 * 运行：npx tsx scripts/scrape-yo-directory.ts
 */

import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

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

interface AifindrTool {
  name: string
  slug: string
  website: string
  category: string
  tags: string[]
  pricing: 'free' | 'freemium' | 'paid'
  price_starting: number
  price_detail: string
  platforms: string[]
  status: 'active' | 'beta' | 'discontinued' | 'pending'
  launched: string
  meta_description: string
  cover_image: string
  og_image: string
  featured: boolean
  verified: boolean
  submitter_site: string
  submitter_github: string
  submitted_at: string
  images: { url: string; alt: string; type: string }[]
  videos: { url: string; platform: string; title: string; type: string }[]
  body: string
}

// ─── 配置 ──────────────────────────────────────────────────

const CONFIG = {
  baseUrl: 'https://yo.directory/',
  pageParam: 'aa3a79a4_page',
  maxPages: 999,
  listDelay: 1500,
  detailDelay: 1000,
  contentDir: join(__dirname, '..', 'content', 'tools'),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
}

const FEATURE_KW = new Set(['Submissions', 'Newsletter', 'Ads', 'Affiliate'])
const PLATFORM_SKIP = ['webflow', 'framer', 'softr', 'wordpress', 'paved', 'seoify']
const TLDS = ['com', 'io', 'ai', 'co', 'net', 'org', 'app', 'dev', 'design', 'tools']

const VALID_CATEGORIES = [
  'image', 'writing', 'video', 'audio', 'code',
  'productivity', 'marketing', 'data', 'education', 'business', 'research', 'other',
]

// ─── 工具函数 ──────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const log = (msg: string) => {
  console.log(`[${new Date().toTimeString().slice(0, 8)}] ${msg}`)
}

async function fetchHtml(url: string) {
  const res = await axios.get(url, { headers: CONFIG.headers, timeout: 20000 })
  return res.data
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
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

// ─── 分类推断 ──────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  image: ['image', 'design', 'art', 'photo', 'logo', 'graphic', 'illustration', 'icon', '3d', 'render', 'animation', 'video generation', 'image generation', 'visual', 'background', 'color', 'meme'],
  writing: ['writing', 'content', 'copy', 'text', 'blog', 'essay', 'grammar', 'rewrite', 'paraphrase', 'summarize', 'paragraph', 'sentence', 'story', 'script', 'novel', 'headline', 'caption', 'translate', 'translation'],
  video: ['video', 'movie', 'film', 'clip', 'animation', 'motion', 'frame', 'scene', 'vfx', 'cinematic'],
  audio: ['audio', 'music', 'sound', 'voice', 'speech', 'podcast', 'sing', 'song', 'melody', 'beat', 'noise', 'tts', 'text to speech', 'transcribe', 'transcription'],
  code: ['code', 'developer', 'programming', 'sql', 'api', 'database', 'debug', 'deploy', 'ci/cd', 'terminal', 'command', 'sdk', 'library', 'npm', 'github', 'cli', 'backend', 'frontend', 'llm', 'sdk', 'autocomplete'],
  productivity: ['productivity', 'workflow', 'automation', 'task', 'meeting', 'calendar', 'note', 'document', 'spreadsheet', 'presentation', 'email', 'schedule', 'reminder', 'collaboration', 'team', 'project'],
  marketing: ['marketing', 'seo', 'social media', 'email campaign', 'ad', 'lead', 'conversion', 'analytics', 'traffic', 'growth', 'brand', 'influencer', 'affiliate', 'crm'],
  data: ['data', 'analytic', 'dashboard', 'chart', 'graph', 'report', 'metric', 'statistic', 'visualization', 'spreadsheet', 'database', 'query', 'big data', 'etl', 'pipeline', 'tableau'],
  education: ['education', 'learning', 'course', 'tutor', 'quiz', 'flashcard', 'study', 'teach', 'classroom', 'curriculum', 'exam', 'homework', 'language learn', 'skill'],
  business: ['business', 'finance', 'accounting', 'invoice', 'payroll', 'hr', 'recruit', 'resume', 'legal', 'contract', 'startup', 'enterprise', 'sales', 'customer', 'support'],
  research: ['research', 'search', 'academic', 'paper', 'science', 'literature', 'review', 'patent', 'citation', 'experiment', 'peer review', 'journal', 'arxiv', 'pubmed'],
}

function inferCategory(name: string, shortDesc: string, longDesc: string): string {
  const combined = `${name} ${shortDesc} ${longDesc}`.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter(kw => combined.includes(kw)).length
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best[0] : 'other'
}

// ─── 定价推断 ──────────────────────────────────────────────

function inferPricing(shortDesc: string, longDesc: string, name: string): {
  pricing: 'free' | 'freemium' | 'paid'
  price_starting: number
  price_detail: string
} {
  const combined = `${shortDesc} ${longDesc} ${name}`.toLowerCase()

  // 检测免费关键词
  const freeKWs = ['free', 'open source', 'open-source', 'no cost', 'free tier']
  const paidKWs = ['paid', 'subscription', 'pricing', 'per month', '/mo', '/month', 'pricing plan', 'billed']

  const isFreeMention = freeKWs.some(k => combined.includes(k))
  const isPaidMention = paidKWs.some(k => combined.includes(k))

  // 提取价格数字
  const priceMatch = combined.match(/\$(\d+)(?:\s*\/\s*mo(?:nth)?)?/i)
  const priceStarting = priceMatch ? parseInt(priceMatch[1], 10) : 0

  if (isFreeMention && isPaidMention) return { pricing: 'freemium', price_starting: priceStarting, price_detail: '' }
  if (isFreeMention) return { pricing: 'free', price_starting: 0, price_detail: '' }
  if (isPaidMention || priceStarting > 0) return { pricing: 'paid', price_starting: priceStarting, price_detail: '' }
  return { pricing: 'freemium', price_starting: 0, price_detail: '' } // 默认
}

// ─── 标签提取 ──────────────────────────────────────────────

function inferTags(name: string, shortDesc: string, longDesc: string, category: string): string[] {
  const combined = `${name} ${shortDesc} ${longDesc}`.toLowerCase()
  const tags: string[] = [category]

  const tagKWs: Record<string, string[]> = {
    'image-generation': ['image generation', 'text to image', 'generate image'],
    'video-generation': ['video generation', 'text to video', 'generate video'],
    'text-to-speech': ['text to speech', 'tts', 'speech synthesis'],
    'code-generation': ['code generation', 'code completion', 'generate code'],
    'chat': ['chat', 'conversation', 'assistant', 'chatbot'],
    'writing': ['writing', 'content creation', 'copywriting'],
    'seo': ['seo', 'search engine', 'keyword', 'rank'],
    'design': ['design', 'graphic', 'ui/ux', 'layout'],
    'productivity': ['productivity', 'workflow', 'automation'],
    'open-source': ['open source', 'open-source'],
    'api': ['api', 'sdk', 'integration'],
  }

  for (const [tag, keywords] of Object.entries(tagKWs)) {
    if (keywords.some(k => combined.includes(k))) tags.push(tag)
  }

  return [...new Set(tags)].slice(0, 6)
}

// ─── 平台推断 ──────────────────────────────────────────────

function inferPlatforms(combined: string, yoBuiltWith: string): string[] {
  const platforms: string[] = ['web']
  const l = combined.toLowerCase()
  if (l.includes('mobile') || l.includes('ios') || l.includes('android')) platforms.push('mobile')
  if (l.includes('desktop') || l.includes('mac') || l.includes('windows')) platforms.push('desktop')
  if (l.includes('api') || l.includes('sdk')) platforms.push('api')
  if (l.includes('discord') || l.includes('slack')) platforms.push('discord')
  return platforms
}

// ─── 生成 Markdown ─────────────────────────────────────────

function toMarkdown(tool: AifindrTool): string {
  const frontmatter: Record<string, unknown> = {
    name: tool.name,
    slug: tool.slug,
    website: tool.website,
    category: tool.category,
    tags: tool.tags,
    pricing: tool.pricing,
    price_starting: tool.price_starting,
    price_detail: tool.price_detail,
    platforms: tool.platforms,
    status: tool.status,
    launched: tool.launched || '',
    meta_description: tool.meta_description,
    cover_image: tool.cover_image,
    og_image: tool.og_image,
    featured: tool.featured,
    verified: tool.verified,
    editor_pick: false,
    submitter_site: '',
    submitter_github: '',
    submitted_at: tool.submitted_at,
  }

  if (tool.images.length > 0) {
    frontmatter.images = tool.images.map(i => ({
      url: i.url,
      alt: i.alt,
      type: i.type,
    }))
  }

  if (tool.videos.length > 0) {
    frontmatter.videos = tool.videos.map(v => ({
      url: v.url,
      platform: v.platform,
      title: v.title,
      type: v.type,
    }))
  }

  // Build YAML
  let yaml = '---\n'
  yaml += `name: "${escapeYaml(tool.name)}"\n`
  yaml += `slug: "${tool.slug}"\n`
  yaml += `website: "${tool.website}"\n`
  yaml += `category: "${tool.category}"\n`
  yaml += `tags: ${JSON.stringify(tool.tags)}\n`
  yaml += `pricing: "${tool.pricing}"\n`
  yaml += `price_starting: ${tool.price_starting}\n`
  if (tool.price_detail) yaml += `price_detail: "${escapeYaml(tool.price_detail)}"\n`
  yaml += `platforms: ${JSON.stringify(tool.platforms)}\n`
  yaml += `status: "${tool.status}"\n`
  if (tool.launched) yaml += `launched: "${tool.launched}"\n`
  yaml += `meta_description: "${escapeYaml(tool.meta_description)}"\n`
  if (tool.cover_image) yaml += `cover_image: "${tool.cover_image}"\n`
  if (tool.og_image) yaml += `og_image: "${tool.og_image}"\n`
  yaml += `featured: ${tool.featured}\n`
  yaml += `verified: ${tool.verified}\n`
  yaml += `editor_pick: false\n`
  yaml += `submitter_site: ""\n`
  yaml += `submitter_github: ""\n`
  yaml += `submitted_at: "${tool.submitted_at}"\n`

  if (frontmatter.images) {
    yaml += `images:\n`
    for (const i of tool.images) {
      yaml += `  - url: "${i.url}"\n`
      yaml += `    alt: "${i.alt}"\n`
      yaml += `    type: "${i.type}"\n`
    }
  }

  if (frontmatter.videos) {
    yaml += `videos:\n`
    for (const v of tool.videos) {
      yaml += `  - url: "${v.url}"\n`
      yaml += `    platform: "${v.platform}"\n`
      yaml += `    title: "${v.title}"\n`
      yaml += `    type: "${v.type}"\n`
    }
  }

  yaml += '---\n\n'
  yaml += tool.body

  return yaml
}

function escapeYaml(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// ─── 转换主函数 ────────────────────────────────────────────

function convertTool(yoTool: YoTool): AifindrTool {
  const name = yoTool.name
  const desc = yoTool.short_description || ''
  const longDesc = yoTool.long_description || ''

  const category = inferCategory(name, desc, longDesc)
  const pricingInfo = inferPricing(desc, longDesc, name)
  const tags = inferTags(name, desc, longDesc, category)
  const platforms = inferPlatforms(`${desc} ${longDesc} ${name}`, yoTool.built_with)
  const slug = slugify(name)
  const today = new Date().toISOString().slice(0, 10)

  const images: AifindrTool['images'] = []
  if (yoTool.screenshot_url) {
    images.push({ url: yoTool.screenshot_url, alt: `${name} screenshot`, type: 'screenshot' })
  }

  const videos: AifindrTool['videos'] = []
  if (yoTool.video_url) {
    const platform = yoTool.video_url.includes('youtube') || yoTool.video_url.includes('youtu.be')
      ? 'youtube' : yoTool.video_url.includes('vimeo')
      ? 'vimeo' : 'direct'
    videos.push({ url: yoTool.video_url, platform, title: `${name} demo`, type: 'demo' })
  }

  // Body: long_description as base, enrich with available data
  let body = longDesc
  if (!body || body.length < 50) {
    body = desc
  }
  // Add traffic/rating info if available
  const extras: string[] = []
  if (yoTool.google_traffic) extras.push(`Monthly Google traffic: ~${yoTool.google_traffic.toLocaleString()}`)
  if (yoTool.domain_rating) extras.push(`Domain Rating (Ahrefs): ${yoTool.domain_rating}`)
  if (yoTool.popularity) extras.push(`Popularity: ${yoTool.popularity}`)
  if (extras.length > 0) {
    body += '\n\n' + extras.join(' | ')
  }

  return {
    name,
    slug,
    website: yoTool.visit_url || `https://${yoTool.domain}`,
    category,
    tags,
    pricing: pricingInfo.pricing,
    price_starting: pricingInfo.price_starting,
    price_detail: pricingInfo.price_detail,
    platforms,
    status: yoTool.is_dead ? 'discontinued' : yoTool.is_verified ? 'active' : 'beta',
    launched: '',
    meta_description: desc.slice(0, 150),
    cover_image: yoTool.logo_url || '',
    og_image: yoTool.screenshot_url || yoTool.logo_url || '',
    featured: false,
    verified: yoTool.is_verified,
    submitter_site: '',
    submitter_github: '',
    submitted_at: today,
    images,
    videos,
    body: body || desc,
  }
}

// ─── 爬虫（保留原逻辑）──────────────────────────────────────

function parseListPage(html: string) {
  const $ = cheerioLoad(html)
  const tools: YoTool[] = []
  const seen = new Set<string>()

  $('h6').each((_, h6El) => {
    const $h6 = $(h6El)
    const $aDir = $h6.find('a[href^="/directory/"]').first()
    if (!$aDir.length) return

    const detailPath = $aDir.attr('href')!
    const detailUrl = 'https://yo.directory' + detailPath
    if (seen.has(detailUrl)) return
    seen.add(detailUrl)

    const name = $aDir.text().trim()

    let $card = $h6.parent()
    for (let i = 0; i < 4; i++) {
      if ($card.text().trim().split('\n').filter((s: string) => s.trim()).length >= 3) break
      const $parent = $card.parent()
      if (!$parent.length) break
      $card = $parent
    }

    const chunks = $card.text()
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)

    const shortDesc = chunks.find((c: string) =>
      c !== name && !FEATURE_KW.has(c) && !/^\d+$/.test(c) && !c.startsWith('/100') && !c.startsWith('http') && c.length > 3
    ) || ''

    const features = chunks.filter((c: string) => FEATURE_KW.has(c))
    const voteStr = chunks.find((c: string) => /^\d+$/.test(c))
    const votes = voteStr ? parseInt(voteStr, 10) : null

    let logoUrl = ''
    $card.find('img[src]').each((_, img) => {
      if (logoUrl) return
      const src = $(img).attr('src') || ''
      if (src.includes('-logo') || src.includes('favicon')) logoUrl = src
    })

    tools.push({
      name,
      domain: extractDomain(name, detailPath),
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

  $('img[src]').each((_, img) => {
    if (tool.logo_url) return
    const src = $(img).attr('src') || ''
    if ((src.includes('-logo') || src.includes('favicon')) && src.includes('website-files.com')) {
      tool.logo_url = src
    }
  })

  $('a[href]').each((_, el) => {
    if (tool.visit_url) return
    const href = $(el).attr('href') || ''
    if (!/^https?:\/\/to\.yo\.directory\//i.test(href)) return
    const sl = href.split('to.yo.directory/')[1] || ''
    if (!PLATFORM_SKIP.some(p => sl.toLowerCase().includes(p))) tool.visit_url = href
  })

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
  return $('a').toArray().some(el => $(el).text().trim().toLowerCase() === 'next')
}

// ─── 主流程 ────────────────────────────────────────────────

async function scrapeAll() {
  const allTools: YoTool[] = []
  const seenUrls = new Set<string>()

  log('=== 阶段 1：列表页 ===')
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
    const next = hasNextPage($)

    let newCount = 0
    for (const t of tools) {
      if (!seenUrls.has(t.detail_url)) {
        seenUrls.add(t.detail_url)
        allTools.push(t)
        newCount++
      }
    }
    log(`  新增 ${newCount} 条，累计 ${allTools.length} 条`)

    if (!next) { log('  → 最后一页'); break }
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

// ─── 保存为 Markdown ─────────────────────────────────────────

function saveMarkdownFiles(tools: AifindrTool[]) {
  for (const category of VALID_CATEGORIES) {
    const dir = join(CONFIG.contentDir, category)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  let written = 0
  for (const tool of tools) {
    const md = toMarkdown(tool)
    const dir = join(CONFIG.contentDir, tool.category)
    const filePath = join(dir, `${tool.slug}.md`)
    writeFileSync(filePath, md, 'utf-8')
    written++
  }

  log(`Markdown 文件已写入：${written} 个`)
}

// ─── 入口 ──────────────────────────────────────────────────

(async () => {
  console.log('')
  console.log('╔══════════════════════════════════════╗')
  console.log('║  yo.directory → aifindr.org 爬虫     ║')
  console.log('╚══════════════════════════════════════╝')
  console.log('')

  const yoTools = await scrapeAll()
  const aifindrTools = yoTools.map(convertTool)

  saveMarkdownFiles(aifindrTools)

  const byCategory: Record<string, number> = {}
  for (const t of aifindrTools) {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1
  }

  console.log('')
  console.log(`✅ 完成！共 ${aifindrTools.length} 条工具`)
  console.log('分类分布：')
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(15)} ${count}`)
  }
  console.log('')
  console.log('下一步：pnpm run sync-d1    → 同步到 D1')
  console.log('')
})()
