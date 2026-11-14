import { createError, getRouterParam } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { loadSiteCategories } from '~/server/utils/submissionSiteWrite'
import type { SubmissionSite } from '~/types/submissionSite'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }
  const site = await env.DB.prepare('SELECT * FROM submission_sites WHERE slug = ?').bind(slug).first<SubmissionSite>()
  if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  return { site, categories: await loadSiteCategories(env, slug) }
})
