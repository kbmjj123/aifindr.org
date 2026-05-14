interface Env {
  DB: D1Database
  CACHE: KVNamespace
  TURNSTILE_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
  ADMIN_GITHUB_IDS: string  // 管理员 GitHub ID，逗号分隔
  RESEND_API_KEY: string      // Resend 邮件服务 API Key
  GITHUB_WEBHOOK_SECRET: string  // GitHub Webhook HMAC-SHA256 签名密钥
  LEMONSQUEEZY_WEBHOOK_SECRET: string  // Lemon Squeezy Webhook 签名密钥
}

// ─── Route matching helpers ────────────────────────────────────────────

function matchPath(path: string, pattern: string): Record<string, string> | null {
  const parts = pattern.split('/')
  const actual = path.split('/')
  if (parts.length !== actual.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]?.startsWith(':')) {
      params[parts[i].slice(1)] = actual[i]
    } else if (parts[i] !== actual[i]) {
      return null
    }
  }
  return params
}

// ─── Response helpers ─────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function error(message: string, status: number, code?: string) {
  return json({ error: message, ...(code ? { code } : {}) }, status)
}

// ─── Turnstile verification ───────────────────────────────────────────

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: JSON.stringify({ secret, response: token }),
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

// ─── Slug generation ──────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// ─── JWT helpers ────────────────────────────────────────────────────

interface JWTPayload {
  sub: number
  gh_id: number
  iat: number
  exp: number
}

async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + 604800 }

  const encoder = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const data = `${header}.${payloadB64}`

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${data}.${sigB64}`
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts

    const encoder = new TextEncoder()
    const data = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data))
    if (!valid) {
      return null
    }

    const payload: JWTPayload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch (e) {
    return null
  }
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

// ─── Email helpers ────────────────────────────────────────────────────

interface UserRecord {
  id: number
  github_id: number
  username: string
  email: string | null
  avatar_url: string | null
  contact_email: string | null
  email_verified: number | null
  email_notify: number | null
  email_verify_token: string | null
  last_login_at: string | null
  unsubscribed_at: string | null
}

/** Pick the best email to use for notifications. Returns null if none available. */
function getNotifyEmail(user: UserRecord | null): string | null {
  if (!user) return null
  // Prefer user's manually provided contact email (verified)
  if (user.contact_email && user.email_verified) {
    return user.contact_email
  }
  // Fallback to GitHub public email (skip noreply)
  if (user.email && !user.email.includes('noreply.github.com')) {
    return user.email
  }
  return null
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  sceneId: string
}

/** Send a transactional email via Resend API and log to D1. */
async function sendEmail(env: Env, params: SendEmailParams): Promise<{ success: boolean; resendId?: string }> {
  let resendId: string | undefined
  let status: 'sent' | 'failed' = 'failed'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'aifindr <noreply@aifindr.org>',
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    const data = await res.json() as { id?: string; error?: string }
    if (res.ok && data.id) {
      resendId = data.id
      status = 'sent'
    } else {
      console.error('Resend API error:', data.error || res.statusText)
    }
  } catch (e) {
    console.error('sendEmail failed:', e)
  }

  // Always log to D1
  try {
    await env.DB.prepare(
      'INSERT INTO email_logs (scene_id, recipient, subject, status, resend_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(params.sceneId, params.to, params.subject, status, resendId || null).run()
  } catch (e) {
    console.error('email_logs insert failed:', e)
  }

  return { success: status === 'sent', resendId }
}

// ─── Main handler ─────────────────────────────────────────────────────

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    switch (controller.cron) {
      case '0 9 * * *':
        await handleCronDailyOps(env)
        break
      case '0 3 * * *':
        await handleCronLinkChecker(env)
        break
      case '0 8 1 * *':
        await handleCronMonthlyReport(env)
        break
      case '0 14 * * 1':
        await handleCronNewsletter(env)
        break
      default:
        console.log('Unknown cron pattern:', controller.cron)
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const method = request.method

    if (method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      // ─────────────────────────────────────────────────────────────────
      // GET /api/tools — list with filters
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/tools') {
        return handleListTools(url, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/tools/search — full text search
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/tools/search') {
        return handleSearch(url, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/stats — site statistics
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/stats') {
        return handleStats(env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/tools/:category/:slug — tool detail with images + videos
      // ─────────────────────────────────────────────────────────────────
      const detailParams = matchPath(path, '/tools/:category/:slug')
      if (method === 'GET' && detailParams) {
        return handleToolDetail(detailParams.category!, detailParams.slug!, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/click/:id — record click
      // ─────────────────────────────────────────────────────────────────
      const clickParams = matchPath(path, '/click/:id')
      if (method === 'POST' && clickParams) {
        return handleClick(clickParams.id!, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/submit — form submission
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/submit') {
        return handleSubmit(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/auth/github — redirect to GitHub OAuth
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/auth/github') {
        return handleAuthRedirect(url, request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/auth/callback — handle GitHub OAuth callback
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/auth/callback') {
        return handleAuthCallback(url, request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/auth/me — get current user info
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/auth/me') {
        return handleAuthMe(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // Admin routes (auth via ADMIN_KEY header)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/admin/tools') {
        return handleAdminListTools(url, request, env)
      }

      const adminApproveParams = matchPath(path, '/admin/tools/:id/approve')
      if (method === 'POST' && adminApproveParams) {
        return handleAdminApprove(adminApproveParams.id!, request, env)
      }

      const adminRejectParams = matchPath(path, '/admin/tools/:id/reject')
      if (method === 'POST' && adminRejectParams) {
        return handleAdminReject(adminRejectParams.id!, request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/user/email — update contact email (authenticated)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/user/email') {
        return handleUserEmail(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/generate — AI article generation
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/generate') {
        return handleGenerate(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/user/email/verify/:token — verify contact email
      // ─────────────────────────────────────────────────────────────────
      const verifyParams = matchPath(path, '/user/email/verify/:token')
      if (method === 'GET' && verifyParams) {
        return handleEmailVerify(verifyParams.token!, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // GET /api/admin/pending — list pending tools (admin only)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'GET' && path === '/admin/pending') {
        return handleAdminPending(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/admin/review — approve or reject a tool (admin only)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/admin/review') {
        return handleAdminReview(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/admin/feature — set featured/verified flags (admin only)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/admin/feature') {
        return handleAdminFeature(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/admin/broadcast — send announcement to all users (admin)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/admin/broadcast') {
        return handleAdminBroadcast(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/webhooks/github — receive GitHub webhook events
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/webhooks/github') {
        return handleGithubWebhook(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // POST /api/webhooks/lemonsqueezy — receive Lemon Squeezy webhooks
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/webhooks/lemonsqueezy') {
        return handleLemonSqueezyWebhook(request, env)
      }

      // ─────────────────────────────────────────────────────────────────
      // Cron trigger routes (also callable manually for testing)
      // ─────────────────────────────────────────────────────────────────
      if (method === 'POST' && path === '/cron/daily-ops') {
        await handleCronDailyOps(env)
        return json({ success: true, message: 'Daily ops completed' })
      }
      if (method === 'POST' && path === '/cron/link-checker') {
        const checked = await handleCronLinkChecker(env)
        return json({ success: true, message: 'Link checker completed', ...checked })
      }
      if (method === 'POST' && path === '/cron/monthly-report') {
        const result = await handleCronMonthlyReport(env)
        return json({ success: true, message: 'Monthly report sent', ...result })
      }
      if (method === 'POST' && path === '/cron/newsletter') {
        const requestBody = await request.json().catch(() => ({})) as Record<string, unknown>
        const result = await handleCronNewsletter(env, String(requestBody.subject || ''), String(requestBody.body || ''))
        return json({ success: true, message: 'Newsletter sent', ...result })
      }

      return error('Not found', 404)
    } catch (err) {
      console.error('Worker error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      return error(message, 500)
    }
  },
}

// ─── Handler implementations ──────────────────────────────────────────

async function handleListTools(url: URL, env: Env) {
  const category = url.searchParams.get('category')
  const pricing = url.searchParams.get('pricing')  // comma-separated: free,freemium
  const platform = url.searchParams.get('platform')
  const tags = url.searchParams.get('tags')         // comma-separated
  const sort = url.searchParams.get('sort') || 'latest'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '24')))

  // Build WHERE clauses
  const conditions: string[] = ["t.status = 'active'"]
  const params: unknown[] = []

  if (category) {
    conditions.push('t.category = ?')
    params.push(category)
  }

  if (pricing) {
    const prices = pricing.split(',')
    conditions.push(`t.pricing IN (${prices.map(() => '?').join(',')})`)
    params.push(...prices)
  }

  if (platform) {
    conditions.push("t.platforms LIKE ?")
    params.push(`%${platform}%`)
  }

  if (tags) {
    const tagList = tags.split(',').filter(Boolean)
    if (tagList.length > 0) {
      conditions.push(`EXISTS (SELECT 1 FROM tool_tags tt WHERE tt.tool_id = t.id AND tt.tag IN (${tagList.map(() => '?').join(',')}))`)
      params.push(...tagList)
    }
  }

  const where = conditions.join(' AND ')

  // Get total count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM tools t WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0

  // Build ORDER BY
  let orderBy: string
  switch (sort) {
    case 'trending':
      orderBy = 't.click_count DESC'
      break
    case 'featured':
      orderBy = 't.featured DESC, t.submitted_at DESC'
      break
    default:
      orderBy = 't.submitted_at DESC'
  }

  // Fetch page
  const offset = (page - 1) * pageSize
  const { results: tools } = await env.DB.prepare(
    `SELECT t.* FROM tools t WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return json({ tools, total, page, pageSize })
}

