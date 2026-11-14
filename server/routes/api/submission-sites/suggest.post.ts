import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyTurnstile } from '~/server/utils/utils'
import type { SubmissionSiteReport } from '~/types/submissionSite'

const KINDS = ['correction', 'new_site', 'takedown'] as const

/** 用户补充站点 / 勘误 / 下架申请：先进待审表，不直接写入公开数据集 */
export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const body = await readBody<Record<string, unknown>>(event)

  const kind = String(body.kind || '') as SubmissionSiteReport['kind']
  if (!KINDS.includes(kind)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report kind' })
  }

  const token = String(body.turnstileToken || '')
  if (env.TURNSTILE_SECRET) {
    if (!token || !await verifyTurnstile(token, env.TURNSTILE_SECRET)) {
      throw createError({ statusCode: 400, statusMessage: 'CAPTCHA verification failed' })
    }
  }

  const siteSlug = String(body.site_slug || '').trim().slice(0, 120) || null
  const contact = String(body.contact || '').trim().slice(0, 200) || null
  const payload = body.payload && typeof body.payload === 'object'
    ? JSON.stringify(body.payload)
    : null

  if (kind === 'correction' && !siteSlug) {
    throw createError({ statusCode: 400, statusMessage: 'site_slug is required for corrections' })
  }
  if (kind === 'takedown' && !siteSlug) {
    throw createError({ statusCode: 400, statusMessage: 'site_slug is required for takedown requests' })
  }
  if (kind === 'new_site' && !payload) {
    throw createError({ statusCode: 400, statusMessage: 'payload is required for new sites' })
  }

  await env.DB.prepare(
    'INSERT INTO submission_site_reports (site_slug, kind, payload, contact, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(siteSlug, kind, payload, contact, 'pending').run()

  return { ok: true, message: 'Thanks — your report is queued for review.' }
})
