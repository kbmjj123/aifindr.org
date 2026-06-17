import { createError, getRouterParam, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { CATEGORIES } from '~/types/category'

const VALID_TAG_TYPES = ['use_case', 'audience', 'feature'] as const

interface UpdatePayload {
  name?:              string
  website?:           string
  category?:          string
  sub_category?:      string | null
  pricing?:           string
  price_starting?:    number | null
  price_detail?:      string | null
  price_tiers?:       string | null
  has_free_trial?:    number | null
  platforms?:         string | null
  launched?:          string | null
  meta_description?:  string | null
  short_description?: string | null
  body?:              string | null
  faq?:               string | null
  logo?:              string | null
  screenshots?:       string | null
  featured?:          number | null
  verified?:          number | null
  editor_pick?:       number | null
  status?:            string
  submitter_site?:    string | null
  submitter_github?:  string | null
  tags?:              { type: string; tag: string }[]
}

const VALID_CATEGORIES = CATEGORIES.map(c => c.id)
const VALID_SUB_CATEGORIES: Record<string, string[]> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.subcategories.map(s => s.id)])
)

const EDITABLE_FIELDS = [
  'name', 'website', 'category', 'sub_category',
  'pricing', 'price_starting', 'price_detail', 'price_tiers', 'has_free_trial',
  'platforms', 'launched', 'meta_description', 'short_description',
  'body', 'faq', 'logo', 'screenshots',
  'featured', 'verified', 'editor_pick', 'status',
  'submitter_site', 'submitter_github',
] as const

type FieldName = typeof EDITABLE_FIELDS[number]

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id || isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid tool ID' })

  // ── verify tool exists ─────────────────────────────────────
  const existing = await env.DB.prepare('SELECT id, slug, category FROM tools WHERE id = ?').bind(id).first<{ id: number; slug: string; category: string }>()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Tool not found' })

  const body = await readBody<UpdatePayload>(event)

  // ── build dynamic UPDATE ───────────────────────────────────
  const updates: string[] = ['updated_at = ?']
  const params: unknown[] = []
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  params.push(now)

  for (const field of EDITABLE_FIELDS) {
    if (body[field as keyof UpdatePayload] === undefined) continue
    const val = body[field as keyof UpdatePayload]

    // validation
    if (field === 'category' && val !== undefined) {
      if (!VALID_CATEGORIES.includes(val as string)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid category: ${val}` })
      }
    }
    if (field === 'sub_category' && val !== undefined && val !== null) {
      const cat = (body.category || existing.category) as string
      if (!VALID_SUB_CATEGORIES[cat]?.includes(val as string)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid sub_category "${val}" for category "${cat}"` })
      }
    }
    if (field === 'pricing' && val !== undefined) {
      if (!['free', 'freemium', 'paid'].includes(val as string)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid pricing value' })
      }
    }
    if (field === 'status' && val !== undefined) {
      if (!['active', 'beta', 'discontinued', 'pending'].includes(val as string)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid status value' })
      }
    }

    updates.push(`${field} = ?`)
    params.push(val === undefined ? null : val)
  }

  // ── must have at least updated_at ─────────────────────────
  if (updates.length === 1) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  params.push(id)
  await env.DB.prepare(
    `UPDATE tools SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params).run()

  // ── replace tool_tags ─────────────────────────────────────
  if (Array.isArray(body.tags)) {
    const validTags = body.tags.filter(t =>
      t?.type && t?.tag && VALID_TAG_TYPES.includes(t.type as typeof VALID_TAG_TYPES[number])
    )
    await env.DB.prepare('DELETE FROM tool_tags WHERE tool_id = ?').bind(id).run()
    if (validTags.length > 0) {
      for (const t of validTags) {
        await env.DB.prepare(
          'INSERT INTO tool_tags (tool_id, tag, type) VALUES (?, ?, ?)'
        ).bind(id, t.tag, t.type).run()
      }
    }
  }

  // ── clear KV cache ────────────────────────────────────────
  await env.CACHE.delete('stats').catch(() => {})
  await env.CACHE.delete('sitemap-xml').catch(() => {})

  return { success: true, id }
})
