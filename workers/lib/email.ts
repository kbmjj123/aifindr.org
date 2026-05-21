import type { Env, UserRecord } from '../types'
import type { SendEmailParams } from '../types'

/** Pick the best email to use for notifications. Returns null if none available. */
export function getNotifyEmail(user: UserRecord | null): string | null {
  if (!user) return null
  if (user.contact_email && user.email_verified) {
    return user.contact_email
  }
  if (user.email && !user.email.includes('noreply.github.com')) {
    return user.email
  }
  return null
}

/** Send a transactional email via Resend API and log to D1. */
export async function sendEmail(env: Env, params: SendEmailParams): Promise<{ success: boolean; resendId?: string }> {
  let resendId: string | undefined
  let status: 'sent' | 'failed' = 'failed'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'aifindr <noreply@aifindr.org>',
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    const data = await res.json() as { id?: string; error?: string }
    if (res.ok && data.id) {
      resendId = data.id
      status = 'sent'
    } else {
      console.error('Resend API error:', data.error || res.statusText)
    }
  } catch (e) {
    console.error('sendEmail failed:', e)
  }

  try {
    await env.DB.prepare(
      'INSERT INTO email_logs (scene_id, recipient, subject, status, resend_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(params.sceneId, params.to, params.subject, status, resendId || null).run()
  } catch (e) {
    console.error('email_logs insert failed:', e)
  }

  return { success: status === 'sent', resendId }
}
