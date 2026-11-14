import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { invalidateSubmissionCaches, refreshList } from '~/server/utils/submissionLists'
import type { SubmissionList } from '~/types/submissionSite'

/** 重算全部或单个榜单。默认沿用各榜单的 snapshot_id，这样 diff 才有意义 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event).catch(() => ({}))
  const slug = typeof body.slug === 'string' && /^[a-z0-9-]{1,80}$/.test(body.slug) ? body.slug : ''
  const overrideSnapshot = typeof body.snapshotId === 'string' && /^[a-z0-9-]{1,40}$/.test(body.snapshotId)
    ? body.snapshotId
    : ''

  const { results } = slug
    ? await env.DB.prepare('SELECT * FROM submission_lists WHERE slug = ?').bind(slug).all<SubmissionList>()
    : await env.DB.prepare("SELECT * FROM submission_lists WHERE status != 'archived'").all<SubmissionList>()
  const lists = results || []
  if (lists.length === 0) throw createError({ statusCode: 404, statusMessage: 'No lists to refresh' })

  const refreshed = []
  for (const list of lists) {
    const snapshotId = overrideSnapshot || list.snapshot_id || 'manual'
    refreshed.push(await refreshList(env, list, snapshotId))
  }

  await invalidateSubmissionCaches(env, slug || undefined)
  return { ok: true, refreshed }
})
