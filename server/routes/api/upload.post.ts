// server/api/upload.post.ts
import { createError, readFormData } from 'h3'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/vnd.microsoft.icon', 'image/avif']
const EXT_MAP: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', gif: 'gif', 'vnd.microsoft.icon': 'ico', avif: 'avif' }

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }
  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds 5MB limit' })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported file type. Use PNG, JPEG, WebP, or GIF.' })
  }

  const mimeType = file.type.split('/')[1]!
  const ext = EXT_MAP[mimeType] || mimeType
  const key = `tools/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  const cf = (event.context as any).cloudflare
  const bucket = cf?.env?.CDN

  if (!bucket) {
    throw createError({ statusCode: 500, statusMessage: 'R2 bucket not available' })
  }

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  const isProduction = cf?.env?.R2_PUBLIC_URL
  const url = isProduction
    ? `${cf.env.R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`
    : `http://localhost:3000/api/file/${key}` // 本地走 server route

  return { url }
})