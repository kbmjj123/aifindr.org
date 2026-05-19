import type { Env, JWTPayload, UserRecord } from '../types'
import { json, error } from '../lib/response'
import { verifyJWT, getTokenFromRequest } from '../lib/jwt'
import { getNotifyEmail, sendEmail } from '../lib/email'
import { notifySearchEngines } from './seo'
import { verifyAdmin } from './auth'

/** GET /api/admin/pending — list tools awaiting review */
export async function handleAdminPending(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt(new URL(request.url).searchParams.get('pageSize') || '20')))
  const offset = (page - 1) * pageSize

  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM tools WHERE status = 'pending'"
  ).first<{ total: number }>()
  const total = countResult?.total || 0

  const { results: tools } = await env.DB.prepare(
    "SELECT * FROM tools WHERE status = 'pending' ORDER BY submitted_at ASC LIMIT ? OFFSET ?"
  ).bind(pageSize, offset).all()

  return json({ tools, total, page, pageSize })
}

/** POST /api/admin/review — approve or reject a submitted tool */
export async function handleAdminReview(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const toolId = Number(body.tool_id || body.toolId)
  const status = String(body.status || '')
  const rejectReason = String(body.reject_reason || body.rejectReason || '').trim()
  const reviewerNote = String(body.reviewer_note || body.reviewerNote || '').trim()

  if (!toolId || isNaN(toolId)) {
    return error('Missing or invalid tool_id', 400, 'INVALID_TOOL_ID')
  }

  const validStatuses = ['active', 'rejected', 'needs_info']
  if (!validStatuses.includes(status)) {
    return error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_STATUS')
  }

  if (status === 'rejected' && !rejectReason) {
    return error('reject_reason is required when status is rejected', 400, 'MISSING_REJECT_REASON')
  }

  // Verify tool exists and is pending
  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) {
    return error('Tool not found', 404)
  }
  if (tool.status !== 'pending') {
    return error(`Tool has already been reviewed (current status: ${tool.status})`, 400, 'ALREADY_REVIEWED')
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await env.DB.prepare(`
    UPDATE tools SET status = ?, reject_reason = ?, reviewer_note = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, rejectReason || null, reviewerNote || null, now, now, toolId).run()

  // Clear caches so homepage + sitemap reflect the updated tool count
  await env.CACHE.delete('stats')
  await env.CACHE.delete('sitemap-xml')

  // ── Send notification email (B-03 / B-04) ──
  const toolName = String(tool.name || '')
  const toolSlug = String(tool.slug || '')
  const toolCategory = String(tool.category || '')
  const submitterId = tool.submitter_id as number | null
  const submitterGithub = String(tool.submitter_github || '')

  // Find submitter's email
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
      // B-03: Approval with three backlinks
      const detailUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
      const contributorUrl = `https://aifindr.org/contributors/${submitterGithub}`
      const githubUrl = `https://github.com/aifindr-org/aifindr.org/blob/main/content/tools/${toolCategory}/${toolSlug}.md`

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

      // Ping search engines to index the new tool page
      const toolPageUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
      void notifySearchEngines(toolPageUrl)

      // F-02: Notify submitters in the same category about the new tool
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
              `<p><a href="https://aifindr.org/tools/${toolCategory}/${toolSlug}">View ${toolName} →</a></p>`,
              `<p style="color:#666;font-size:11px;">You're receiving this because you submitted a tool in the ${toolCategory} category. <a href="https://aifindr.org/settings">Manage notifications</a>.</p>`,
              `<p>— aifindr.org</p>`,
            ].join(''),
          })
        }
      }
    } else if (status === 'rejected') {
      // B-04: Rejection with reason
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
          `<p>You're welcome to revise and <a href="https://aifindr.org/submit">resubmit</a> — we'd love to have your tool listed!</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    } else if (status === 'needs_info') {
      // B-06: Additional information needed
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
          `<p><a href="https://aifindr.org/submit">Resubmit →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return json({
    success: true,
    tool: { id: toolId, name: toolName, status, reviewed_at: now },
  })
}

/** POST /api/admin/feature — set featured/verified flags on a tool */
export async function handleAdminFeature(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const toolId = Number(body.tool_id || body.toolId)
  const featured = body.featured !== undefined ? Boolean(body.featured) : null
  const verified = body.verified !== undefined ? Boolean(body.verified) : null

  if (!toolId || isNaN(toolId)) {
    return error('Missing or invalid tool_id', 400, 'INVALID_TOOL_ID')
  }
  if (featured === null && verified === null) {
    return error('At least one of featured or verified must be provided', 400, 'MISSING_FIELDS')
  }

  const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ?').bind(toolId).first<Record<string, unknown>>()
  if (!tool) return error('Tool not found', 404)

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
      const detailUrl = `https://aifindr.org/tools/${toolCategory}/${toolSlug}`
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

  return json({ success: true, tool_id: toolId, featured, verified })
}

/** POST /api/admin/broadcast — send announcement to all subscribed users (F-03) */
export async function handleAdminBroadcast(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env)
  if (!admin) return error('Forbidden: admin only', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const subject = String(body.subject || '').trim()
  const htmlBody = String(body.body || body.html || '').trim()

  if (!subject || !htmlBody) {
    return error('subject and body are required', 400, 'MISSING_FIELDS')
  }

  // Get all subscribed users (email_notify=1, not unsubscribed)
  const { results: recipients } = await env.DB.prepare(
    'SELECT * FROM users WHERE unsubscribed_at IS NULL AND email_notify = 1'
  ).all<UserRecord>()

  let sent = 0
  for (const user of recipients) {
    const userEmail = getNotifyEmail(user)
    if (!userEmail) continue
    sent++
    void sendEmail(env, {
      to: userEmail,
      sceneId: 'F-03',
      subject: `[aifindr] ${subject}`,
      html: [
        htmlBody,
        `<p style="color:#666;font-size:11px;margin-top:16px;">You're receiving this as an aifindr.org member. <a href="https://aifindr.org/settings">Manage email preferences</a>.</p>`,
      ].join(''),
    })
  }

  return json({ success: true, recipients: recipients.length, sent })
}
