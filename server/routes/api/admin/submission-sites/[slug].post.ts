import { createError, getRouterParam, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import {
  loadSiteCategories, normalizeSiteInput, persistSite, refreshRuleLists, siteRowToInput,
} from '~/server/utils/submissionSiteWrite'
import type { SubmissionSite } from '~/types/submissionSite'

/**
 * 编辑 / 补齐已有站点（含快照里的 needs_info 与缺字段条目）。
 * 未提交的字段保持原值；保存后自动重算规则型榜单，补齐即自动进榜。
 * 用 POST 而非 PUT：项目 useApi 只暴露 get/post，与其余 admin 更新端点保持一致。
 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }
  const existing = await env.DB.prepare('SELECT * FROM submission_sites WHERE slug = ?').bind(slug).first<SubmissionSite>()
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  const body = await readBody<Record<string, unknown>>(event)
  const categories = await loadSiteCategories(env, slug)
  const row = normalizeSiteInput(body, siteRowToInput(existing, categories))
  row.slug = slug // slug 是主键，不允许修改

  const before = existing.status
  const result = await persistSite(env, row, false)
  const refreshed = await refreshRuleLists(env)
  const joined = refreshed.reduce((sum, item) => sum + item.joined, 0)
  const left = refreshed.reduce((sum, item) => sum + item.left, 0)

  return {
    ok: true,
    slug,
    ...result,
    previousStatus: before,
    joinedLists: joined,
    leftLists: left,
    message: result.complete
      ? `Saved. ${before} → ${result.status}; recalculated ${refreshed.length} lists (${joined} joined, ${left} left).`
      : `Saved as ${result.status}. Fill in the remaining required fields to publish it.`,
  }
})
