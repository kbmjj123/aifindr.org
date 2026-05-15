interface Env {
  DB: D1Database
  CACHE: KVNamespace
  TURNSTILE_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
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

// ─── Main handler ─────────────────────────────────────────────────────

export default {
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

  const user = await env.DB.prepare('SELECT id, username, email, avatar_url FROM users WHERE id = ?').bind(payload.sub).first()
  if (!user) return error('User not found', 404)

  return json(user)
}

