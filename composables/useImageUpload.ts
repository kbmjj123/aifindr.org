export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref('')
  const previewUrl = ref('')
  const uploadedUrl = ref('')

  async function uploadFile(file: File): Promise<string | null> {
    uploading.value = true
    uploadError.value = ''
    previewUrl.value = URL.createObjectURL(file)

    try {
      // Convert to WebP before upload
      const { toWebPFile } = useWebp()
      const { file: webpFile } = await toWebPFile(file, file.name, 0.85)

      const formData = new FormData()
      formData.append('file', webpFile)
      const res = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        // Allow timeout for image conversion + upload
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
