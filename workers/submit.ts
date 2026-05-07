/**
 * Submit Worker — Handles tool form submissions
 * POST /api/submit — creates a pending tool record
 * Includes Turnstile CAPTCHA verification
 */

interface Env {
  DB: D1Database
  TURNSTILE_SECRET: string
}

interface SubmitBody {
  name: string
  website: string
  category: string
  pricing: string
  price_detail?: string
  description: string
  detailDescription: string
  platforms: string[]
  submitter_site?: string
  submitter_github?: string
  turnstileToken: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST' || url.pathname !== '/api/submit') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    try {
      const body: SubmitBody = await request.json()

      // Validate required fields
      if (!body.name || !body.website || !body.category || !body.pricing || !body.description) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Verify Turnstile
      const turnstileResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET,
            response: body.turnstileToken,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )
      const turnstileResult = await turnstileResponse.json() as { success: boolean }

      if (!turnstileResult.success) {
        return new Response(JSON.stringify({ error: 'CAPTCHA verification failed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Generate slug from name
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Insert as pending
      await env.DB.prepare(`
        INSERT INTO tools (slug, name, category, website, pricing, meta_description, platforms, status, submitter_site, submitter_github, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'))
      `).bind(
        slug,
        body.name,
        body.category,
        body.website,
        body.pricing,
        body.description,
        (body.platforms || []).join(','),
        body.submitter_site || null,
        body.submitter_github || null
      ).run()

      return new Response(JSON.stringify({ success: true, slug }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  },
}