async function handleToolDetail(category: string, slug: string, env: Env) {
  const tool = await env.DB.prepare(
    "SELECT * FROM tools WHERE slug = ? AND category = ? AND status = 'active'"
  ).bind(slug, category).first()

  if (!tool) {
    return error('Tool not found', 404)
  }

  // Fetch related images
  const { results: images } = await env.DB.prepare(
    'SELECT * FROM tool_images WHERE tool_id = ? ORDER BY sort_order ASC'
  ).bind((tool as Record<string, unknown>).id).all()

  // Fetch related videos
  const { results: videos } = await env.DB.prepare(
    'SELECT * FROM tool_videos WHERE tool_id = ? ORDER BY sort_order ASC'
  ).bind((tool as Record<string, unknown>).id).all()

  // Fetch tags
  const { results: tagRows } = await env.DB.prepare(
    'SELECT tag FROM tool_tags WHERE tool_id = ?'
  ).bind((tool as Record<string, unknown>).id).all()

  const tags = (tagRows as { tag: string }[]).map(r => r.tag)

  return json({
    ...tool as Record<string, unknown>,
    tags,
    images,
    videos,
  })
}

async function handleSearch(url: URL, env: Env) {
  const q = url.searchParams.get('q') || ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')))

  if (!q.trim()) {
    return json({ tools: [], query: q, total: 0, page, pageSize })
  }

  const like = `%${q.trim()}%`
  const offset = (page - 1) * pageSize

  // Count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM tools t WHERE t.status = 'active' AND (t.name LIKE ? OR t.meta_description LIKE ? OR EXISTS (SELECT 1 FROM tool_tags tt WHERE tt.tool_id = t.id AND tt.tag LIKE ?))`
  ).bind(like, like, like).first<{ total: number }>()
  const total = countResult?.total || 0

  // Results
  const { results: tools } = await env.DB.prepare(
    `SELECT t.* FROM tools t WHERE t.status = 'active' AND (t.name LIKE ? OR t.meta_description LIKE ? OR EXISTS (SELECT 1 FROM tool_tags tt WHERE tt.tool_id = t.id AND tt.tag LIKE ?)) ORDER BY t.featured DESC, t.click_count DESC LIMIT ? OFFSET ?`
  ).bind(like, like, like, pageSize, offset).all()

  return json({ tools, query: q, total, page, pageSize })
}

async function handleStats(env: Env) {
  // Check KV cache
  const cached = await env.CACHE.get('stats', 'json')
  if (cached) {
    return json(cached)
  }

  const toolCount = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM tools WHERE status = 'active'"
  ).first<{ count: number }>()

  const categoryCount = await env.DB.prepare(
    "SELECT COUNT(DISTINCT category) as count FROM tools WHERE status = 'active'"
  ).first<{ count: number }>()

  const contributorCount = await env.DB.prepare(
    "SELECT COUNT(DISTINCT submitter_github) as count FROM tools WHERE status = 'active' AND submitter_github IS NOT NULL AND submitter_github != ''"
  ).first<{ count: number }>()

  const stats = {
    tools: toolCount?.count || 0,
    categories: categoryCount?.count || 0,
    contributors: contributorCount?.count || 0,
  }

  // Cache for 1 hour
  await env.CACHE.put('stats', JSON.stringify(stats), { expirationTtl: 3600 })

  return json(stats)
}

async function handleClick(id: string, env: Env) {
  const numericId = parseInt(id)
  if (isNaN(numericId)) {
    return error('Invalid tool ID', 400)
  }

  const result = await env.DB.prepare(
    'UPDATE tools SET click_count = click_count + 1 WHERE id = ?'
  ).bind(numericId).run()

  if (result.meta.changes === 0) {
    return error('Tool not found', 404)
  }

  return json({ success: true })
}

