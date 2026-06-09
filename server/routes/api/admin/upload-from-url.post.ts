import { createError, readBody } from 'h3'
import { getEnv } from '~/server/utils/env'
import { verifyJWT, getTokenFromEvent } from '~/server/utils/jwt'

const ALLOWED_TYPES = ['logo', 'og_image'] as const
type ImageType = typeof ALLOWED_TYPES[number]

const ADMIN_GITHUB_IDS_ENV = 'ADMIN_GITHUB_IDS'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)

  // ── 鉴权：仅 admin 可调用 ─────────────────────────────────
  const authToken = getTokenFromEvent(event)
  if (!authToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const payload = await verifyJWT(authToken, env.JWT_SECRET)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const adminGhIds = (env[ADMIN_GITHUB_IDS_ENV] || '').split(',').map(Number).filter(Boolean)
  if (!adminGhIds.includes(payload.github_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // ── 参数解析 ──────────────────────────────────────────────
  const body = await readBody<{ url: string; type: ImageType; slug: string }>(event)

  const { url, type, slug } = body

  if (!url || !type || !slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: url, type, slug' })
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(', ')}` })
  }

  if (!env.R2) {
    throw createError({ statusCode: 500, statusMessage: 'R2 binding not configured' })
  }

  // ── 从 URL 拉取图片 ───────────────────────────────────────
  let imageResponse: Response
  try {
    imageResponse = await fetch(url, {
      headers: { 'User-Agent': 'aifindr-bot/1.0' },
    })
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: `Failed to fetch image from URL: ${url}` })
  }

  if (!imageResponse.ok) {
    throw createError({ statusCode: 400, statusMessage: `Image URL returned ${imageResponse.status}: ${url}` })
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/png'
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
  if (!allowedMimeTypes.some(m => contentType.includes(m))) {
    throw createError({ statusCode: 400, statusMessage: `Unsupported image type: ${contentType}` })
  }

  const imageBuffer = await imageResponse.arrayBuffer()

  // ── 上传到 R2 ─────────────────────────────────────────────
  const ext = contentType.includes('svg') ? 'svg'
    : contentType.includes('webp') ? 'webp'
    : contentType.includes('gif') ? 'gif'
    : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg'
    : 'png'

  const r2Key = `tools/${slug}/${type}.${ext}`

  await env.R2.put(r2Key, imageBuffer, {
    httpMetadata: { contentType },
  })

  // ── 返回 R2 公开 URL ──────────────────────────────────────
  const r2PublicBase = env.R2_PUBLIC_URL?.replace(/\/$/, '') || ''
  const publicUrl = `${r2PublicBase}/${r2Key}`

  return {
    success: true,
    r2Key,
    url: publicUrl,
    type,
  }
})