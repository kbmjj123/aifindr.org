import { createError, getHeader, readRawBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { sendEmail } from '~/server/utils/email'

async function handleLSPurchaseEmail(env: ReturnType<typeof getEnv>, opts: {
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
      `<p>Questions? Reply to this email or <a href="${siteUrl(env)}">visit aifindr.org</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}

async function handleLSPaymentFailure(env: ReturnType<typeof getEnv>, opts: {
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
        : `<p>Please check your payment method or try again. If the issue persists, <a href="${siteUrl(env)}">contact support</a>.</p>`,
      `<p>— aifindr.org</p>`,
    ].join(''),
  })
}

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  const sigHeader = getHeader(event, 'X-Signature')
  if (!sigHeader) throw createError({ statusCode: 401, statusMessage: 'Missing signature' })

  const body = await readRawBody(event)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Empty body' })

  // HMAC-SHA256 verification (LS uses hex-encoded HMAC)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.LEMONSQUEEZY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (sigHeader !== expectedSig) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }

  const meta = payload.meta as Record<string, unknown> | undefined
  const eventName = String(meta?.event_name || '')
  const data = payload.data as Record<string, unknown> | undefined
  const orderId = String(data?.id || '')
  const attrs = data?.attributes as Record<string, unknown> | undefined

  if (!eventName || !orderId) {
    return { received: true, skipped: 'missing event info' }
  }

  // Idempotency check
  const dedupTag = `ls:${orderId}:${eventName}`
  const existingLog = await env.DB.prepare(
    "SELECT id FROM email_logs WHERE resend_id = ? LIMIT 1"
  ).bind(dedupTag).first()

  if (existingLog) {
    return { received: true, skipped: 'duplicate' }
  }

  await env.DB.prepare(
    "INSERT INTO email_logs (scene_id, recipient, subject, status, resend_id) VALUES (?, ?, ?, 'sent', ?)"
  ).bind(`LS::${eventName}`, orderId, `Lemon Squeezy ${eventName}`, dedupTag).run()

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
    return { received: true, skipped: 'no buyer email' }
  }

  switch (eventName) {
    case 'order_created':
      await handleLSPurchaseEmail(env, { buyerEmail, buyerName, productName, variantName, priceDisplay, orderId })
      break
    case 'order_refunded':
    case 'subscription_payment_failed':
      await handleLSPaymentFailure(env, { buyerEmail, buyerName, productName, priceDisplay, orderId, eventName })
      break
    default:
      return { received: true, skipped: `unhandled event: ${eventName}` }
  }

  return { success: true, event: eventName }
})
