import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const cached = await env.CACHE.get('contributors', 'json')
  if (cached) return cached

  const { results } = await env.DB.prepare(`
    SELECT
      t.submitter_github AS username,
      t.submitter_site AS website,
      COUNT(*) AS toolCount,
      COALESCE(u.created_at, MIN(t.submitted_at)) AS joined
    FROM tools t
    LEFT JOIN users u ON u.username = t.submitter_github
    WHERE t.status = 'active'
      AND t.submitter_github IS NOT NULL
      AND t.submitter_github != ''
    GROUP BY t.submitter_github
    ORDER BY toolCount DESC, joined ASC
  `).all()

  await env.CACHE.put('contributors', JSON.stringify(results), { expirationTtl: 3600 })

  return results
})
