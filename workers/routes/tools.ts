import type { Env } from '../types'
import { json, error } from '../lib/response'

export async function handleListTools(url: URL, env: Env) {
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

export async function handleToolDetail(category: string, slug: string, env: Env) {
  const tool = await env.DB.prepare(
    "SELECT * FROM tools WHERE slug = ? AND category = ? AND status = 'active'"
  ).bind(slug, category).first()

  if (!tool) {
    return error('Tool not found', 404)
  }

  // Fetch tags
  const { results: tagRows } = await env.DB.prepare(
    'SELECT tag FROM tool_tags WHERE tool_id = ?'
  ).bind((tool as Record<string, unknown>).id).all()

  const tags = (tagRows as { tag: string }[]).map(r => r.tag)

  return json({
    ...tool as Record<string, unknown>,
    tags,
  })
}

export async function handleSearch(url: URL, env: Env) {
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

export async function handleStats(env: Env) {
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

export async function handleClick(id: string, env: Env) {
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
