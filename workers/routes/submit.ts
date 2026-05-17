import type { Env, UserRecord } from '../types'
import { json, error } from '../lib/response'
import { verifyJWT, getTokenFromRequest } from '../lib/jwt'
import { getNotifyEmail, sendEmail } from '../lib/email'
import { verifyTurnstile, slugify } from '../lib/utils'

export async function handleSubmit(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return error('Method not allowed', 405)
  }

  // ── Extract authenticated user ──
  let submitterId: number | null = null
  const authToken = getTokenFromRequest(request)
  if (authToken) {
    const payload = await verifyJWT(authToken, env.JWT_SECRET)
    if (payload) submitterId = payload.sub
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  // ── Validate required fields ──
  const required = ['name', 'website', 'category', 'pricing', 'description'] as const
  const missing = required.filter(f => !body[f] || !String(body[f]).trim())
  if (missing.length > 0) {
    return error(`Missing required fields: ${missing.join(', ')}`, 400, 'MISSING_FIELDS')
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

  // ── Validate pricing ──
  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    return error('Invalid pricing value. Must be free, freemium, or paid', 400, 'INVALID_PRICING')
  }

  // ── Validate category ──
  const validCategories = ['image', 'writing', 'video', 'audio', 'code', 'productivity', 'marketing', 'data', 'education', 'business', 'research', 'other']
  if (!validCategories.includes(category)) {
    return error(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400, 'INVALID_CATEGORY')
  }

  // ── Verify Turnstile (skip in local dev when secret is empty) ──
  if (env.TURNSTILE_SECRET) {
    if (!turnstileToken) {
      return error('CAPTCHA verification required', 400, 'CAPTCHA_REQUIRED')
    }
    const captchaValid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET)
    if (!captchaValid) {
      return error('CAPTCHA verification failed', 400, 'CAPTCHA_FAILED')
    }
  }

  // ── Generate unique slug ──
  const baseSlug = slugify(name)
  if (!baseSlug) {
    return error('Invalid tool name', 400, 'INVALID_NAME')
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

  // ── Parse platforms ──
  let platformsStr = ''
  if (Array.isArray(platformsRaw)) {
    platformsStr = platformsRaw.map(String).join(',')
  } else if (typeof platformsRaw === 'string' && platformsRaw.trim()) {
    platformsStr = platformsRaw.trim()
  }

  // ── Insert tool ──
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(`
    INSERT INTO tools (slug, name, category, website, pricing, price_detail, has_free_trial, platforms, status, meta_description, body, submitter_site, submitter_github, submitter_id, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?, ?, ?, ?, ?)
  `).bind(
    slug,
    name,
    category,
    website,
    pricing,
    priceDetail || null,
    platformsStr,
    description,
    bodyContent || null,
    submitterSite || null,
    submitterGithub || null,
    submitterId,
    now,
  ).run()

  // ── Send notification emails (B-01 + B-02) ──

  // B-01: Confirmation to submitter
  let submitterEmail: string | null = null
  if (submitterId) {
    const submitterUser = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(submitterId).first<UserRecord>()
    submitterEmail = getNotifyEmail(submitterUser)
  }
  // Fallback: look up by GitHub username from the form
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
        `<p>If you'd like faster review (within 24 hours), check out our <a href="https://aifindr.org/submit">paid acceleration</a>.</p>`,
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
            `<p><a href="https://aifindr.org/admin">Review in admin panel →</a></p>`,
          ].join(''),
        })
      }
    }
  }

  return json({ success: true, slug }, 201)
}
