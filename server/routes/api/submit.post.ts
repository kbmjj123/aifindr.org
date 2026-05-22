import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import { verifyTurnstile, slugify } from '~/server/utils/utils'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  let submitterId: number | null = null
  const authToken = getTokenFromEvent(event)
  if (authToken) {
    const payload = await verifyJWT(authToken, env.JWT_SECRET)
    if (payload) submitterId = payload.sub
  }

  const body = await readBody<Record<string, unknown>>(event)

  const required = ['name', 'website', 'category', 'pricing', 'description'] as const
  const missing = required.filter(f => !body[f] || !String(body[f]).trim())
  if (missing.length > 0) {
    throw createError({ statusCode: 400, statusMessage: `Missing required fields: ${missing.join(', ')}` })
  }

  const name = String(body.name).trim()
  const website = String(body.website).trim()
  const category = String(body.category).trim()
  const pricing = String(body.pricing).trim()
  const description = String(body.description).trim()
  const priceDetail = String(body.price_detail || body.priceDetail || '').trim()
  const platformsRaw = body.platforms
  const submitterSite = String(body.submitter_site || body.submitterSite || '').trim()
  const submitterGithub = String(body.submitter_github || body.submitterGithub || '').trim()
  const turnstileToken = String(body.turnstileToken || '').trim()
  const bodyContent = String(body.detailDescription || body.body || '').trim()
  const useCases = String(body.use_cases || '').trim()
  const targetUsers = String(body.target_users || '').trim()
  const hasFreeTrial = body.has_free_trial ? 1 : 0

  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pricing value. Must be free, freemium, or paid' })
  }

  const validCategories = ['image', 'writing', 'video', 'audio', 'code', 'productivity', 'marketing', 'data', 'education', 'business', 'research', 'other']
  if (!validCategories.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid category. Must be one of: ${validCategories.join(', ')}` })
  }

  if (env.TURNSTILE_SECRET) {
    if (!turnstileToken) {
      throw createError({ statusCode: 400, statusMessage: 'CAPTCHA verification required' })
    }
    const captchaValid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET)
    if (!captchaValid) {
      throw createError({ statusCode: 400, statusMessage: 'CAPTCHA verification failed' })
    }
  }

  const catSuffix: Record<string, string> = {
    image: 'ai-image-generator', writing: 'ai-writing-tool', video: 'ai-video-generator',
    audio: 'ai-audio-tool', code: 'ai-coding-tool', productivity: 'ai-productivity-tool',
    marketing: 'ai-marketing-tool', data: 'ai-data-tool', education: 'ai-learning-tool',
    business: 'ai-business-tool', research: 'ai-research-tool', other: 'ai-tool',
  }
  const catKw = catSuffix[category] || 'ai-tool'
  const nameSlug = slugify(name)
  const baseSlug = nameSlug.includes(catKw.split('-')[0]) ? nameSlug : `${nameSlug}-${catKw}`
  if (!baseSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tool name' })
  }

  let slug = baseSlug
  let suffix = 0
  while (true) {
    const existing = await env.DB.prepare(
      'SELECT id FROM tools WHERE slug = ?'
    ).bind(slug).first()
    if (!existing) break
    suffix++
    slug = `${baseSlug}-${suffix}`
  }

  let platformsStr = ''
  if (Array.isArray(platformsRaw)) {
    platformsStr = platformsRaw.map(String).join(',')
  } else if (typeof platformsRaw === 'string' && platformsRaw.trim()) {
    platformsStr = platformsRaw.trim()
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(`
    INSERT INTO tools (slug, name, category, website, pricing, price_detail, has_free_trial, platforms, status, meta_description, body, submitter_site, submitter_github, submitter_id, use_cases, target_users, data_source, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'user_submit', ?)
  `).bind(
    slug,
    name,
    category,
    website,
    pricing,
    priceDetail || null,
    hasFreeTrial,
    platformsStr,
    description,
    bodyContent || null,
    submitterSite || null,
    submitterGithub || null,
    submitterId,
    useCases || null,
    targetUsers || null,
    now,
  ).run()

  // B-01: Confirmation to submitter
  let submitterEmail: string | null = null
  if (submitterId) {
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

  // B-02: Notification to admins
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
