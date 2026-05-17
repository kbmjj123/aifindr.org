import type { Env } from '../types'
import { json, error } from '../lib/response'
import { sendEmail } from '../lib/email'

/** POST /api/webhooks/lemonsqueezy — handle Lemon Squeezy webhook events */
export async function handleLemonSqueezyWebhook(request: Request, env: Env): Promise<Response> {
  // Verify X-Signature
  const sigHeader = request.headers.get('X-Signature')
  if (!sigHeader) return error('Missing signature', 401)

  const body = await request.text()

  // HMAC-SHA256 verification (LS uses hex-encoded HMAC)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.LEMONSQUEEZY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (sigHeader !== expectedSig) {
    return error('Invalid signature', 403)
  }

  // Parse payload
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    return error('Invalid JSON body', 400, 'INVALID_JSON')
  }

  const meta = payload.meta as Record<string, unknown> | undefined
  const eventName = String(meta?.event_name || '')
  const data = payload.data as Record<string, unknown> | undefined
  const orderId = String(data?.id || '')
  const attrs = data?.attributes as Record<string, unknown> | undefined

  if (!eventName || !orderId) {
    return json({ received: true, skipped: 'missing event info' })
  }

  // Idempotency: check if this order+event was already processed
  // LS may retry webhooks, so check for a recent entry with the same scene + recipient + order ID
  const dedupTag = `ls:${orderId}:${eventName}`
  const existingLog = await env.DB.prepare(
    "SELECT id FROM email_logs WHERE resend_id = ? LIMIT 1"
  ).bind(dedupTag).first()

  if (existingLog) {
    return json({ received: true, skipped: 'duplicate' })
  }

  // Pre-insert a dedup marker so retries within the same moment also get caught
  await env.DB.prepare(
    "INSERT INTO email_logs (scene_id, recipient, subject, status, resend_id) VALUES (?, ?, ?, 'sent', ?)"
  ).bind(`LS::${eventName}`, orderId, `Lemon Squeezy ${eventName}`, dedupTag).run()

  // Extract buyer info
  const buyerEmail = String(attrs?.user_email || '')
  const buyerName = String(attrs?.user_name || '')
  const productName = String(
    (attrs?.first_order_item as Record<string, unknown>)?.product_name || ''
  )
  const variantName = String(
    (attrs?.first_order_item as Record<string, unknown>)?.variant_name || ''
  )
  const total = Number(attrs?.total || 0)
  const currency = String(attrs?.currency || 'USD')
  const priceDisplay = `${currency} $${(total / 100).toFixed(2)}`

  if (!buyerEmail) {
    return json({ received: true, skipped: 'no buyer email' })
  }

  switch (eventName) {
    case 'order_created':
      // C-01: Featured purchase / C-03: Fast-track / C-05: Verified
      await handleLSPurchaseEmail(env, { buyerEmail, buyerName, productName, variantName, priceDisplay, orderId })
      break
    case 'order_refunded':
    case 'subscription_payment_failed':
      // C-06: Payment failure / refund
      await handleLSPaymentFailure(env, { buyerEmail, buyerName, productName, priceDisplay, orderId, eventName })
      break
    default:
      return json({ received: true, skipped: `unhandled event: ${eventName}` })
  }

  return json({ success: true, event: eventName })
}

/** Detect product type from name and send the right purchase confirmation */
export async function handleLSPurchaseEmail(env: Env, opts: {
  buyerEmail: string; buyerName: string; productName: string; variantName: string; priceDisplay: string; orderId: string
}) {
  const { buyerEmail, buyerName, productName, variantName, priceDisplay, orderId } = opts
  const productLabel = (productName || variantName).toLowerCase()

  let sceneId: string
  let purchaseTitle: string
  let purchaseBody: string

  if (productLabel.includes('featured')) {
    sceneId = 'C-01'
    purchaseTitle = 'Featured Placement'
    purchaseBody = 'Your tool will be featured on the aifindr.org homepage. Our team will activate it shortly.'
  } else if (productLabel.includes('fast') || productLabel.includes('accelerat') || productLabel.includes('review') || productLabel.includes('priority')) {
    sceneId = 'C-03'
    purchaseTitle = 'Fast-Track Review'
    purchaseBody = 'Your submission will be reviewed within 24 hours. You\'ll receive another email once the review is complete.'
  } else if (productLabel.includes('verified') || productLabel.includes('certif')) {
    sceneId = 'C-05'
    purchaseTitle = 'Verified Badge'
    purchaseBody = 'Your tool will receive the Verified badge. Our team will apply it shortly.'
  } else {
    // Generic purchase confirmation
    sceneId = 'C-01'
    purchaseTitle = productName || variantName || 'Purchase'
    purchaseBody = 'Our team will process your order shortly.'
  }

  void sendEmail(env, {
    to: buyerEmail,
    sceneId,
    subject: `[aifindr] Your ${purchaseTitle} purchase is confirmed`,
    html: [
      `<p>Hi ${buyerName || 'there'}! Your purchase is confirmed.</p>`,
      `<table>`,
      `<tr><td><strong>Product:</strong></td><td>${purchaseTitle}</td></tr>`,
      `<tr><td><strong>Amount:</strong></td><td>${priceDisplay}</td></tr>`,
      `<tr><td><strong>Order:</strong></td><td><code>${orderId}</code></td></tr>`,
      `</table>`,
      `<p>${purchaseBody}</p>`,
      `<p>Questions? Reply to this email or <a href="https://aifindr.org">visit aifindr.org</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}

/** Send payment failure / refund notification (C-06) */
export async function handleLSPaymentFailure(env: Env, opts: {
  buyerEmail: string; buyerName: string; productName: string; priceDisplay: string; orderId: string; eventName: string
}) {
  const { buyerEmail, buyerName, productName, priceDisplay, orderId, eventName } = opts
  const isRefund = eventName === 'order_refunded'
  const title = isRefund ? 'Refund processed' : 'Payment failed'

  void sendEmail(env, {
    to: buyerEmail,
    sceneId: 'C-06',
    subject: `[aifindr] ${title} — ${productName || 'Order'} ${orderId}`,
    html: [
      `<p>Hi ${buyerName || 'there'},</p>`,
      isRefund
        ? `<p>Your refund for <strong>${productName || 'your order'}</strong> (${priceDisplay}) has been processed.</p>`
        : `<p>Your payment for <strong>${productName || 'your order'}</strong> (${priceDisplay}) could not be processed.</p>`,
      `<p><strong>Order ID:</strong> <code>${orderId}</code></p>`,
      isRefund
        ? `<p>The refund should appear on your statement within 5–10 business days.</p>`
        : `<p>Please check your payment method or try again. If the issue persists, <a href="https://aifindr.org">contact support</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}
