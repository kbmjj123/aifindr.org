import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { slugify } from '~/server/utils/utils'
import { CATEGORIES } from '~/types/category'

const ADMIN_GITHUB_IDS_ENV = 'ADMIN_GITHUB_IDS'

const VALID_CATEGORIES = CATEGORIES.map(c => c.id)

const VALID_SUB_CATEGORIES: Record<string, string[]> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.subcategories.map(s => s.id)])
)

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
  short_description?: string
  faq?: string
  has_free_trial?: number
  platforms?: string[]
  launched?: string
  meta_description?: string
  logo?: string          // R2 URL（logo）
  screenshots?: string[] // R2 URLs（screenshots）
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
  if (!adminGhIds.includes(payload.gh_id)) {
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
  const shortDesc   = String(body.short_description || '').trim().slice(0, 80)  // max 80 chars
  const faqStr      = body.faq ? (typeof body.faq === 'string' ? body.faq : JSON.stringify(body.faq)) : null
  const logo        = String(body.logo || '').trim()          // R2 logo URL
  const screenshots = Array.isArray(body.screenshots) ? JSON.stringify(body.screenshots) : ''
  let priceTiers    = null
  if (body.price_tiers) {
    const raw = body.price_tiers
    if (typeof raw === 'string') priceTiers = raw
    else if (Array.isArray(raw)) priceTiers = JSON.stringify(raw)
  }
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
      pricing, price_starting, price_detail, price_tiers, has_free_trial, platforms,
      status, launched, meta_description, short_description, faq, logo, screenshots,
      body, verified, editor_pick, data_source, submitted_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      'active', ?, ?, ?, ?, ?,
      ?, ?, 1, 0, ?, ?, ?
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
    priceTiers,
    hasFreeTrial,
    platformsStr,
    launched || null,
    metaDesc || null,
    shortDesc || null,
    faqStr,
    logo || null,
    screenshots || null,
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