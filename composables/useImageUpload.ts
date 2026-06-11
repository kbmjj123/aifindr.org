export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref('')
  const previewUrl = ref('')
  const uploadedUrl = ref('')

  async function uploadFile(file: File, prefix = 'images'): Promise<string | null> {
    uploading.value = true
    uploadError.value = ''
    previewUrl.value = URL.createObjectURL(file)

    try {
      // Always convert to WebP first
      const { toWebPFile } = useWebp()
      const { file: webpFile } = await toWebPFile(file, file.name, 0.85)

      // Try sign endpoint — returns presigned PUT URL in production,
      // or proxy mode in local dev
      const signRes = await $fetch<{
        mode: 'direct' | 'proxy'
        uploadUrl?: string
        publicUrl?: string
      }>('/api/upload/sign', {
        method: 'POST',
        body: {
          fileName: webpFile.name,
          fileType: webpFile.type,
          fileSize: webpFile.size,
          prefix,
        },
      }).catch(() => null)

      if (signRes?.mode === 'direct' && signRes.uploadUrl) {
        // Production: browser PUT directly to R2
        const putRes = await fetch(signRes.uploadUrl, {
          method: 'PUT',
          body: webpFile,
          headers: { 'content-type': webpFile.type },
        })
        if (!putRes.ok) {
          throw new Error(`Direct upload failed: ${putRes.status}`)
        }
        uploadedUrl.value = signRes.publicUrl!
        return signRes.publicUrl!
      }

      // Fallback: FormData proxy upload (local dev)
      const formData = new FormData()
      formData.append('file', webpFile)
      const res = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        timeout: 30000,
      })
      uploadedUrl.value = res.url
      return res.url
    } catch (e: any) {
      uploadError.value = e?.data?.statusMessage || e?.message || 'Upload failed'
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
      return null
    } finally {
      uploading.value = false
    }
  }

  function clearUpload() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    uploadedUrl.value = ''
    uploadError.value = ''
  }

  return { uploading, uploadError, previewUrl, uploadedUrl, uploadFile, clearUpload }
}
