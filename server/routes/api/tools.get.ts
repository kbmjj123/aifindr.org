import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const query = getQuery(event)

  const category = query.category as string | undefined
  const pricing = query.pricing as string | undefined
  const platform = query.platform as string | undefined
  const tags = query.tags as string | undefined
  const sort = (query.sort as string) || 'latest'
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt((query.pageSize as string) || '24')))

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

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM tools t WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0

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

  const offset = (page - 1) * pageSize
  const { results: tools } = await env.DB.prepare(
    `SELECT t.* FROM tools t WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return { tools, total, page, pageSize }
})
