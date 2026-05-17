import type { Env, UserRecord } from '../types'
import { json, error } from '../lib/response'
import { getNotifyEmail, sendEmail } from '../lib/email'

/** POST /api/webhooks/github — handle GitHub webhook events */
export async function handleGithubWebhook(request: Request, env: Env): Promise<Response> {
  // Verify signature
  const sigHeader = request.headers.get('X-Hub-Signature-256')
  if (!sigHeader) return error('Missing signature', 401)

  const body = await request.text()

  // HMAC-SHA256 verification
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.GITHUB_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (sigHeader !== expectedSig) {
    return error('Invalid signature', 403)
  }

  // Parse event
  const eventType = request.headers.get('X-GitHub-Event') || ''

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  if (eventType === 'pull_request') {
    const action = payload.action as string
    const pr = payload.pull_request as Record<string, unknown> | null
    const merged = pr?.merged as boolean | null

    if (action === 'closed' && merged) {
      return handlePRMerged(payload, env)
    }
  }

  // Acknowledge other events silently
  return json({ received: true })
}

/** Handle a merged PR: detect tool files and send B-05 notifications */
export async function handlePRMerged(payload: Record<string, unknown>, env: Env): Promise<Response> {
  const pr = payload.pull_request as Record<string, unknown>
  const title = String(pr?.title || '')
  const prUrl = String(pr?.html_url || '')

  // Get list of changed files
  const files = (payload.files || payload.files_url) ? [] : []
  // Files array may be in payload for simple webhooks
  const changedFiles = (payload as { files?: Array<{ filename: string; status: string }> }).files || []

  // Detect tool markdown files
  const toolFiles = changedFiles.filter(
    f => f.filename.startsWith('content/tools/') && f.filename.endsWith('.md') && (f.status === 'added' || f.status === 'modified')
  )

  for (const file of toolFiles) {
    // Extract category/slug from path: content/tools/{category}/{slug}.md
    const pathParts = file.filename.replace('content/tools/', '').replace('.md', '').split('/')
    if (pathParts.length < 2) continue
    const category = pathParts[0]
    const slug = pathParts[1]

    // Look up tool in D1
    const tool = await env.DB.prepare(
      'SELECT * FROM tools WHERE slug = ? AND category = ?'
    ).bind(slug, category).first<Record<string, unknown>>()

    if (!tool) continue

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
      const detailUrl = `https://aifindr.org/tools/${category}/${slug}`
      void sendEmail(env, {
        to: submitterEmail,
        sceneId: 'B-05',
        subject: `[aifindr] Your tool "${tool.name}" is now live via GitHub PR!`,
        html: [
          `<p>Your pull request <a href="${prUrl}">${title}</a> has been merged!</p>`,
          `<p>Your tool <strong>${tool.name}</strong> is now published on aifindr.org.</p>`,
          `<p>Your dofollow backlinks are now active — check them out:</p>`,
          `<ul>`,
          `<li><a href="${detailUrl}">${detailUrl}</a> — Tool detail page</li>`,
          `<li><a href="https://github.com/aifindr-org/aifindr.org/blob/main/content/tools/${category}/${slug}.md">GitHub</a> — github.com (DA 100)</li>`,
          `</ul>`,
          `<p><a href="${detailUrl}">View your listing →</a></p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  return json({ success: true, tools: toolFiles.length })
}
