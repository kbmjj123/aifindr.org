import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)

  const toolId = Number(body.tool_id || body.toolId)
  const featured = body.featured !== undefined ? Boolean(body.featured) : null
  const verified = body.verified !== undefined ? Boolean(body.verified) : null

  if (!toolId || isNaN(toolId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid tool_id' })
  }
  if (featured === null && verified === null) {
    throw createError({ statusCode: 400, statusMessage: 'At least one of featured or verified must be provided' })
  }

  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) throw createError({ statusCode: 404, statusMessage: 'Tool not found' })

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const updates: string[] = []
  const params: unknown[] = []

  if (featured !== null) {
    updates.push('featured = ?')
    params.push(featured ? 1 : 0)
  }
  if (verified !== null) {
    updates.push('verified = ?')
    params.push(verified ? 1 : 0)
  }
  updates.push('updated_at = ?')
  params.push(now)
  params.push(toolId)

  await env.DB.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()

  // C-02: Featured activated notification
  if (featured === true) {
    const toolName = String(tool.name || '')
    const toolSlug = String(tool.slug || '')
    const toolCategory = String(tool.category || '')
    const submitterId = tool.submitter_id as number | null
    const submitterGithub = String(tool.submitter_github || '')

    let submitterEmail: string | null = null
    if (submitterId) {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(submitterId).first<UserRecord>()
      submitterEmail = getNotifyEmail(user)
    }
    if (!submitterEmail && submitterGithub) {
      const ghUser = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(submitterGithub).first<UserRecord>()
      submitterEmail = getNotifyEmail(ghUser)
    }

    if (submitterEmail) {
      const detailUrl = siteUrl(env, `/tools/${toolCategory}/${toolSlug}`)
      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'C-02',
        subject: `[aifindr] Your tool "${toolName}" is now Featured!`,
        html: [
          `<p>Great news! Your tool <strong>${toolName}</strong> is now Featured on the aifindr.org homepage.</p>`,
          `<p>As a Featured tool, it gets prime placement and increased visibility to our visitors.</p>`,
          `<p><a href="${detailUrl}">View your Featured listing →</a></p>`,
          `<p>Share it with your network to maximize its reach!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return { success: true, tool_id: toolId, featured, verified }
})
