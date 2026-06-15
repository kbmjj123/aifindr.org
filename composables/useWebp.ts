/**
 * Client-side image → WebP conversion using Canvas API.
 * Works in browser only (not SSR).
 */
export function useWebp() {
  /**
   * Convert an image URL or File/Blob to a WebP Blob.
   * Falls back to original source if conversion fails.
   */
  async function toWebP(
    source: string | Blob,
    quality = 0.85
  ): Promise<{ blob: Blob; converted: boolean }> {
    try {
      const img = await loadImage(source)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context unavailable')

      ctx.drawImage(img, 0, 0)

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, converted: true })
            else reject(new Error('toBlob returned null'))
          },
          'image/webp',
          quality
        )
      })
    } catch {
      // If conversion fails (CORS, etc.), return original as-is
      const blob = source instanceof Blob ? source : await fetchSourceAsBlob(source)
      return { blob, converted: false }
    }
  }

  /**
   * Convert + wrap as File for FormData upload.
   * Filename always ends in .webp when conversion succeeds.
   */
  async function toWebPFile(
    source: string | File,
    fileName = 'image.webp',
    quality = 0.85
  ): Promise<{ file: File; converted: boolean }> {
    const { blob, converted } = await toWebP(source, quality)
    const name = converted ? fileName.replace(/\.[^.]+$/, '') + '.webp' : fileName
    return { file: new File([blob], name, { type: converted ? 'image/webp' : blob.type }), converted }
  }

  return { toWebP, toWebPFile }
}

// ── helpers ────────────────────────────────────────────────────

function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))

    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous'
      img.src = source
    } else {
      const url = URL.createObjectURL(source)
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(url); reject() }
      img.src = url
    }
  })
}

async function fetchSourceAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.blob()
}
