/**
 * 通用工具：将外部数据转换为 aifindr.org Markdown 文件
 * ─────────────────────────────────────────────────────
 * 无特定数据源依赖，任何爬虫产出的 JSON 都能用。
 *
 * 用法：
 *   import { convertToMarkdownFiles } from './to-markdown'
 *   const tools = [{ name, website, description, ... }, ...]
 *   convertToMarkdownFiles(tools)
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '..', 'content', 'tools')

// ─── 输入类型（外部数据源只需满足此接口）───────────────────

export interface RawTool {
  name: string
  website: string
  short_description: string
  long_description?: string
  logo_url?: string
  screenshot_url?: string
  video_url?: string
  category_hint?: string      // 如果有明确分类可传入
  price_hint?: string          // 定价提示
  verified?: boolean
  tags_hint?: string[]
  data_source?: string         // 数据来源
}

// ─── 输出类型 ────────────────────────────────────────────

export interface AifindrTool {
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
  use_cases: string[]
  target_users: string[]
  last_verified: string
  data_source: string
  body: string
}

// ─── 分类推断 ────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  image: ['image', 'design', 'art', 'photo', 'logo', 'graphic', 'illustration', 'icon', '3d', 'render', 'animation', 'video generation', 'image generation', 'visual', 'background', 'color', 'meme', 'avatar', 'generator'],
  writing: ['writing', 'content', 'copy', 'text', 'blog', 'essay', 'grammar', 'rewrite', 'paraphrase', 'summarize', 'paragraph', 'sentence', 'story', 'script', 'novel', 'headline', 'caption', 'translate', 'translation', 'seo', 'keyword'],
  video: ['video', 'movie', 'film', 'clip', 'animation', 'motion', 'frame', 'scene', 'vfx', 'cinematic', 'video generation', 'video editing'],
  audio: ['audio', 'music', 'sound', 'voice', 'speech', 'podcast', 'sing', 'song', 'melody', 'beat', 'noise', 'tts', 'text to speech', 'transcribe', 'transcription'],
  code: ['code', 'developer', 'programming', 'sql', 'api', 'database', 'debug', 'deploy', 'ci/cd', 'terminal', 'command', 'sdk', 'library', 'npm', 'github', 'cli', 'backend', 'frontend', 'llm', 'autocomplete', 'web development', 'coding'],
  productivity: ['productivity', 'workflow', 'automation', 'task', 'meeting', 'calendar', 'note', 'document', 'spreadsheet', 'presentation', 'email', 'schedule', 'reminder', 'collaboration', 'team', 'project', 'workspace'],
  marketing: ['marketing', 'seo', 'social media', 'email campaign', 'ad', 'lead', 'conversion', 'analytics', 'traffic', 'growth', 'brand', 'influencer', 'affiliate', 'crm', 'sales'],
  data: ['data', 'analytic', 'dashboard', 'chart', 'graph', 'report', 'metric', 'statistic', 'visualization', 'spreadsheet', 'database', 'query', 'big data', 'etl', 'pipeline', 'tableau'],
  education: ['education', 'learning', 'course', 'tutor', 'quiz', 'flashcard', 'study', 'teach', 'classroom', 'curriculum', 'exam', 'homework', 'language learn', 'skill'],
  business: ['business', 'finance', 'accounting', 'invoice', 'payroll', 'hr', 'recruit', 'resume', 'legal', 'contract', 'startup', 'enterprise', 'customer', 'support', 'ecommerce'],
  research: ['research', 'search', 'academic', 'paper', 'science', 'literature', 'review', 'patent', 'citation', 'experiment', 'peer review', 'journal', 'arxiv', 'pubmed', 'discovery'],
}

const VALID_CATEGORIES = Object.keys(CATEGORY_KEYWORDS).concat('other')

export function inferCategory(name: string, shortDesc: string, longDesc = ''): string {
  const combined = `${name} ${shortDesc} ${longDesc}`.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter(kw => combined.includes(kw)).length
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best[0] : 'other'
}

// ─── 定价推断 ────────────────────────────────────────────

export function inferPricing(text: string): {
  pricing: 'free' | 'freemium' | 'paid'
  price_starting: number
  price_detail: string
} {
  const l = text.toLowerCase()
  const hasFree = ['free', 'open source', 'open-source', 'no cost', 'free tier'].some(k => l.includes(k))
  const hasPaid = ['paid', 'subscription', 'pricing', 'per month', '/mo', '/month', 'billed', 'pricing plan'].some(k => l.includes(k))

  const priceMatch = l.match(/\$(\d+)(?:\s*\/\s*mo(?:nth)?)?/i)
  const priceStarting = priceMatch ? parseInt(priceMatch[1], 10) : 0

  if (hasFree && hasPaid) return { pricing: 'freemium', price_starting: priceStarting, price_detail: '' }
  if (hasFree) return { pricing: 'free', price_starting: 0, price_detail: '' }
  if (hasPaid || priceStarting > 0) return { pricing: 'paid', price_starting: priceStarting, price_detail: '' }
  return { pricing: 'freemium', price_starting: 0, price_detail: '' }
}

// ─── 标签推断 ────────────────────────────────────────────

export function inferTags(name: string, shortDesc: string, longDesc = '', category: string): string[] {
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
    'translation': ['translation', 'translate', 'multilingual'],
    'analytics': ['analytics', 'dashboard', 'reporting'],
    'marketing': ['marketing', 'social media', 'growth'],
    'education': ['education', 'learning', 'tutoring'],
  }

  for (const [tag, keywords] of Object.entries(tagKWs)) {
    if (keywords.some(k => combined.includes(k))) tags.push(tag)
  }

  return [...new Set(tags)].slice(0, 6)
}

// ─── 平台推断 ────────────────────────────────────────────

export function inferPlatforms(text: string): string[] {
  const platforms: string[] = ['web']
  const l = text.toLowerCase()
  if (l.includes('mobile') || l.includes('ios') || l.includes('android')) platforms.push('mobile')
  if (l.includes('desktop') || l.includes('mac') || l.includes('windows')) platforms.push('desktop')
  if (l.includes('api') || l.includes('sdk')) platforms.push('api')
  if (l.includes('discord') || l.includes('slack')) platforms.push('discord')
  return platforms
}

// ─── Slug 生成 ───────────────────────────────────────────

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

// ─── 转换主函数 ──────────────────────────────────────────

export function convertTool(raw: RawTool): AifindrTool {
  const name = raw.name
  const desc = raw.short_description || ''
  const longDesc = raw.long_description || ''
  const combined = `${name} ${desc} ${longDesc}`

  const category = raw.category_hint || inferCategory(name, desc, longDesc)
  const pricingInfo = inferPricing(raw.price_hint || combined)
  const tags = raw.tags_hint || inferTags(name, desc, longDesc, category)
  const platforms = inferPlatforms(combined)
  const slug = slugify(name)
  const today = new Date().toISOString().slice(0, 10)

  const images: AifindrTool['images'] = []
  if (raw.screenshot_url) {
    images.push({ url: raw.screenshot_url, alt: `${name} screenshot`, type: 'screenshot' })
  }

  const videos: AifindrTool['videos'] = []
  if (raw.video_url) {
    const platform = raw.video_url.includes('youtube') ? 'youtube' : raw.video_url.includes('vimeo') ? 'vimeo' : 'direct'
    videos.push({ url: raw.video_url, platform, title: `${name} demo`, type: 'demo' })
  }

  let body = longDesc || desc
  if (!body || body.length < 50) {
    body = desc
  }

  return {
    name,
    slug,
    website: raw.website,
    category,
    tags,
    pricing: pricingInfo.pricing,
    price_starting: pricingInfo.price_starting,
    price_detail: pricingInfo.price_detail,
    platforms,
    status: raw.verified ? 'active' : 'beta',
    launched: '',
    meta_description: desc.slice(0, 150),
    cover_image: raw.logo_url || '',
    og_image: raw.screenshot_url || raw.logo_url || '',
    featured: false,
    verified: raw.verified || false,
    submitter_site: '',
    submitter_github: '',
    submitted_at: today,
    images,
    videos,
    use_cases: [],
    target_users: [],
    last_verified: today,
    data_source: raw.data_source || '',
    body,
  }
}

// ─── 生成 Markdown ────────────────────────────────────────

function escapeYaml(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function toMarkdown(tool: AifindrTool): string {
  const yamlLines = [
    '---',
    `name: "${escapeYaml(tool.name)}"`,
    `slug: "${tool.slug}"`,
    `website: "${tool.website}"`,
    `category: "${tool.category}"`,
    `tags: ${JSON.stringify(tool.tags)}`,
    `pricing: "${tool.pricing}"`,
    `price_starting: ${tool.price_starting}`,
  ]
  if (tool.price_detail) yamlLines.push(`price_detail: "${escapeYaml(tool.price_detail)}"`)
  yamlLines.push(
    `platforms: ${JSON.stringify(tool.platforms)}`,
    `status: "${tool.status}"`,
  )
  if (tool.launched) yamlLines.push(`launched: "${tool.launched}"`)
  yamlLines.push(
    `meta_description: "${escapeYaml(tool.meta_description)}"`,
  )
  if (tool.cover_image) yamlLines.push(`cover_image: "${tool.cover_image}"`)
  if (tool.og_image) yamlLines.push(`og_image: "${tool.og_image}"`)
  yamlLines.push(
    `featured: ${tool.featured}`,
    `verified: ${tool.verified}`,
    `editor_pick: false`,
    `submitter_site: ""`,
    `submitter_github: ""`,
    `submitted_at: "${tool.submitted_at}"`,
    `last_verified: "${tool.last_verified}"`,
  )
  if (tool.data_source) yamlLines.push(`data_source: "${tool.data_source}"`)
  yamlLines.push(
    `use_cases: ${JSON.stringify(tool.use_cases)}`,
    `target_users: ${JSON.stringify(tool.target_users)}`,
  )

  if (tool.images.length > 0) {
    yamlLines.push('images:')
    for (const i of tool.images) {
      yamlLines.push(`  - url: "${i.url}"`, `    alt: "${i.alt}"`, `    type: "${i.type}"`)
    }
  }

  if (tool.videos.length > 0) {
    yamlLines.push('videos:')
    for (const v of tool.videos) {
      yamlLines.push(`  - url: "${v.url}"`, `    platform: "${v.platform}"`, `    title: "${v.title}"`, `    type: "${v.type}"`)
    }
  }

  yamlLines.push('---', '', tool.body)
  return yamlLines.join('\n')
}

// ─── 批量写入 ────────────────────────────────────────────

export function writeMarkdownFiles(tools: AifindrTool[], contentDir = CONTENT_DIR) {
  for (const cat of VALID_CATEGORIES) {
    const dir = join(contentDir, cat)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  const byCategory: Record<string, number> = {}
  let written = 0
  for (const tool of tools) {
    const dir = join(contentDir, tool.category)
    writeFileSync(join(dir, `${tool.slug}.md`), toMarkdown(tool), 'utf-8')
    byCategory[tool.category] = (byCategory[tool.category] || 0) + 1
    written++
  }

  return { written, byCategory }
}
