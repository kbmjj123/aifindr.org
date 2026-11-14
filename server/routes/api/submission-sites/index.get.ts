import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'
import {
  compileFilters, compileSearch, compileSort, parseSiteQuery,
} from '~/server/utils/submissionFilters'
import type { SubmissionFacets, SubmissionSite, SubmissionSiteListResponse } from '~/types/submissionSite'

const FACET_CACHE_KEY = 'submission-sites:facets'

export default defineEventHandler(async (event): Promise<SubmissionSiteListResponse> => {
  const env = getEnv(event)
  const parsed = parseSiteQuery(getQuery(event) as Record<string, unknown>)
  const filters = compileFilters(parsed.expression)
  const search = compileSearch(parsed.search)
  const where = `s.status = 'active'${filters.where}${search.where}`
  const params = [...filters.params, ...search.params]
  const orderBy = compileSort(parsed.sort)
  const offset = (parsed.page - 1) * parsed.pageSize

  // 无关键词时缓存结果；带搜索词的组合太多，直接查库
  const cacheKey = parsed.search
    ? ''
    : `submission-sites:${parsed.page}:${parsed.pageSize}:${orderBy}:${filters.where}:${filters.params.join('|')}`
  if (cacheKey) {
    const cached = await env.CACHE.get(cacheKey, 'json')
    if (cached) return cached as SubmissionSiteListResponse
  }

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM submission_sites s WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countRow?.total ?? 0

  const { results } = await env.DB.prepare(
    `SELECT s.* FROM submission_sites s WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, parsed.pageSize, offset).all<SubmissionSite>()

  const facets = await loadFacets(env)

  const response: SubmissionSiteListResponse = {
    sites: results || [],
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    facets,
  }

  if (cacheKey) {
    await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 })
  }
  return response
})

async function loadFacets(env: ReturnType<typeof getEnv>): Promise<SubmissionFacets> {
  const cached = await env.CACHE.get(FACET_CACHE_KEY, 'json')
  if (cached) return cached as SubmissionFacets

  const row = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN submit_url IS NOT NULL AND submit_url != '' THEN 1 ELSE 0 END) AS with_submit_url,
      SUM(CASE WHEN pricing = 'free' THEN 1 ELSE 0 END) AS p_free,
      SUM(CASE WHEN pricing = 'freemium' THEN 1 ELSE 0 END) AS p_freemium,
      SUM(CASE WHEN pricing = 'paid' THEN 1 ELSE 0 END) AS p_paid,
      SUM(CASE WHEN dofollow_link = 1 THEN 1 ELSE 0 END) AS d_yes,
      SUM(CASE WHEN dofollow_link = 0 THEN 1 ELSE 0 END) AS d_no,
      SUM(CASE WHEN backlink_required = 1 THEN 1 ELSE 0 END) AS b_yes,
      SUM(CASE WHEN backlink_required = 0 THEN 1 ELSE 0 END) AS b_no,
      SUM(CASE WHEN approval_bucket = 'fast' THEN 1 ELSE 0 END) AS a_fast,
      SUM(CASE WHEN approval_bucket = 'week' THEN 1 ELSE 0 END) AS a_week,
      SUM(CASE WHEN approval_bucket = 'month' THEN 1 ELSE 0 END) AS a_month,
      SUM(CASE WHEN approval_bucket = 'slow' THEN 1 ELSE 0 END) AS a_slow,
      SUM(CASE WHEN submit_method = 'form' THEN 1 ELSE 0 END) AS m_form,
      SUM(CASE WHEN submit_method = 'github_pr' THEN 1 ELSE 0 END) AS m_github_pr,
      SUM(CASE WHEN submit_method = 'awesome_list' THEN 1 ELSE 0 END) AS m_awesome_list,
      SUM(CASE WHEN submit_method = 'sign_in' THEN 1 ELSE 0 END) AS m_sign_in,
      SUM(CASE WHEN submit_method = 'community_post' THEN 1 ELSE 0 END) AS m_community_post,
      SUM(CASE WHEN submit_method = 'external' THEN 1 ELSE 0 END) AS m_external
    FROM submission_sites WHERE status = 'active'
  `).first<Record<string, number>>()

  const { results: categoryRows } = await env.DB.prepare(`
    SELECT sc.category_slug, COUNT(*) AS count
    FROM site_categories sc
    JOIN submission_sites s ON s.slug = sc.site_slug AND s.status = 'active'
    GROUP BY sc.category_slug
  `).all<{ category_slug: string; count: number }>()

  const n = (key: string) => Number(row?.[key] ?? 0)
  const facets: SubmissionFacets = {
    categories: Object.fromEntries((categoryRows || []).map(item => [item.category_slug, item.count])),
    total: n('total'),
    withSubmitUrl: n('with_submit_url'),
    pricing: { free: n('p_free'), freemium: n('p_freemium'), paid: n('p_paid') },
    dofollow: { yes: n('d_yes'), no: n('d_no') },
    backlinkRequired: { yes: n('b_yes'), no: n('b_no') },
    approvalBucket: { fast: n('a_fast'), week: n('a_week'), month: n('a_month'), slow: n('a_slow') },
    submitMethod: {
      form: n('m_form'), github_pr: n('m_github_pr'), awesome_list: n('m_awesome_list'),
      sign_in: n('m_sign_in'), community_post: n('m_community_post'), external: n('m_external'),
    },
  }

  await env.CACHE.put(FACET_CACHE_KEY, JSON.stringify(facets), { expirationTtl: 3600 })
  return facets
}
