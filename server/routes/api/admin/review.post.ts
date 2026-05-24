import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import { notifySearchEngines } from '~/server/utils/seo'
import type { UserRecord } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const admin = await verifyAdmin(event)
  if (!admin) throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })

  const body = await readBody<Record<string, unknown>>(event)

  const toolId = Number(body.tool_id || body.toolId)
  const status = String(body.status || '')
  const rejectReason = String(body.reject_reason || body.rejectReason || '').trim()
  const reviewerNote = String(body.reviewer_note || body.reviewerNote || '').trim()

  if (!toolId || isNaN(toolId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid tool_id' })
  }

  const validStatuses = ['active', 'rejected', 'needs_info']
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
  }

  if (status === 'rejected' && !rejectReason) {
    throw createError({ statusCode: 400, statusMessage: 'reject_reason is required when status is rejected' })
  }

  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) {
    throw createError({ statusCode: 404, statusMessage: 'Tool not found' })
  }
  if (tool.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: `Tool has already been reviewed (current status: ${tool.status})` })
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(`
    UPDATE tools SET status = ?, reject_reason = ?, reviewer_note = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, rejectReason || null, reviewerNote || null, now, now, toolId).run()

  await env.CACHE.delete('stats')
  await env.CACHE.delete('sitemap-xml')

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
    if (status === 'active') {
      const detailUrl = siteUrl(env, `/tools/${toolCategory}/${toolSlug}`)
      const contributorUrl = siteUrl(env, `/contributors/${submitterGithub}`)
      const githubUrl = `https://github.com/kbmjj123/aifindr.org/blob/main/content/tools/${toolCategory}/${toolSlug}.md`

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-03',
        subject: `[aifindr] Your tool "${toolName}" has been approved!`,
        html: [
          `<p>Great news! Your tool <strong>${toolName}</strong> has been approved and is now live.</p>`,
          `<p>Here are your <strong>three dofollow backlinks</strong>:</p>`,
          `<ol>`,
          `<li><a href="${githubUrl}">GitHub</a> — github.com (DA 100)</li>`,
          `<li><a href="${detailUrl}">Tool Detail Page</a> — aifindr.org</li>`,
          `<li><a href="${contributorUrl}">Contributor Page</a> — aifindr.org/contributors/${submitterGithub}</li>`,
          `</ol>`,
          `<p><a href="${detailUrl}">View your listing →</a></p>`,
          `<p>Share it with your network — the more clicks it gets, the higher it ranks on Trending!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })

      const toolPageUrl = siteUrl(env, `/tools/${toolCategory}/${toolSlug}`)
      void notifySearchEngines(env, toolPageUrl)

      // F-02: Notify category submitters
      const { results: categorySubmitters } = await env.DB.prepare(
        'SELECT DISTINCT submitter_id FROM tools WHERE category = ? AND status = ? AND submitter_id IS NOT NULL AND submitter_id != ?'
      ).bind(toolCategory, 'active', submitterId || 0).all<{ submitter_id: number }>()

      const notified = new Set<number>()
      for (const row of categorySubmitters) {
        if (notified.has(row.submitter_id)) continue
        notified.add(row.submitter_id)

        const catUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(row.submitter_id).first<UserRecord>()
        const catEmail = getNotifyEmail(catUser)
        if (catEmail) {
          void sendEmail(env, {
            to: catEmail,
            sceneId: 'F-02',
            subject: `[aifindr] New ${toolCategory} tool: ${toolName}`,
            html: [
              `<p>A new tool has been added in <strong>${toolCategory}</strong>:</p>`,
              `<h3>${toolName}</h3>`,
              `<p><a href="${siteUrl(env, `/tools/${toolCategory}/${toolSlug}`)}">View ${toolName} →</a></p>`,
              `<p style="color:#666;font-size:11px;">You're receiving this because you submitted a tool in the ${toolCategory} category. <a href="${siteUrl(env, '/settings')}">Manage notifications</a>.</p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    } else if (status === 'rejected') {
      const reasonMap: Record<string, string> = {
        info_incomplete: 'Information is incomplete — please provide more details about the tool',
        not_qualified: 'Not qualified — the tool does not meet our listing criteria',
        duplicate: 'Duplicate — this tool is already listed in our directory',
        other: reviewerNote || 'Other reason',
      }
      const reasonText = reasonMap[rejectReason] || rejectReason || ''
      const noteLine = reviewerNote ? `<p><strong>Reviewer notes:</strong> ${reviewerNote}</p>` : ''

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-04',
        subject: `[aifindr] Update on your submission "${toolName}"`,
        html: [
          `<p>Thank you for submitting <strong>${toolName}</strong> to aifindr.org.</p>`,
          `<p>After review, we were unable to approve it at this time:</p>`,
          `<blockquote>${reasonText}</blockquote>`,
          noteLine,
          `<p>You're welcome to revise and <a href="${siteUrl(env, '/submit')}">resubmit</a> — we'd love to have your tool listed!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    } else if (status === 'needs_info') {
      const noteLine = reviewerNote ? `<p><strong>What's needed:</strong> ${reviewerNote}</p>` : ''

      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-06',
        subject: `[aifindr] Your submission "${toolName}" needs more info`,
        html: [
          `<p>Thanks for submitting <strong>${toolName}</strong> to aifindr.org!</p>`,
          `<p>We've reviewed your submission and need a bit more information before we can approve it.</p>`,
          noteLine,
          `<p>Please update your submission with the requested details. Once updated, our team will re-review it.</p>`,
          `<p><a href="${siteUrl(env, '/submit')}">Resubmit →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return {
    success: true,
    tool: { id: toolId, name: toolName, status, reviewed_at: now },
  }
})
