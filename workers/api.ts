/**
 * API Worker — Tool list, detail, search, stats, click tracking
 * Deployed on Cloudflare Workers, routes through CF Pages
 */

interface Env {
  DB: D1Database
  CACHE: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '')
    const method = request.method

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // GET /api/tools — list with filters
      if (method === 'GET' && path === '/tools') {
        const category = url.searchParams.get('category')
        const pricing = url.searchParams.get('pricing')
        const sort = url.searchParams.get('sort') || 'latest'
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '24')

        let sql = 'SELECT * FROM tools WHERE status = \'active\''
        const params: unknown[] = []

        if (category) {
          sql += ' AND category = ?'
          params.push(category)
        }
        if (pricing) {
          const prices = pricing.split(',')
          sql += ` AND pricing IN (${prices.map(() => '?').join(',')})`
          params.push(...prices)
        }

        switch (sort) {
          case 'trending':
            sql += ' ORDER BY click_count DESC'
            break
          case 'featured':
            sql += ' ORDER BY featured DESC, submitted_at DESC'
            break
          default:
            sql += ' ORDER BY submitted_at DESC'
        }

        sql += ' LIMIT ? OFFSET ?'
        params.push(pageSize, (page - 1) * pageSize)

        const { results } = await env.DB.prepare(sql).bind(...params).all()

        return new Response(JSON.stringify({ tools: results, page, pageSize }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // GET /api/tools/:category/:slug — tool detail
      const detailMatch = path.match(/^\/tools\/([^/]+)\/([^/]+)$/)
      if (method === 'GET' && detailMatch) {
        const [, category, slug] = detailMatch
        const tool = await env.DB.prepare(
          'SELECT * FROM tools WHERE slug = ? AND category = ?'
        ).bind(slug, category).first()

        if (!tool) {
          return new Response(JSON.stringify({ error: 'Tool not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        return new Response(JSON.stringify(tool), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // GET /api/tools/search — full text search
      if (method === 'GET' && path === '/tools/search') {
        const q = url.searchParams.get('q') || ''
        const { results } = await env.DB.prepare(
          'SELECT * FROM tools WHERE status = \'active\' AND (name LIKE ? OR meta_description LIKE ?) LIMIT 20'
        ).bind(`%${q}%`, `%${q}%`).all()

        return new Response(JSON.stringify({ tools: results, query: q }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // GET /api/stats — site statistics
      if (method === 'GET' && path === '/stats') {
        // Check KV cache first
        const cached = await env.CACHE.get('stats', 'json')
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        const toolCount = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM tools WHERE status = \'active\''
        ).first<{ count: number }>()

        const categoryCount = await env.DB.prepare(
          'SELECT COUNT(DISTINCT category) as count FROM tools WHERE status = \'active\''
        ).first<{ count: number }>()

        // Set KV cache with 1h TTL
        const stats = { tools: toolCount?.count || 0, categories: categoryCount?.count || 0 }
        await env.CACHE.put('stats', JSON.stringify(stats), { expirationTtl: 3600 })

        return new Response(JSON.stringify(stats), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
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
