import { createError, getRouterParams } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { username } = getRouterParams(event)

  if (!username) {
    throw createError({ statusCode: 400, message: 'Missing username' })
  }

  const contributor = await env.DB.prepare(`
    SELECT
      t.submitter_github AS username,
      t.submitter_site AS website,
      COUNT(*) AS toolCount,
      COALESCE(u.created_at, MIN(t.submitted_at)) AS joined
    FROM tools t
    LEFT JOIN users u ON u.username = t.submitter_github
    WHERE t.status IN ('active', 'pending')
      AND t.submitter_github = ?
    GROUP BY t.submitter_github
  `).bind(username).first<{
    username: string
    website: string | null
    toolCount: number
    joined: string
  }>()

  if (!contributor) {
    throw createError({ statusCode: 404, message: 'Contributor not found' })
  }

  const { results: activeTools } = await env.DB.prepare(`
    SELECT t.* FROM tools t
    WHERE t.status = 'active'
      AND t.submitter_github = ?
    ORDER BY t.submitted_at DESC
  `).bind(username).all()

  const { results: pendingTools } = await env.DB.prepare(`
    SELECT t.* FROM tools t
    WHERE t.status = 'pending'
      AND t.submitter_github = ?
    ORDER BY t.submitted_at DESC
  `).bind(username).all()

  return {
    ...contributor,
    toolCount: activeTools.length + pendingTools.length,
    tools: activeTools,
    pendingTools,
  }
})
