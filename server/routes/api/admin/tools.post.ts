import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { slugify } from '~/server/utils/utils'

const ADMIN_GITHUB_IDS_ENV = 'ADMIN_GITHUB_IDS'

const VALID_CATEGORIES = [
  'image', 'writing', 'video', 'audio', 'code',
  'productivity', 'marketing', 'data', 'education',
  'business', 'research', 'other',
]

const VALID_SUB_CATEGORIES: Record<string, string[]> = {
  image:        ['image-generation', 'image-upscaling', 'background-removal', 'logo-branding', 'illustration'],
  writing:      ['ai-writing', 'essay-longform', 'copywriting', 'blog-seo', 'paraphrasing', 'email-writing', 'product-description'],
  video:        ['video-generation', 'video-editing', 'video-enhancement', 'avatar-talking-head', 'subtitles-captions', 'animation'],
  audio:        ['music-generation', 'text-to-speech', 'voice-cloning', 'transcription', 'audio-enhancement'],
  code:         ['ai-coding-assistants', 'code-generation', 'code-review', 'sql-database', 'testing', 'documentation', 'code-explanation', 'utilities'],
  productivity: ['meeting-notes', 'pdf-document', 'workflow-automation', 'calendar-scheduling', 'task-management', 'inbox-email', 'time-tracking'],
  marketing:    ['seo-tools', 'social-media', 'ad-copy', 'landing-pages', 'content-repurposing', 'competitor-analysis', 'youtube-video-seo'],
  data:         ['data-analysis', 'charts-visualization', 'spreadsheets', 'dashboards-bi', 'reports'],
  education:    ['homework-tutoring', 'math', 'flashcards-quizzes', 'summarization', 'study-planning', 'language-learning', 'course-creation'],
  business:     ['business-planning', 'legal-contracts', 'finance-invoicing', 'pitch-presentations', 'hr-recruiting', 'customer-support', 'crm-sales'],
  research:     ['ai-search-engines', 'academic-research', 'paper-summarization', 'citation-references', 'fact-checking', 'knowledge-base', 'web-scraping', 'academic-writing'],
  other:        ['ai-directory', 'open-source-tools', 'ai-for-students', 'ai-for-small-business', 'ai-for-freelancers', 'ai-for-creators'],
}

const VALID_TAG_TYPES = ['use_case', 'audience', 'feature'] as const

type TagItem = { type: string; tag: string }

interface ToolPayload {
  name: string
  slug?: string
  website: string
  category: string
  sub_category?: string
  pricing: 'free' | 'freemium' | 'paid'
  price_starting?: number
  price_detail?: string
  has_free_trial?: number
  platforms?: string[]
  launched?: string
  meta_description?: string
  cover_image?: string   // R2 URL（logo）
  og_image?: string      // R2 URL（og_image）
  body?: string
  tags?: TagItem[]
  data_source?: string
}

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  // ── 鉴权：仅 admin 可调用 ─────────────────────────────────
  const authToken = getTokenFromEvent(event)
  if (!authToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const payload = await verifyJWT(authToken, env.JWT_SECRET)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const adminGhIds = (env[ADMIN_GITHUB_IDS_ENV] || '').split(',').map(Number).filter(Boolean)
  if (!adminGhIds.includes(payload.github_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // ── 参数解析 ──────────────────────────────────────────────
  const body = await readBody<ToolPayload>(event)

  // ── 必填字段校验 ──────────────────────────────────────────
  const required = ['name', 'website', 'category', 'pricing'] as const
  const missing = required.filter(f => !body[f] || !String(body[f]).trim())
  if (missing.length > 0) {
    throw createError({ statusCode: 400, statusMessage: `Missing required fields: ${missing.join(', ')}` })
  }

  const name        = String(body.name).trim()
  const website     = String(body.website).trim()
  const category    = String(body.category).trim()
  const subCategory = String(body.sub_category || '').trim()
  const pricing     = String(body.pricing).trim()
  const priceDetail = String(body.price_detail || '').trim()
  const launched    = String(body.launched || '').trim()
  const metaDesc    = String(body.meta_description || '').trim()
  const coverImage  = String(body.cover_image || '').trim()   // R2 logo URL
  const ogImage     = String(body.og_image || '').trim()      // R2 og_image URL
  const bodyContent = String(body.body || '').trim()
  const priceStart  = Number(body.price_starting ?? 0)
  const hasFreeTrial = body.has_free_trial ? 1 : 0
  const platformsStr = Array.isArray(body.platforms)
    ? body.platforms.map(String).join(',')
    : String(body.platforms || '')

  // ── 枚举校验 ──────────────────────────────────────────────
  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pricing value' })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid category: ${category}` })
  }
  if (subCategory && !VALID_SUB_CATEGORIES[category]?.includes(subCategory)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sub_category "${subCategory}" for category "${category}"` })
  }

  // ── 标签校验 ──────────────────────────────────────────────
  const validTags: TagItem[] = []
  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      if (t?.type && t?.tag && VALID_TAG_TYPES.includes(t.type as typeof VALID_TAG_TYPES[number])) {
        validTags.push({ type: t.type, tag: t.tag })
      }
    }
  }

  // ── slug 生成（去重） ─────────────────────────────────────
  const CAT_SUFFIX: Record<string, string> = {
    image: 'ai-image-generator', writing: 'ai-writing-tool', video: 'ai-video-generator',
    audio: 'ai-audio-tool', code: 'ai-coding-tool', productivity: 'ai-productivity-tool',
    marketing: 'ai-marketing-tool', data: 'ai-data-tool', education: 'ai-learning-tool',
    business: 'ai-business-tool', research: 'ai-research-tool', other: 'ai-tool',
  }

  const nameSlug = body.slug ? slugify(body.slug) : slugify(name)
  const catKw    = CAT_SUFFIX[category] || 'ai-tool'
  const baseSlug = nameSlug.includes(catKw.split('-')[0] as string)
    ? nameSlug
    : `${nameSlug}-${catKw}`

  if (!baseSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tool name' })
  }

  let slug   = baseSlug
  let suffix = 0
  while (true) {
    const existing = await env.DB.prepare(
      'SELECT id FROM tools WHERE slug = ?'
    ).bind(slug).first()
    if (!existing) break
    suffix++
    slug = `${baseSlug}-${suffix}`
  }

  // ── 写入 tools 表（status 直接为 active）─────────────────
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  const insertResult = await env.DB.prepare(`
    INSERT INTO tools (
      slug, name, category, sub_category, website,
      pricing, price_starting, price_detail, has_free_trial, platforms,
      status, launched, meta_description, og_image, cover_image,
      body, verified, editor_pick, data_source, submitted_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      'active', ?, ?, ?, ?,
      ?, 1, 0, ?, ?, ?
    )
  `).bind(
    slug,
    name,
    category,
    subCategory || null,
    website,
    pricing,
    priceStart,
    priceDetail || null,
    hasFreeTrial,
    platformsStr,
    launched || null,
    metaDesc || null,
    ogImage || null,
    coverImage || null,
    bodyContent || null,
    body.data_source || 'admin_intake',
    now,
    now,
  ).run()

  // ── 写入 tool_tags 表 ─────────────────────────────────────
  const toolId = insertResult.meta?.last_row_id
  if (toolId && validTags.length > 0) {
    for (const t of validTags) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO tool_tags (tool_id, tag, type) VALUES (?, ?, ?)'
      ).bind(toolId, t.tag, t.type).run()
    }
  }

  setResponseStatus(event, 201)
  return { success: true, slug, id: toolId }
})