async function handleSubmit(request: Request, env: Env) {
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

// ─── Auth handlers ──────────────────────────────────────────────────

async function handleAuthRedirect(url: URL, request: Request, env: Env) {
  const redirectUri = `${url.origin}/api/auth/callback`
  // Store frontend origin in state so we can redirect back after callback
  const referer = request.headers.get('Referer')
  const frontendOrigin = request.headers.get('Origin') || (referer ? new URL(referer).origin : url.origin)
  const ghUrl = new URL('https://github.com/login/oauth/authorize')
  ghUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
  ghUrl.searchParams.set('redirect_uri', redirectUri)
  ghUrl.searchParams.set('scope', 'read:user user:email')
  ghUrl.searchParams.set('state', frontendOrigin)
  return Response.redirect(ghUrl.toString(), 302)
}

async function handleAuthCallback(url: URL, request: Request, env: Env): Promise<Response> {
  const code = url.searchParams.get('code')
  if (!code) return error('Missing code', 400)

  // Exchange code for access token
  let tokenData: { access_token?: string; error?: string; error_description?: string }
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    tokenData = await tokenRes.json()
  } catch (e) {
    return error(`GitHub token exchange failed: ${e}`, 502)
  }
  if (!tokenData.access_token) {
    return error(tokenData.error_description || tokenData.error || 'Failed to get access token', 400)
  }
  const accessToken = tokenData.access_token

  // Fetch GitHub user
  let ghUser: { id: number; login: string; avatar_url: string }
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
    })
    if (!userRes.ok) {
      const errText = await userRes.text()
      return error(`GitHub API ${userRes.status}: ${errText}`, 502)
    }
    ghUser = await userRes.json()
  } catch (e) {
    return error(`GitHub user fetch failed: ${e}`, 502)
  }

  // Fetch primary email
  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'aifindr-worker' },
  })
  const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[]
  const primaryEmail = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email || ''

  // Upsert user in D1
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, email = ?, avatar_url = ?, updated_at = ? WHERE github_id = ?')
      .bind(ghUser.login, primaryEmail, ghUser.avatar_url, now, ghUser.id).run()
  } else {
    await env.DB.prepare('INSERT INTO users (github_id, username, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(ghUser.id, ghUser.login, primaryEmail, ghUser.avatar_url, now).run()
  }

  // Get user ID
  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first() as { id: number }

  // Sign JWT
  const jwt = await signJWT({ sub: user.id, gh_id: ghUser.id }, env.JWT_SECRET)

  // ── A-01: Guide user to set contact_email if GitHub email is noreply ──
  const isNoreply = !primaryEmail || primaryEmail.includes('noreply.github.com')
  const existingContact = existing
    ? (await env.DB.prepare('SELECT contact_email FROM users WHERE github_id = ?').bind(ghUser.id).first<{ contact_email: string | null }>())?.contact_email
    : null

  if (isNoreply && !existingContact) {
    void sendEmail(env, {
      to: primaryEmail || '',  // Will fail gracefully if no email, but email_logs will record it
      sceneId: 'A-01',
      subject: '[aifindr] Add your contact email to receive notifications',
      html: [
        `<p>Hi <strong>@${ghUser.login}</strong>! Welcome to aifindr.org.</p>`,
        `<p>Your GitHub email is set to private, so we can't send you important notifications — like submission status updates, review results, and backlink confirmations.</p>`,
        `<p><strong>Add your contact email here:</strong></p>`,
        `<p><a href="https://aifindr.org/settings">Go to Settings →</a></p>`,
        `<p>It's optional and only takes a moment. We'll only email you about your submissions and reviews.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }
  // Also update last_login_at
  await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE github_id = ?').bind(now, ghUser.id).run()

  // Redirect back to frontend with token (use state param or fallback to origin)
  const frontendOrigin = url.searchParams.get('state') || url.origin
  const frontendUrl = new URL(frontendOrigin)
  frontendUrl.searchParams.set('token', jwt)
  return Response.redirect(frontendUrl.toString(), 302)
}

async function handleAuthMe(request: Request, env: Env): Promise<Response> {
  // Try Authorization header first, then cookie
  let token = getTokenFromRequest(request)
  if (!token) {
    const cookie = request.headers.get('Cookie') || ''
    const match = cookie.match(/(?:^|;\s*)aifindr-token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  const user = await env.DB.prepare(
    'SELECT id, username, email, avatar_url, contact_email, email_verified FROM users WHERE id = ?'
  ).bind(payload.sub).first<Record<string, unknown>>()
  if (!user) return error('User not found', 404)

  const isNoreply = !user.email || String(user.email).includes('noreply.github.com')
  const needsContactEmail = isNoreply && !user.contact_email

  return json({ ...user, needs_contact_email: needsContactEmail })
}


// ─── Admin helpers ──────────────────────────────────────────────────

function checkAdminAuth(request: Request, env: Env): boolean {
  // Try Authorization header first, then cookie
  const auth = request.headers.get('Authorization')
  if (auth === `Bearer ${env.ADMIN_KEY}`) return true
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)admin-key=([^;]+)/)
  return match?.[1] === env.ADMIN_KEY
}

async function handleAdminListTools(url: URL, request: Request, env: Env) {
  if (!checkAdminAuth(request, env)) return error("Unauthorized", 401)
  const status = url.searchParams.get('status') || 'pending'
  const { results } = await env.DB.prepare(
    'SELECT * FROM tools WHERE status = ? ORDER BY submitted_at DESC LIMIT 50'
  ).bind(status).all()
  return json(results)
}

async function handleAdminApprove(id: string, request: Request, env: Env) {
  if (!checkAdminAuth(request, env)) return error("Unauthorized", 401)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await env.DB.prepare(
    "UPDATE tools SET status = 'active', updated_at = ? WHERE id = ?"
  ).bind(now, parseInt(id)).run()
  if (result.meta.changes === 0) return error('Tool not found', 404)
  return json({ success: true })
}

async function handleAdminReject(id: string, request: Request, env: Env) {
  if (!checkAdminAuth(request, env)) return error("Unauthorized", 401)
  const result = await env.DB.prepare(
    "UPDATE tools SET status = 'discontinued' WHERE id = ?"
  ).bind(parseInt(id)).run()
  if (result.meta.changes === 0) return error('Tool not found', 404)
  return json({ success: true })
}

// ─── Admin handlers ──────────────────────────────────────────────────

/** Verify the request comes from an admin user. Returns JWT payload or null. */
async function verifyAdmin(request: Request, env: Env): Promise<JWTPayload | null> {
  const authToken = getTokenFromRequest(request)
  if (!authToken) return null
  const payload = await verifyJWT(authToken, env.JWT_SECRET)
  if (!payload) return null
  const adminIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
  if (!adminIds.includes(payload.gh_id)) return null
  return payload
}

/** GET /api/admin/pending — list tools awaiting review */
async function handleAdminPending(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt(new URL(request.url).searchParams.get('pageSize') || '20')))
  const offset = (page - 1) * pageSize

  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM tools WHERE status = 'pending'"
  ).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: tools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' ORDER BY submitted_at ASC LIMIT ? OFFSET ?"
  ).bind(pageSize, offset).all()

  return json({ tools, total, page, pageSize })
}

/** POST /api/admin/review — approve or reject a submitted tool */
async function handleAdminReview(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const toolId = Number(body.tool_id || body.toolId)
  const status = String(body.status || '')
  const rejectReason = String(body.reject_reason || body.rejectReason || '').trim()
  const reviewerNote = String(body.reviewer_note || body.reviewerNote || '').trim()

  if (!toolId || isNaN(toolId)) {
    return error('Missing or invalid tool_id', 400, 'INVALID_TOOL_ID')
  }

  const validStatuses = ['active', 'rejected', 'needs_info']
  if (!validStatuses.includes(status)) {
    return error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_STATUS')
  }

  if (status === 'rejected' && !rejectReason) {
    return error('reject_reason is required when status is rejected', 400, 'MISSING_REJECT_REASON')
  }

  // Verify tool exists and is pending
  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) {
    return error('Tool not found', 404)
  }
  if (tool.status !== 'pending') {
    return error(`Tool has already been reviewed (current status: ${tool.status})`, 400, 'ALREADY_REVIEWED')
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(`
    UPDATE tools SET status = ?, reject_reason = ?, reviewer_note = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, rejectReason || null, reviewerNote || null, now, now, toolId).run()

  // Clear stats cache so homepage reflects the updated tool count
  await env.CACHE.delete('stats')

  // ── Send notification email (B-03 / B-04) ──
  const toolName = String(tool.name || '')
  const toolSlug = String(tool.slug || '')
  const toolCategory = String(tool.category || '')
  const submitterId = tool.submitter_id as number | null
  const submitterGithub = String(tool.submitter_github || '')

  // Find submitter's email
  let submitterEmail: string | null = null
  if (submitterId) {
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(submitterId).first<UserRecord>()
    submitterEmail = getNotifyEmail(user)
  }
  if (!submitterEmail && submitterGithub) {
    const ghUser = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(submitterGithub).first<UserRecord>()
    submitterEmail = getNotifyEmail(ghUser)
  }

  if (submitterEmail) {
    if (status === 'active') {
      // B-03: Approval with three backlinks
      const detailUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
      const contributorUrl = `https://aifindr.org/contributors/${submitterGithub}`
      const githubUrl = `https://github.com/aifindr-org/aifindr.org/blob/main/content/tools/${toolCategory}/${toolSlug}.md`

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-03',
        subject: `[aifindr] Your tool "${toolName}" has been approved!`,
        html: [
          `<p>Great news! Your tool <strong>${toolName}</strong> has been approved and is now live.</p>`,
          `<p>Here are your <strong>three dofollow backlinks</strong>:</p>`,
          `<ol>`,
          `<li><a href="${githubUrl}">GitHub</a> — github.com (DA 100)</li>`,
          `<li><a href="${detailUrl}">Tool Detail Page</a> — aifindr.org</li>`,
          `<li><a href="${contributorUrl}">Contributor Page</a> — aifindr.org/contributors/${submitterGithub}</li>`,
          `</ol>`,
          `<p><a href="${detailUrl}">View your listing →</a></p>`,
          `<p>Share it with your network — the more clicks it gets, the higher it ranks on Trending!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })

      // Ping search engines to index the new tool page
      const toolPageUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
      void notifySearchEngines(toolPageUrl)

      // F-02: Notify submitters in the same category about the new tool
      const { results: categorySubmitters } = await env.DB.prepare(
        'SELECT DISTINCT submitter_id FROM tools WHERE category = ? AND status = ? AND submitter_id IS NOT NULL AND submitter_id != ?'
      ).bind(toolCategory, 'active', submitterId || 0).all<{ submitter_id: number }>()

      const notified = new Set<number>()
      for (const row of categorySubmitters) {
        if (notified.has(row.submitter_id)) continue
        notified.add(row.submitter_id)

        const catUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(row.submitter_id).first<UserRecord>()
        const catEmail = getNotifyEmail(catUser)
        if (catEmail) {
          void sendEmail(env, {
            to: catEmail,
            sceneId: 'F-02',
            subject: `[aifindr] New ${toolCategory} tool: ${toolName}`,
            html: [
              `<p>A new tool has been added in <strong>${toolCategory}</strong>:</p>`,
              `<h3>${toolName}</h3>`,
              `<p><a href="https://aifindr.org/tools/${toolCategory}/${toolSlug}">View ${toolName} →</a></p>`,
              `<p style="color:#666;font-size:11px;">You're receiving this because you submitted a tool in the ${toolCategory} category. <a href="https://aifindr.org/settings">Manage notifications</a>.</p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    } else if (status === 'rejected') {
      // B-04: Rejection with reason
      const reasonMap: Record<string, string> = {
        info_incomplete: 'Information is incomplete — please provide more details about the tool',
        not_qualified: 'Not qualified — the tool does not meet our listing criteria',
        duplicate: 'Duplicate — this tool is already listed in our directory',
        other: reviewerNote || 'Other reason',
      }
      const reasonText = reasonMap[rejectReason] || rejectReason || ''
      const noteLine = reviewerNote ? `<p><strong>Reviewer notes:</strong> ${reviewerNote}</p>` : ''

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-04',
        subject: `[aifindr] Update on your submission "${toolName}"`,
        html: [
          `<p>Thank you for submitting <strong>${toolName}</strong> to aifindr.org.</p>`,
          `<p>After review, we were unable to approve it at this time:</p>`,
          `<blockquote>${reasonText}</blockquote>`,
          noteLine,
          `<p>You're welcome to revise and <a href="https://aifindr.org/submit">resubmit</a> — we'd love to have your tool listed!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    } else if (status === 'needs_info') {
      // B-06: Additional information needed
      const noteLine = reviewerNote ? `<p><strong>What's needed:</strong> ${reviewerNote}</p>` : ''

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-06',
        subject: `[aifindr] Your submission "${toolName}" needs more info`,
        html: [
          `<p>Thanks for submitting <strong>${toolName}</strong> to aifindr.org!</p>`,
          `<p>We've reviewed your submission and need a bit more information before we can approve it.</p>`,
          noteLine,
          `<p>Please update your submission with the requested details. Once updated, our team will re-review it.</p>`,
          `<p><a href="https://aifindr.org/submit">Resubmit →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return json({
    success: true,
    tool: { id: toolId, name: toolName, status, reviewed_at: now },
  })
}

/** POST /api/admin/feature — set featured/verified flags on a tool */
async function handleAdminFeature(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const toolId = Number(body.tool_id || body.toolId)
  const featured = body.featured !== undefined ? Boolean(body.featured) : null
  const verified = body.verified !== undefined ? Boolean(body.verified) : null

  if (!toolId || isNaN(toolId)) {
    return error('Missing or invalid tool_id', 400, 'INVALID_TOOL_ID')
  }
  if (featured === null && verified === null) {
    return error('At least one of featured or verified must be provided', 400, 'MISSING_FIELDS')
  }

  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) return error('Tool not found', 404)

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const updates: string[] = []
  const params: unknown[] = []

  if (featured !== null) {
    updates.push('featured = ?')
    params.push(featured ? 1 : 0)
  }
  if (verified !== null) {
    updates.push('verified = ?')
    params.push(verified ? 1 : 0)
  }
  updates.push('updated_at = ?')
  params.push(now)
  params.push(toolId)

  await env.DB.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()

  // C-02: Featured activated notification
  if (featured === true) {
    const toolName = String(tool.name || '')
    const toolSlug = String(tool.slug || '')
    const toolCategory = String(tool.category || '')
    const submitterId = tool.submitter_id as number | null
    const submitterGithub = String(tool.submitter_github || '')

    let submitterEmail: string | null = null
    if (submitterId) {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(submitterId).first<UserRecord>()
      submitterEmail = getNotifyEmail(user)
    }
    if (!submitterEmail && submitterGithub) {
      const ghUser = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(submitterGithub).first<UserRecord>()
      submitterEmail = getNotifyEmail(ghUser)
    }

    if (submitterEmail) {
      const detailUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'C-02',
        subject: `[aifindr] Your tool "${toolName}" is now Featured!`,
        html: [
          `<p>Great news! Your tool <strong>${toolName}</strong> is now Featured on the aifindr.org homepage.</p>`,
          `<p>As a Featured tool, it gets prime placement and increased visibility to our visitors.</p>`,
          `<p><a href="${detailUrl}">View your Featured listing →</a></p>`,
          `<p>Share it with your network to maximize its reach!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return json({ success: true, tool_id: toolId, featured, verified })
}

/** POST /api/admin/broadcast — send announcement to all subscribed users (F-03) */
async function handleAdminBroadcast(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const subject = String(body.subject || '').trim()
  const htmlBody = String(body.body || body.html || '').trim()

  if (!subject || !htmlBody) {
    return error('subject and body are required', 400, 'MISSING_FIELDS')
  }

  // Get all subscribed users (email_notify=1, not unsubscribed)
  const { results: recipients } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let sent = 0
  for (const user of recipients) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    sent++
    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-03',
      subject: `[aifindr] ${subject}`,
      html: [
        htmlBody,
        `<p style="color:#666;font-size:11px;margin-top:16px;">You're receiving this as an aifindr.org member. <a href="https://aifindr.org/settings">Manage email preferences</a>.</p>`,
      ].join(''),
    })
  }

  return json({ success: true, recipients: recipients.length, sent })
}

// ─── User handlers ───────────────────────────────────────────────────

// ─── Webhook handlers ──────────────────────────────────────────────

/** POST /api/webhooks/github — handle GitHub webhook events */
async function handleGithubWebhook(request: Request, env: Env): Promise<Response> {
  // Verify signature
  const sigHeader = request.headers.get('X-Hub-Signature-256')
  if (!sigHeader) return error('Missing signature', 401)

  const body = await request.text()

  // HMAC-SHA256 verification
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.GITHUB_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (sigHeader !== expectedSig) {
    return error('Invalid signature', 403)
  }

  // Parse event
  const eventType = request.headers.get('X-GitHub-Event') || ''

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  if (eventType === 'pull_request') {
    const action = payload.action as string
    const pr = payload.pull_request as Record<string, unknown> | null
    const merged = pr?.merged as boolean | null

    if (action === 'closed' && merged) {
      return handlePRMerged(payload, env)
    }
  }

  // Acknowledge other events silently
  return json({ received: true })
}

/** Handle a merged PR: detect tool files and send B-05 notifications */
async function handlePRMerged(payload: Record<string, unknown>, env: Env): Promise<Response> {
  const pr = payload.pull_request as Record<string, unknown>
  const title = String(pr?.title || '')
  const prUrl = String(pr?.html_url || '')

  // Get list of changed files
  const files = (payload.files || payload.files_url) ? [] : []
  // Files array may be in payload for simple webhooks
  const changedFiles = (payload as { files?: Array<{ filename: string; status: string }> }).files || []

  // Detect tool markdown files
  const toolFiles = changedFiles.filter(
    f => f.filename.startsWith('content/tools/') && f.filename.endsWith('.md') && (f.status === 'added' || f.status === 'modified')
  )

  for (const file of toolFiles) {
    // Extract category/slug from path: content/tools/{category}/{slug}.md
    const pathParts = file.filename.replace('content/tools/', '').replace('.md', '').split('/')
    if (pathParts.length < 2) continue
    const category = pathParts[0]
    const slug = pathParts[1]

    // Look up tool in D1
    const tool = await env.DB.prepare(
      'SELECT * FROM tools WHERE slug = ? AND category = ?'
    ).bind(slug, category).first<Record<string, unknown>>()

    if (!tool) continue

    const submitterId = tool.submitter_id as number | null
    const submitterGithub = String(tool.submitter_github || '')

    let submitterEmail: string | null = null
    if (submitterId) {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(submitterId).first<UserRecord>()
      submitterEmail = getNotifyEmail(user)
    }
    if (!submitterEmail && submitterGithub) {
      const ghUser = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(submitterGithub).first<UserRecord>()
      submitterEmail = getNotifyEmail(ghUser)
    }

    if (submitterEmail) {
      const detailUrl = `https://aifindr.org/tools/${category}/${slug}`
      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-05',
        subject: `[aifindr] Your tool "${tool.name}" is now live via GitHub PR!`,
        html: [
          `<p>Your pull request <a href="${prUrl}">${title}</a> has been merged!</p>`,
          `<p>Your tool <strong>${tool.name}</strong> is now published on aifindr.org.</p>`,
          `<p>Your dofollow backlinks are now active — check them out:</p>`,
          `<ul>`,
          `<li><a href="${detailUrl}">${detailUrl}</a> — Tool detail page</li>`,
          `<li><a href="https://github.com/aifindr-org/aifindr.org/blob/main/content/tools/${category}/${slug}.md">GitHub</a> — github.com (DA 100)</li>`,
          `</ul>`,
          `<p><a href="${detailUrl}">View your listing →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return json({ success: true, tools: toolFiles.length })
}

/** POST /api/webhooks/lemonsqueezy — handle Lemon Squeezy webhook events */
async function handleLemonSqueezyWebhook(request: Request, env: Env): Promise<Response> {
  // Verify X-Signature
  const sigHeader = request.headers.get('X-Signature')
  if (!sigHeader) return error('Missing signature', 401)

  const body = await request.text()

  // HMAC-SHA256 verification (LS uses hex-encoded HMAC)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.LEMONSQUEEZY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (sigHeader !== expectedSig) {
    return error('Invalid signature', 403)
  }

  // Parse payload
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const meta = payload.meta as Record<string, unknown> | undefined
  const eventName = String(meta?.event_name || '')
  const data = payload.data as Record<string, unknown> | undefined
  const orderId = String(data?.id || '')
  const attrs = data?.attributes as Record<string, unknown> | undefined

  if (!eventName || !orderId) {
    return json({ received: true, skipped: 'missing event info' })
  }

  // Idempotency: check if this order+event was already processed
  // LS may retry webhooks, so check for a recent entry with the same scene + recipient + order ID
  const dedupTag = `ls:${orderId}:${eventName}`
  const existingLog = await env.DB.prepare(
    "SELECT id FROM email_logs WHERE resend_id = ? LIMIT 1"
  ).bind(dedupTag).first()

  if (existingLog) {
    return json({ received: true, skipped: 'duplicate' })
  }

  // Pre-insert a dedup marker so retries within the same moment also get caught
  await env.DB.prepare(
    "INSERT INTO email_logs (scene_id, recipient, subject, status, resend_id) VALUES (?, ?, ?, 'sent', ?)"
  ).bind(`LS::${eventName}`, orderId, `Lemon Squeezy ${eventName}`, dedupTag).run()

  // Extract buyer info
  const buyerEmail = String(attrs?.user_email || '')
  const buyerName = String(attrs?.user_name || '')
  const productName = String(
    (attrs?.first_order_item as Record<string, unknown>)?.product_name || ''
  )
  const variantName = String(
    (attrs?.first_order_item as Record<string, unknown>)?.variant_name || ''
  )
  const total = Number(attrs?.total || 0)
  const currency = String(attrs?.currency || 'USD')
  const priceDisplay = `${currency} $${(total / 100).toFixed(2)}`

  if (!buyerEmail) {
    return json({ received: true, skipped: 'no buyer email' })
  }

  switch (eventName) {
    case 'order_created':
      // C-01: Featured purchase / C-03: Fast-track / C-05: Verified
      await handleLSPurchaseEmail(env, { buyerEmail, buyerName, productName, variantName, priceDisplay, orderId })
      break
    case 'order_refunded':
    case 'subscription_payment_failed':
      // C-06: Payment failure / refund
      await handleLSPaymentFailure(env, { buyerEmail, buyerName, productName, priceDisplay, orderId, eventName })
      break
    default:
      return json({ received: true, skipped: `unhandled event: ${eventName}` })
  }

  return json({ success: true, event: eventName })
}

/** Detect product type from name and send the right purchase confirmation */
async function handleLSPurchaseEmail(env: Env, opts: {
  buyerEmail: string; buyerName: string; productName: string; variantName: string; priceDisplay: string; orderId: string
}) {
  const { buyerEmail, buyerName, productName, variantName, priceDisplay, orderId } = opts
  const productLabel = (productName || variantName).toLowerCase()

  let sceneId: string
  let purchaseTitle: string
  let purchaseBody: string

  if (productLabel.includes('featured')) {
    sceneId = 'C-01'
    purchaseTitle = 'Featured Placement'
    purchaseBody = 'Your tool will be featured on the aifindr.org homepage. Our team will activate it shortly.'
  } else if (productLabel.includes('fast') || productLabel.includes('accelerat') || productLabel.includes('review') || productLabel.includes('priority')) {
    sceneId = 'C-03'
    purchaseTitle = 'Fast-Track Review'
    purchaseBody = 'Your submission will be reviewed within 24 hours. You\'ll receive another email once the review is complete.'
  } else if (productLabel.includes('verified') || productLabel.includes('certif')) {
    sceneId = 'C-05'
    purchaseTitle = 'Verified Badge'
    purchaseBody = 'Your tool will receive the Verified badge. Our team will apply it shortly.'
  } else {
    // Generic purchase confirmation
    sceneId = 'C-01'
    purchaseTitle = productName || variantName || 'Purchase'
    purchaseBody = 'Our team will process your order shortly.'
  }

  void sendEmail(env, {
    to: buyerEmail,
    sceneId,
    subject: `[aifindr] Your ${purchaseTitle} purchase is confirmed`,
    html: [
      `<p>Hi ${buyerName || 'there'}! Your purchase is confirmed.</p>`,
      `<table>`,
      `<tr><td><strong>Product:</strong></td><td>${purchaseTitle}</td></tr>`,
      `<tr><td><strong>Amount:</strong></td><td>${priceDisplay}</td></tr>`,
      `<tr><td><strong>Order:</strong></td><td><code>${orderId}</code></td></tr>`,
      `</table>`,
      `<p>${purchaseBody}</p>`,
      `<p>Questions? Reply to this email or <a href="https://aifindr.org">visit aifindr.org</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}

/** Send payment failure / refund notification (C-06) */
async function handleLSPaymentFailure(env: Env, opts: {
  buyerEmail: string; buyerName: string; productName: string; priceDisplay: string; orderId: string; eventName: string
}) {
  const { buyerEmail, buyerName, productName, priceDisplay, orderId, eventName } = opts
  const isRefund = eventName === 'order_refunded'
  const title = isRefund ? 'Refund processed' : 'Payment failed'

  void sendEmail(env, {
    to: buyerEmail,
    sceneId: 'C-06',
    subject: `[aifindr] ${title} — ${productName || 'Order'} ${orderId}`,
    html: [
      `<p>Hi ${buyerName || 'there'},</p>`,
      isRefund
        ? `<p>Your refund for <strong>${productName || 'your order'}</strong> (${priceDisplay}) has been processed.</p>`
        : `<p>Your payment for <strong>${productName || 'your order'}</strong> (${priceDisplay}) could not be processed.</p>`,
      `<p><strong>Order ID:</strong> <code>${orderId}</code></p>`,
      isRefund
        ? `<p>The refund should appear on your statement within 5–10 business days.</p>`
        : `<p>Please check your payment method or try again. If the issue persists, <a href="https://aifindr.org">contact support</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}

// ─── Search engine notification ──────────────────────────────────

/** Ping Google & Bing sitemap endpoints to notify them of new content.
 *  Also pings the specific tool URL to Google's PubSubHubbub hub.
 *  Non-blocking — failures are logged but don't affect the response. */
async function notifySearchEngines(newUrl: string): Promise<void> {
  const sitemapUrl = 'https://aifindr.org/sitemap.xml'

  // Google sitemap ping
  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Google sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Google ping failed:', e)
  }

  // Bing sitemap ping
  try {
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    console.log('SEO: Bing sitemap ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: Bing ping failed:', e)
  }

  // Google PubSubHubbub — helps with faster discovery
  try {
    const hubParams = new URLSearchParams({
      'hub.url': newUrl,
      'hub.mode': 'publish',
    })
    await fetch(`https://pubsubhubbub.appspot.com/publish?${hubParams.toString()}`, {
      method: 'POST',
    })
    console.log('SEO: PubSubHubbub ping sent for', newUrl)
  } catch (e) {
    console.error('SEO: PubSubHubbub ping failed:', e)
  }

  console.log(`SEO: Search engines notified for ${newUrl}`)
}

// ─── Cron handlers ───────────────────────────────────────────────────

/** Cron 2: Link checker — verify published backlinks and alert on failures (E-01) */
async function handleCronLinkChecker(env: Env): Promise<{ total: number; dead: number }> {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  // Get links that haven't been checked in the last 24 hours, limit to 20 per run
  const { results: links } = await env.DB.prepare(
    `SELECT * FROM published_links
     WHERE is_active = 1 AND (last_checked IS NULL OR last_checked < datetime('now', '-1 day'))
     ORDER BY last_checked ASC LIMIT 20`
  ).all<Record<string, unknown>>()

  let deadCount = 0

  for (const link of links) {
    const sourceUrl = String(link.source_url || '')
    if (!sourceUrl) continue

    let isAlive = true
    try {
      const res = await fetch(sourceUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'aifindr-link-checker/1.0' },
      })
      isAlive = res.ok || res.status === 403 || res.status === 401 // 403/401 = page exists but requires auth
    } catch {
      isAlive = false
    }

    // Update link status
    await env.DB.prepare(
      'UPDATE published_links SET is_active = ?, last_checked = ? WHERE id = ?'
    ).bind(isAlive ? 1 : 0, now, link.id).run()

    if (!isAlive) {
      deadCount++
      // E-01: Backlink failure alert
      const userId = link.user_id as number | null
      if (userId) {
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRecord>()
        const userEmail = getNotifyEmail(user)
        if (userEmail) {
          const targetUrl = String(link.target_url || '')
          const platform = String(link.platform || '')
          void sendEmail(env, {
            to: userEmail,
            sceneId: 'E-01',
            subject: `[aifindr] Backlink alert: link on ${platform} may be broken`,
            html: [
              `<p>We detected that your backlink on <strong>${platform}</strong> may have gone offline:</p>`,
              `<ul>`,
              `<li><strong>Source:</strong> <a href="${sourceUrl}">${sourceUrl}</a></li>`,
              `<li><strong>Target:</strong> ${targetUrl}</li>`,
              `</ul>`,
              `<p>The link has been marked as inactive in your dashboard. If this is a mistake, it will be re-checked in the next scan.</p>`,
              `<p><a href="https://aifindr.org/settings">View your backlinks →</a></p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    }
  }

  console.log(`Cron 2: Checked ${links.length} links, ${deadCount} dead`)
  return { total: links.length, dead: deadCount }
}

/** Cron 3: Monthly backlink report (E-02) */
async function handleCronMonthlyReport(env: Env): Promise<{ recipients: number }> {
  // Aggregate stats for all users with published links this month
  const { results: stats } = await env.DB.prepare(
    `SELECT
       p.user_id,
       COUNT(*) as total_links,
       SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_links,
       SUM(CASE WHEN p.is_active = 0 THEN 1 ELSE 0 END) as dead_links,
       SUM(CASE WHEN p.created_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as new_links
     FROM published_links p
     WHERE p.user_id IS NOT NULL
     GROUP BY p.user_id`
  ).all<Record<string, unknown>>()

  let recipients = 0

  for (const row of stats) {
    const userId = Number(row.user_id)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue

    recipients++
    const total = Number(row.total_links || 0)
    const active = Number(row.active_links || 0)
    const dead = Number(row.dead_links || 0)
    const newLinks = Number(row.new_links || 0)

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'E-02',
      subject: '[aifindr] Your monthly backlink report',
      html: [
        `<p>Here's your monthly backlink report from aifindr.org:</p>`,
        `<table>`,
        `<tr><td><strong>Total backlinks:</strong></td><td>${total}</td></tr>`,
        `<tr><td><strong>Active:</strong></td><td>${active}</td></tr>`,
        `<tr><td><strong>New this month:</strong></td><td>${newLinks}</td></tr>`,
        ...(dead > 0 ? [`<tr><td><strong>Broken:</strong></td><td>${dead}</td></tr>`] : []),
        `</table>`,
        `<p><a href="https://aifindr.org/settings">View detailed report →</a></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  console.log(`Cron 3: Sent monthly reports to ${recipients} recipients`)
  return { recipients }
}

/** Cron 4: Newsletter — send to users who haven't unsubscribed (F-01) */
async function handleCronNewsletter(env: Env, subject?: string, body?: string): Promise<{ recipients: number }> {
  const newsletterSubject = subject || 'aifindr Newsletter — Latest AI Tools & Backlink Tips'
  const newsletterBody = body || [
    '<h2>Latest from aifindr.org</h2>',
    '<p>New AI tools have been added this week. Check them out on the <a href="https://aifindr.org/tools?sort=latest">Tools page</a>.</p>',
    '<p><a href="https://aifindr.org">Visit aifindr.org →</a></p>',
    '<p style="color:#666;font-size:11px;">You\'re receiving this because you have aifindr.org notifications enabled. <a href="https://aifindr.org/settings">Unsubscribe</a>.</p>',
  ].join('')

  // Get users who haven't unsubscribed and have email notifications enabled
  const { results: subscribers } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let recipients = 0
  for (const user of subscribers) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    recipients++

    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-01',
      subject: newsletterSubject,
      html: newsletterBody,
    })
  }

  console.log(`Cron 4: Sent newsletter to ${recipients} recipients`)
  return { recipients }
}

/** Cron 1: Daily operations — check stale pending tools + refresh cache */
async function handleCronDailyOps(env: Env): Promise<void> {
  // Check for pending tools older than 7 days
  const { results: staleTools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' AND submitted_at < datetime('now', '-7 days')"
  ).all<Record<string, unknown>>()

  if (staleTools.length > 0) {
    // B-07: Send admin reminder
    const adminGhIds = (env.ADMIN_GITHUB_IDS || '').split(',').map(Number).filter(Boolean)
    if (adminGhIds.length > 0) {
      const placeholders = adminGhIds.map(() => '?').join(',')
      const { results: admins } = await env.DB.prepare(
        `SELECT * FROM users WHERE github_id IN (${placeholders})`
      ).bind(...adminGhIds).all<UserRecord>()

      const toolList = (staleTools as Record<string, unknown>[])
        .map(t => `• ${t.name} (submitted ${String(t.submitted_at || '').slice(0, 10)})`)
        .join('<br>')

      for (const admin of admins) {
        const adminEmail = getNotifyEmail(admin)
        if (adminEmail) {
          void sendEmail(env, {
            to: adminEmail,
            sceneId: 'B-07',
            subject: `[aifindr] ${staleTools.length} tool(s) awaiting review for 7+ days`,
            html: [
              `<p>The following tools have been pending review for more than 7 days:</p>`,
              `<p>${toolList}</p>`,
              `<p><a href="https://aifindr.org/admin">Review in admin panel →</a></p>`,
            ].join(''),
          })
        }
      }
    }

    console.log(`Cron 1: Found ${staleTools.length} stale pending tools, sent B-07 reminders`)
  }

  // Refresh KV stats cache
  await env.CACHE.delete('stats')
  console.log('Cron 1: KV stats cache cleared')
}

// ─── User handlers ───────────────────────────────────────────────────

/** POST /api/user/email — update contact email for notifications */
async function handleUserEmail(request: Request, env: Env): Promise<Response> {
  const token = getTokenFromRequest(request)
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const contactEmail = String(body.contact_email || '').trim()
  if (!contactEmail) {
    return error('contact_email is required', 400, 'MISSING_FIELDS')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return error('Invalid email format', 400, 'INVALID_EMAIL')
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const verifyToken = crypto.randomUUID()

  await env.DB.prepare(
    'UPDATE users SET contact_email = ?, email_verified = 0, email_verify_token = ?, updated_at = ? WHERE id = ?'
  ).bind(contactEmail, verifyToken, now, payload.sub).run()

  // A-02: Send verification email
  const verifyUrl = `https://aifindr.org/api/user/email/verify/${verifyToken}`
  void sendEmail(env, {
    to: contactEmail,
    sceneId: 'A-02',
    subject: '[aifindr] Verify your email address',
    html: [
      `<p>Thanks for adding your contact email to aifindr.org.</p>`,
      `<p>Click the link below to verify your email address:</p>`,
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      `<p>This link is one-time use and won't expire.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })

  return json({ success: true, contact_email: contactEmail, email_verified: 0 })
}

/** GET /api/user/email/verify/:token — verify contact email */
async function handleEmailVerify(token: string, env: Env): Promise<Response> {
  if (!token) return error('Missing verification token', 400)

  const user = await env.DB.prepare(
    'SELECT id, email_verify_token FROM users WHERE email_verify_token = ?'
  ).bind(token).first<{ id: number } | null>()

  if (!user) {
    return new Response(
      '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;">' +
      '<div style="text-align:center"><p style="font-size:24px">❌</p><p>Invalid or already used verification link.</p></div>' +
      '</body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(
    'UPDATE users SET email_verified = 1, email_verify_token = NULL, updated_at = ? WHERE id = ?'
  ).bind(now, user.id).run()

  return new Response(
    '<html><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#080808;color:#f0f0f0;">' +
    '<div style="text-align:center"><p style="font-size:24px">✅</p><p>Email verified successfully!</p><p style="color:#666">You can close this page.</p></div>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}

// ─── Article generation handlers ────────────────────────────────────

const GENERATION_FREE_LIMIT = 3

/** Check if the user has remaining free generation quota this month */
async function checkGenerationQuota(env: Env, userId: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  const result = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM generated_articles
     WHERE user_id = ? AND created_at >= datetime('now', 'start of month')`
  ).bind(userId).first<{ count: number }>()

  const current = result?.count || 0
  return { allowed: current < GENERATION_FREE_LIMIT, current, limit: GENERATION_FREE_LIMIT }
}

/** POST /api/generate — AI article generation (Claude integration placeholder) */
async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const token = getTokenFromRequest(request)
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const userSite = String(body.user_site || body.userSite || '').trim()
  const platform = String(body.platform || '').trim()
  const title = String(body.title || '').trim()
  const topic = String(body.topic || '').trim()

  // Validate required fields
  if (!userSite || !platform || !title) {
    return error('user_site, platform, and title are required', 400, 'MISSING_FIELDS')
  }

  const validPlatforms = ['medium', 'devto', 'hashnode', 'linkedin', 'quora', 'reddit']
  if (!validPlatforms.includes(platform)) {
    return error(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400, 'INVALID_PLATFORM')
  }

  // Check quota
  const quota = await checkGenerationQuota(env, payload.sub)
  if (!quota.allowed) {
    // D-02: Free quota exceeded
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (userEmail) {
      void sendEmail(env, {
        to: userEmail,
        sceneId: 'D-02',
        subject: '[aifindr] You\'ve used all your free article generations this month',
        html: [
          `<p>You've reached the free limit of <strong>${GENERATION_FREE_LIMIT} articles</strong> this month (${quota.current}/${quota.limit}).</p>`,
          `<p>Upgrade to the paid plan for <strong>unlimited</strong> multi-platform article generation, anchor text optimization, and performance tracking.</p>`,
          `<p><a href="https://aifindr.org/generate">Upgrade now →</a></p>`,
          `<p>Your free quota resets on the 1st of next month.</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    return json({
      success: false,
      code: 'QUOTA_EXCEEDED',
      quota: { current: quota.current, limit: quota.limit },
      message: `Free limit of ${GENERATION_FREE_LIMIT} articles/month reached.`,
    }, 402)
  }

  // ── AI Generation (placeholder — replace with Claude API call) ──
  const generatedContent = `[AI-generated article for ${title} on ${platform} platform would appear here.]`
  let genStatus: 'generated' | 'failed' = 'generated'
  let errorMessage = ''

  try {
    // TODO: Call Claude API to generate article content
    // const article = await generateWithClaude(env, { userSite, platform, title, topic })
    // For now, use placeholder content
  } catch (e) {
    genStatus = 'failed'
    errorMessage = e instanceof Error ? e.message : 'Unknown error'
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  if (genStatus === 'failed') {
    // D-03: Generation failed
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (userEmail) {
      void sendEmail(env, {
        to: userEmail,
        sceneId: 'D-03',
        subject: `[aifindr] Article generation failed: "${title}"`,
        html: [
          `<p>Sorry, we couldn't generate your article <strong>"${title}"</strong> for ${platform}.</p>`,
          `<p><strong>Reason:</strong> ${errorMessage || 'An unexpected error occurred.'}</p>`,
          `<p>This won't count toward your monthly quota. Please <a href="https://aifindr.org/generate">try again</a> or try a different platform.</p>`,
          `<p><a href="https://aifindr.org/generate">Retry →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    return error('Article generation failed: ' + (errorMessage || 'unknown error'), 500, 'GENERATION_FAILED')
  }

  // Insert into generated_articles
  await env.DB.prepare(`
    INSERT INTO generated_articles (user_id, user_site, platform, title, content, topic, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'generated', ?)
  `).bind(payload.sub, userSite, platform, title, generatedContent, topic || null, now).run()

  // Re-check quota for the response
  const newQuota = await checkGenerationQuota(env, payload.sub)

  // D-01: Generation complete
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
  const userEmail = getNotifyEmail(user)
  if (userEmail) {
    void sendEmail(env, {
      to: userEmail,
      sceneId: 'D-01',
      subject: `[aifindr] Your article "${title}" is ready!`,
      html: [
        `<p>Your AI-generated article <strong>"${title}"</strong> for <strong>${platform}</strong> is ready.</p>`,
        `<p>It's been tailored for your site <a href="${userSite}">${userSite}</a> using data from the aifindr.org tool database.</p>`,
        `<p><a href="https://aifindr.org/generate">View and publish →</a></p>`,
        `<p>You've used <strong>${newQuota.current}/${newQuota.limit}</strong> free generations this month.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  return json({
    success: true,
    article: {
      title,
      platform,
      content_preview: generatedContent.slice(0, 200) + '...',
      status: 'generated',
      quota: { current: newQuota.current, limit: newQuota.limit },
    },
  }, 201)
}
