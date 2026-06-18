// server/routes/files/[...key].get.ts
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file key' })
  }

  const cf = (event.context as any).cloudflare
  const bucket = cf?.env?.CDN

  if (bucket) {
    const object = await bucket.get(key)

    if (!object) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' })
    }

    // ✅ 从 key 推断 Content-Type，完全不用 writeHttpMetadata
    const extMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      ico: 'image/x-icon',
      avif: 'image/avif',
    }
    const ext = key.split('.').pop()?.toLowerCase() || ''
    const contentType = extMap[ext] || 'application/octet-stream'

    return new Response(object.body, {
      headers: {
        'content-type': contentType,
        'etag': object.httpEtag,
        'cache-control': 'public, max-age=31536000',
      },
    })
  }

  // No R2 — fallback to local filesystem
  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const localPath = join(process.cwd(), 'public', '_uploads', key.replace(/^\/+/, ''))
  try {
    const buffer = await readFile(localPath)
    const ext = (key.split('.').pop()?.toLowerCase() || '')
    const extMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      webp: 'image/webp', gif: 'image/gif', ico: 'image/x-icon', avif: 'image/avif',
    }
    return new Response(buffer, {
      headers: {
        'content-type': extMap[ext] || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000',
      },
    })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})