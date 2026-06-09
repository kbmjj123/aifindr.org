import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import { verifyTurnstile, slugify } from '~/server/utils/utils'
import type { UserRecord } from '~/server/utils/jwt'

// 子分类白名单，与前端 CATEGORIES 配置保持一致
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

const VALID_TAGS: Record<string, string[]> = {
  feature:  ['free-tier', 'no-signup', 'open-source', 'api-available', 'browser-based', 'offline-local', 'freemium'],
  audience: ['developer', 'designer', 'marketer', 'student', 'content-creator', 'small-business', 'freelancer', 'researcher'],
  use_case: [
    // image
    'image-generation', 'image-upscaling', 'background-removal', 'logo-design', 'illustration',
    // writing
    'copywriting', 'blog-writing', 'email-writing', 'paraphrasing', 'seo-content', 'product-description',
    // video
    'video-generation', 'video-editing', 'subtitles-captions', 'avatar-video', 'animation',
    // audio
    'music-generation', 'text-to-speech', 'voice-cloning', 'transcription', 'audio-enhancement',
    // code
    'code-completion', 'code-review', 'sql-generation', 'test-generation', 'documentation',
    // productivity
    'meeting-notes', 'pdf-summarization', 'workflow-automation', 'scheduling', 'task-management',
    // marketing
    'seo-optimization', 'social-media', 'ad-copy', 'landing-page', 'competitor-analysis',
    // data
    'data-analysis', 'chart-visualization', 'spreadsheet', 'dashboard', 'report-generation',
    // education
    'homework-help', 'math-solving', 'flashcards', 'language-learning', 'course-creation',
    // business
    'business-planning', 'contract-review', 'invoicing', 'pitch-deck', 'recruiting', 'customer-support',
    // research
    'academic-research', 'paper-summarization', 'citation', 'fact-checking', 'web-scraping',
    // other
    'local-llm', 'rag', 'ai-directory', 'open-source-tool',
  ],
}

const VALID_CATEGORIES = Object.keys(VALID_SUB_CATEGORIES)

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
  const launched        = String(body.launched || '').trim()
  const hasFreeTrial    = body.has_free_trial ? 1 : 0
  const platformsRaw    = body.platforms
  const submitterSite   = String(body.submitter_site || body.submitterSite || '').trim()
  const submitterGithub = String(body.submitter_github || body.submitterGithub || '').trim()
  const submitterEmailRaw = String(body.submitter_email || body.submitterEmail || '').trim()
  const turnstileToken  = String(body.turnstileToken || '').trim()
  const bodyContent     = String(body.detailDescription || body.body || '').trim()
  const coverImage      = String(body.cover_image || '').trim()
  const screenshotUrls  = String(body.screenshot_urls || '').trim()
  const demoVideoUrl    = String(body.demo_video_url || '').trim()
  const tagsRaw         = body.tags  // [{ type: 'feature'|'audience'|'use_case', tag: string }]

  // ── 枚举值校验 ────────────────────────────────────────────
  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pricing value. Must be free, freemium, or paid' })
  }

  if (!VALID_CATEGORIES.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` })
  }

  if (subCategory && !VALID_SUB_CATEGORIES[category]?.includes(subCategory)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sub_category "${subCategory}" for category "${category}"` })
  }

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

  // ── 标签校验 ──────────────────────────────────────────────
  type TagItem = { type: string; tag: string }
  const validTags: TagItem[] = []
  if (Array.isArray(tagsRaw)) {
    for (const t of tagsRaw as TagItem[]) {
      if (
        t?.type && t?.tag &&
        VALID_TAG_TYPES.includes(t.type as typeof VALID_TAG_TYPES[number]) &&
        VALID_TAGS[t.type]?.includes(t.tag)
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

  // ── body 拼接媒体内容 ─────────────────────────────────────
  let fullBody = bodyContent || ''
  if (screenshotUrls) {
    const urls = screenshotUrls.split(',').filter(Boolean)
    if (urls.length > 0) {
      fullBody += '\n\n## Screenshots\n'
      urls.forEach((u, i) => { fullBody += `- ![Screenshot ${i + 1}](${u})\n` })
    }
  }
  if (demoVideoUrl) {
    fullBody += `\n\n## Demo Video\n${demoVideoUrl}\n`
  }

  // ── 写入 tools 表 ─────────────────────────────────────────
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  const insertResult = await env.DB.prepare(`
    INSERT INTO tools (
      slug, name, category, sub_category, website,
      pricing, price_detail, has_free_trial, platforms,
      status, launched, meta_description, cover_image,
      body, submitter_site, submitter_github, submitter_id,
      data_source, submitted_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      'pending', ?, ?, ?,
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
    hasFreeTrial,
    platformsStr,
    launched || null,
    description,
    coverImage || null,
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
  return { success: true, slug }
})