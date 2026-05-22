import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

const GENERATION_FREE_LIMIT = 3

async function checkGenerationQuota(env: ReturnType<typeof getEnv>, userId: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  const result = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM generated_articles
     WHERE user_id = ? AND created_at >= datetime('now', 'start of month')`
  ).bind(userId).first<{ count: number }>()

  const current = result?.count || 0
  return { allowed: current < GENERATION_FREE_LIMIT, current, limit: GENERATION_FREE_LIMIT }
}

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const token = getTokenFromEvent(event)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })

  const body = await readBody<Record<string, unknown>>(event)

  const userSite = String(body.user_site || body.userSite || '').trim()
  const platform = String(body.platform || '').trim()
  const title = String(body.title || '').trim()
  const topic = String(body.topic || '').trim()

  if (!userSite || !platform || !title) {
    throw createError({ statusCode: 400, statusMessage: 'user_site, platform, and title are required' })
  }

  const validPlatforms = ['medium', 'devto', 'hashnode', 'linkedin', 'quora', 'reddit']
  if (!validPlatforms.includes(platform)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` })
  }

  // Check quota
  const quota = await checkGenerationQuota(env, payload.sub)
  if (!quota.allowed) {
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
          `<p><a href="${siteUrl(env, '/generate')}">Upgrade now →</a></p>`,
          `<p>Your free quota resets on the 1st of next month.</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    setResponseStatus(event, 402)
    return {
      success: false,
      code: 'QUOTA_EXCEEDED',
      quota: { current: quota.current, limit: quota.limit },
      message: `Free limit of ${GENERATION_FREE_LIMIT} articles/month reached.`,
    }
  }

  // AI Generation placeholder
  const generatedContent = `[AI-generated article for ${title} on ${platform} platform would appear here.]`
  let genStatus: 'generated' | 'failed' = 'generated'
  let errorMessage = ''

  try {
    // TODO: Call Claude API to generate article content
  } catch (e) {
    genStatus = 'failed'
    errorMessage = e instanceof Error ? e.message : 'Unknown error'
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  if (genStatus === 'failed') {
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
          `<p>This won't count toward your monthly quota. Please <a href="${siteUrl(env, '/generate')}">try again</a> or try a different platform.</p>`,
          `<p><a href="${siteUrl(env, '/generate')}">Retry →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }

    throw createError({ statusCode: 500, statusMessage: 'Article generation failed: ' + (errorMessage || 'unknown error') })
  }

  await env.DB.prepare(`
    INSERT INTO generated_articles (user_id, user_site, platform, title, content, topic, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'generated', ?)
  `).bind(payload.sub, userSite, platform, title, generatedContent, topic || null, now).run()

  const newQuota = await checkGenerationQuota(env, payload.sub)

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
        `<p><a href="${siteUrl(env, '/generate')}">View and publish →</a></p>`,
        `<p>You've used <strong>${newQuota.current}/${newQuota.limit}</strong> free generations this month.</p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }

  setResponseStatus(event, 201)
  return {
    success: true,
    article: {
      title,
      platform,
      content_preview: generatedContent.slice(0, 200) + '...',
      status: 'generated',
      quota: { current: newQuota.current, limit: newQuota.limit },
    },
  }
})
