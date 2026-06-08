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
      const formData = new FormData()
      formData.append('file', file)
      const res = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
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
