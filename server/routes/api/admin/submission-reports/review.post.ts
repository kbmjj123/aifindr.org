import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { invalidateSubmissionCaches } from '~/server/utils/submissionLists'
import { refreshRuleLists } from '~/server/utils/submissionSiteWrite'

/** 审核报告；takedown 被接受时真正隐藏条目并重算榜单，避免「下架入口」只改标记 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)
  const id = Math.floor(Number(body.id) || 0)
  const decision = String(body.decision || '')
  if (!id || !['accepted', 'rejected'].includes(decision)) {
    throw createError({ statusCode: 400, statusMessage: 'id and a valid decision are required' })
  }

  const report = await env.DB.prepare(
    "SELECT id, kind, site_slug FROM submission_site_reports WHERE id = ? AND status = 'pending'"
  ).bind(id).first<{ id: number; kind: string; site_slug: string | null }>()
  if (!report) throw createError({ statusCode: 404, statusMessage: 'Report not found or already reviewed' })

  await env.DB.prepare('UPDATE submission_site_reports SET status = ? WHERE id = ?').bind(decision, id).run()

  let hidden = false
  if (decision === 'accepted' && report.kind === 'takedown' && report.site_slug) {
    await env.DB.prepare(
      "UPDATE submission_sites SET status = 'hidden', indexed = 0, updated_at = ? WHERE slug = ?"
    ).bind(new Date().toISOString().replace('T', ' ').slice(0, 19), report.site_slug).run()
    hidden = true
    await refreshRuleLists(env)
  } else if (decision === 'accepted') {
    await invalidateSubmissionCaches(env)
  }

  return {
    ok: true,
    id,
    decision,
    hidden,
    message: hidden
      ? `Accepted. ${report.site_slug} is hidden and all rule-based lists were recalculated.`
      : decision === 'accepted' && report.kind === 'new_site'
        ? 'Accepted. Add the structured record in the admin form, then lists update automatically.'
        : 'Report closed.',
  }
})
