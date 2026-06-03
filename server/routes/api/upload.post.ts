import { createError, readFormData } from 'h3'
import { getEnv } from '~/server/utils/env'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const EXT_MAP: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', gif: 'gif' }

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
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

  const mimeType = file.type.split('/')[1]
  const ext = EXT_MAP[mimeType] || mimeType
  const key = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  if (env.MEDIA) {
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    const publicUrl = `${(env.R2_PUBLIC_URL || 'https://r2.aifindr.org').replace(/\/+$/, '')}/${key}`
    return { url: publicUrl }
  }

  const publicDir = join(process.cwd(), 'public', 'tmp')
  mkdirSync(publicDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(join(publicDir, key), buffer)
  return { url: `/tmp/${key}` }
})
