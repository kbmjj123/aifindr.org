import type { Env, UserRecord } from '../types'
import { json, error } from '../lib/response'
import { verifyJWT, getTokenFromRequest } from '../lib/jwt'
import { getNotifyEmail, sendEmail } from '../lib/email'

const GENERATION_FREE_LIMIT = 3

/** Check if the user has remaining free generation quota this month */
export async function checkGenerationQuota(env: Env, userId: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  const result = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM generated_articles
     WHERE user_id = ? AND created_at >= datetime('now', 'start of month')`
  ).bind(userId).first<{ count: number }>()

  const current = result?.count || 0
  return { allowed: current < GENERATION_FREE_LIMIT, current, limit: GENERATION_FREE_LIMIT }
}

/** POST /api/generate — AI article generation (Claude integration placeholder) */
export async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const token = getTokenFromRequest(request)
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const userSite = String(body.user_site || body.userSite || '').trim()
  const platform = String(body.platform || '').trim()
  const title = String(body.title || '').trim()
  const topic = String(body.topic || '').trim()

  // Validate required fields
  if (!userSite || !platform || !title) {
    return error('user_site, platform, and title are required', 400, 'MISSING_FIELDS')
  }

  const validPlatforms = ['medium', 'devto', 'hashnode', 'linkedin', 'quora', 'reddit']
  if (!validPlatforms.includes(platform)) {
    return error(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400, 'INVALID_PLATFORM')
  }

  // Check quota
  const quota = await checkGenerationQuota(env, payload.sub)
  if (!quota.allowed) {
    // D-02: Free quota exceeded
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (userEmail) {
      void sendEmail(env, {
        to: userEmail,
        sceneId: 'D-02',
        subject: '[aifindr] You\'ve used all your free article generations this month',
        html: [
          `<p>You've reached the free limit of <strong>${GENERATION_FREE_LIMIT} articles</strong> this month (${quota.current}/${quota.limit}).</p>`,
          `<p>Upgrade to the paid plan for <strong>unlimited</strong> multi-platform article generation, anchor text optimization, and performance tracking.</p>`,
          `<p><a href="https://aifindr.org/generate">Upgrade now →</a></p>`,
          `<p>Your free quota resets on the 1st of next month.</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    return json({
      success: false,
      code: 'QUOTA_EXCEEDED',
      quota: { current: quota.current, limit: quota.limit },
      message: `Free limit of ${GENERATION_FREE_LIMIT} articles/month reached.`,
    }, 402)
  }

  // ── AI Generation (placeholder — replace with Claude API call) ──
  const generatedContent = `[AI-generated article for ${title} on ${platform} platform would appear here.]`
  let genStatus: 'generated' | 'failed' = 'generated'
  let errorMessage = ''

  try {
    // TODO: Call Claude API to generate article content
    // const article = await generateWithClaude(env, { userSite, platform, title, topic })
    // For now, use placeholder content
  } catch (e) {
    genStatus = 'failed'
    errorMessage = e instanceof Error ? e.message : 'Unknown error'
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  if (genStatus === 'failed') {
    // D-03: Generation failed
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
    const userEmail = getNotifyEmail(user)
    if (userEmail) {
      void sendEmail(env, {
        to: userEmail,
        sceneId: 'D-03',
        subject: `[aifindr] Article generation failed: "${title}"`,
        html: [
          `<p>Sorry, we couldn't generate your article <strong>"${title}"</strong> for ${platform}.</p>`,
          `<p><strong>Reason:</strong> ${errorMessage || 'An unexpected error occurred.'}</p>`,
          `<p>This won't count toward your monthly quota. Please <a href="https://aifindr.org/generate">try again</a> or try a different platform.</p>`,
          `<p><a href="https://aifindr.org/generate">Retry →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    return error('Article generation failed: ' + (errorMessage || 'unknown error'), 500, 'GENERATION_FAILED')
  }

  // Insert into generated_articles
  await env.DB.prepare(`
    INSERT INTO generated_articles (user_id, user_site, platform, title, content, topic, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'generated', ?)
  `).bind(payload.sub, userSite, platform, title, generatedContent, topic || null, now).run()

  // Re-check quota for the response
  const newQuota = await checkGenerationQuota(env, payload.sub)

  // D-01: Generation complete
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRecord>()
  const userEmail = getNotifyEmail(user)
  if (userEmail) {
    void sendEmail(env, {
      to: userEmail,
      sceneId: 'D-01',
      subject: `[aifindr] Your article "${title}" is ready!`,
      html: [
        `<p>Your AI-generated article <strong>"${title}"</strong> for <strong>${platform}</strong> is ready.</p>`,
        `<p>It's been tailored for your site <a href="${userSite}">${userSite}</a> using data from the aifindr.org tool database.</p>`,
        `<p><a href="https://aifindr.org/generate">View and publish →</a></p>`,
        `<p>You've used <strong>${newQuota.current}/${newQuota.limit}</strong> free generations this month.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  return json({
    success: true,
    article: {
      title,
      platform,
      content_preview: generatedContent.slice(0, 200) + '...',
      status: 'generated',
      quota: { current: newQuota.current, limit: newQuota.limit },
    },
  }, 201)
}
