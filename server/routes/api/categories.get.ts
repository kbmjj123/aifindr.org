// server/api/categories.get.ts
// GET /api/categories

import type { Category, CategoryRow, Subcategory } from '~/types/category'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
	
	const cached = await env.CACHE.get('categories', 'json')
	if (cached) return cached

  const { results } = await env.DB
    .prepare(`
      SELECT id, slug, icon, title, description, hero, sort_order, subcategories
      FROM categories
      ORDER BY sort_order ASC
    `)
    .all<CategoryRow>()

  const data: Category[] = (results ?? []).map((row) => ({
    ...row,
    subcategories: JSON.parse(row.subcategories) as Subcategory[],
  }))

  return { success: true, data }
})