// server/api/upload.post.ts
import { createError, readFormData } from 'h3'
import { getEnv } from '~/server/utils/env'

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

  // Try getEnv — same pattern as admin/upload-from-url.post.ts
  let bucket: any
  let isProduction = false
  let r2PublicUrl = ''
  try {
    const env = getEnv(event)
    bucket = env.CDN
    r2PublicUrl = env.R2_PUBLIC_URL || ''
    // event.context.cloudflare.env = 真实 Worker 环境 → CDN URL
    // event.req.runtime.cloudflare.env  = 本地 mock → localhost
    isProduction = !!(event.context as any).cloudflare?.env?.R2_PUBLIC_URL
  } catch {
    // No CF bindings — falls through to local filesystem fallback
  }

  if (bucket) {
    // Has R2 (production via Workers, or local via cloudflare_module mock)
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    })
    const url = isProduction
      ? `${r2PublicUrl.replace(/\/+$/, '')}/${key}`
      : `http://localhost:3000/api/file/${key}`
    return { url }
  }

  // No R2 at all — fallback to local filesystem
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const uploadDir = join(process.cwd(), 'public', '_uploads')
  await mkdir(uploadDir, { recursive: true })
  const localPath = join(uploadDir, key.replace(/[^a-zA-Z0-9/._-]/g, ''))
  await mkdir(join(localPath, '..'), { recursive: true })
  await writeFile(localPath, Buffer.from(await file.arrayBuffer()))
  const url = `/_uploads/${key}`

  return { url }
})