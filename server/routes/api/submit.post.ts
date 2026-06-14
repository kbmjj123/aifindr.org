import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import { logger } from '~/server/utils/logger'
import { verifyTurnstile, slugify } from '~/server/utils/utils'
import { VALID_SUBCATEGORY_VALUES, VALID_TAG_VALUES } from '~/types/category'
import type { UserRecord } from '~/server/utils/jwt'

const VALID_TAG_TYPES = ['use_case', 'audience', 'feature'] as const

const VALID_CATEGORIES = Object.keys(VALID_SUBCATEGORY_VALUES)

const CAT_SUFFIX: Record<string, string> = {
  image: 'ai-image-generator', writing: 'ai-writing-tool', video: 'ai-video-generator',
  audio: 'ai-audio-tool', code: 'ai-coding-tool', productivity: 'ai-productivity-tool',
  marketing: 'ai-marketing-tool', data: 'ai-data-tool', education: 'ai-learning-tool',
  business: 'ai-business-tool', research: 'ai-research-tool', other: 'ai-tool',
}

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  // 获取登录用户（可选）
  let submitterId: number | null = null
  const authToken = getTokenFromEvent(event)
  if (authToken) {
    const payload = await verifyJWT(authToken, env.JWT_SECRET)
    if (payload) submitterId = payload.sub
  }

  const body = await readBody<Record<string, unknown>>(event)

  // ── 必填字段校验 ──────────────────────────────────────────
  const required = ['name', 'website', 'category', 'pricing', 'description'] as const
  const missing = required.filter(f => !body[f] || !String(body[f]).trim())
  if (missing.length > 0) {
    throw createError({ statusCode: 400, statusMessage: `Missing required fields: ${missing.join(', ')}` })
  }

  // ── 基础字段解析 ──────────────────────────────────────────
  const name            = String(body.name).trim()
  const website         = String(body.website).trim()
  const category        = String(body.category).trim()
  const subCategory     = String(body.sub_category || body.subCategory || '').trim()
  const pricing         = String(body.pricing).trim()
  const description     = String(body.description).trim()
  const priceDetail     = String(body.price_detail || body.priceDetail || '').trim()
  let priceTiers        = null
  if (body.price_tiers) {
    const raw = body.price_tiers
    if (typeof raw === 'string') priceTiers = raw
    else if (Array.isArray(raw)) priceTiers = JSON.stringify(raw)
  }
  const launched        = String(body.launched || '').trim()
  const hasFreeTrial    = body.has_free_trial ? 1 : 0
  const platformsRaw    = body.platforms
  const submitterSite   = String(body.submitter_site || body.submitterSite || '').trim()
  const submitterGithub = String(body.submitter_github || body.submitterGithub || '').trim()
  const submitterEmailRaw = String(body.submitter_email || body.submitterEmail || '').trim()
  const turnstileToken  = String(body.turnstileToken || '').trim()
  const bodyContent     = String(body.detailDescription || body.body || '').trim()
  const logo            = String(body.logo || '').trim()
  const screenshotRaw   = String(body.screenshot_urls || '').trim()
  const screenshots     = screenshotRaw ? JSON.stringify(screenshotRaw.split(',').map(s => s.trim()).filter(Boolean)) : null
  const demoVideoUrl    = String(body.demo_video_url || '').trim()
  const tagsRaw         = body.tags  // [{ type: 'feature'|'audience'|'use_case', tag: string }]

  // ── 枚举值校验 ────────────────────────────────────────────
  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pricing value. Must be free, freemium, or paid' })
  }

  if (!VALID_CATEGORIES.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` })
  }

  if (subCategory && !VALID_SUBCATEGORY_VALUES[category]?.includes(subCategory)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sub_category "${subCategory}" for category "${category}"` })
  }
	logger.debug('submit', 'submit handler started', { isDev: import.meta.dev })
  // ── Turnstile 验证 ────────────────────────────────────────
  if (env.TURNSTILE_SECRET && !import.meta.dev) {
    if (!turnstileToken) {
      throw createError({ statusCode: 400, statusMessage: 'CAPTCHA verification required' })
    }
    const captchaValid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET)
    if (!captchaValid) {
      throw createError({ statusCode: 400, statusMessage: 'CAPTCHA verification failed' })
    }
  }

  // ── 重复检测（通过 website URL）───────────────────────────
  const existing = await env.DB.prepare(
    'SELECT id, name, status, submitted_at FROM tools WHERE website = ? ORDER BY submitted_at DESC LIMIT 1'
  ).bind(website).first<{ id: number; name: string; status: string; submitted_at: string }>()
  if (existing) {
    if (existing.status === 'active' || existing.status === 'pending') {
      throw createError({
        statusCode: 409,
        statusMessage: `Tool already exists: "${existing.name}" (status: ${existing.status}). Please wait for review.`,
      })
    }
    // rejected 的可以重新提交
  }

  // ── 标签校验 ──────────────────────────────────────────────
  type TagItem = { type: string; tag: string }
  const validTags: TagItem[] = []
  if (Array.isArray(tagsRaw)) {
    for (const t of tagsRaw as TagItem[]) {
      if (
        t?.type && t?.tag &&
        VALID_TAG_TYPES.includes(t.type as typeof VALID_TAG_TYPES[number]) &&
        VALID_TAG_VALUES[t.type]?.includes(t.tag)
      ) {
        validTags.push({ type: t.type, tag: t.tag })
      }
    }
  }

  // ── slug 生成（去重） ─────────────────────────────────────
  const catKw    = CAT_SUFFIX[category] || 'ai-tool'
  const nameSlug = slugify(name)
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

  // ── platforms 格式化 ──────────────────────────────────────
  let platformsStr = ''
  if (Array.isArray(platformsRaw)) {
    platformsStr = platformsRaw.map(String).join(',')
  } else if (typeof platformsRaw === 'string' && platformsRaw.trim()) {
    platformsStr = platformsRaw.trim()
  }

  // ── body: only bodyContent, no media (consistent with intake ─────────────────────────────────────
	  const fullBody = bodyContent || null
  // ── 写入 tools 表 ─────────────────────────────────────────
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const insertResult = await env.DB.prepare(`
    INSERT INTO tools (
      slug, name, category, sub_category, website,
      pricing, price_detail, price_tiers, has_free_trial, platforms,
      status, launched, meta_description, logo, screenshots,
      body, submitter_site, submitter_github, submitter_id,
      data_source, submitted_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      'pending', ?, ?, ?, ?,
      ?, ?, ?, ?,
      'user_submit', ?
    )
  `).bind(
    slug,
    name,
    category,
    subCategory || null,
    website,
    pricing,
    priceDetail || null,
    priceTiers,
    hasFreeTrial,
    platformsStr,
    launched || null,
    description,
    logo || null,
    screenshots,
    fullBody || null,
    submitterSite || null,
    submitterGithub || null,
    submitterId,
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

  // ── 邮件通知：提交者确认 (B-01) ───────────────────────────
  let submitterEmail: string | null = null
  if (submitterEmailRaw) {
    submitterEmail = submitterEmailRaw
  } else if (submitterId) {
    const submitterUser = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(submitterId).first<UserRecord>()
    submitterEmail = getNotifyEmail(submitterUser)
  }
  if (!submitterEmail && submitterGithub) {
    const ghUser = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(submitterGithub).first<UserRecord>()
    submitterEmail = getNotifyEmail(ghUser)
  }

  if (submitterEmail) {
    void sendEmail(env, {
      to: submitterEmail,
      sceneId: 'B-01',
      subject: `[aifindr] Submission received: ${name}`,
      html: [
        `<p>Hi! Your tool <strong>${name}</strong> (${website}) has been submitted to aifindr.org.</p>`,
        `<p>Our team will review it within <strong>3–7 working days</strong>.</p>`,
        `<p>If you'd like faster review (within 24 hours), check out our <a href="${siteUrl(env, '/submit')}">paid acceleration</a>.</p>`,
        `<p>Your submission reference: <code>${slug}</code></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  // ── 邮件通知：管理员审核 (B-02) ───────────────────────────
  const adminGhIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
  if (adminGhIds.length > 0) {
    const placeholders = adminGhIds.map(() => '?').join(',')
    const { results: admins } = await env.DB.prepare(
      `SELECT * FROM users WHERE github_id IN (${placeholders})`
    ).bind(...adminGhIds).all<UserRecord>()

    for (const admin of admins) {
      const adminEmail = getNotifyEmail(admin)
      if (adminEmail) {
        void sendEmail(env, {
          to: adminEmail,
          sceneId: 'B-02',
          subject: `[aifindr] New submission: ${name}`,
          html: [
            `<p>A new tool has been submitted to aifindr.org and needs review:</p>`,
            `<table>`,
            `<tr><td><strong>Name:</strong></td><td>${name}</td></tr>`,
            `<tr><td><strong>Website:</strong></td><td><a href="${website}">${website}</a></td></tr>`,
            `<tr><td><strong>Category:</strong></td><td>${category}</td></tr>`,
            `<tr><td><strong>Sub-category:</strong></td><td>${subCategory || '—'}</td></tr>`,
            `<tr><td><strong>Pricing:</strong></td><td>${pricing}</td></tr>`,
            `<tr><td><strong>Submitted:</strong></td><td>${now}</td></tr>`,
            `</table>`,
            `<p><a href="${siteUrl(env, '/admin')}">Review in admin panel →</a></p>`,
          ].join(''),
        })
      }
    }
  }

  setResponseStatus(event, 201)
  return { success: true, slug, category }
})