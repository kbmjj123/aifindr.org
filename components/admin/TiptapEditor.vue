<template>
  <Editor
    v-if="mounted && EditorComp"
    :init="initConfig"
    :model-value="modelValue"
    @on-editor-change="handleChange"
    @on-init="handleInit"
  />
  <div v-else class="skeleton h-[380px] rounded-md"></div>
</template>

<script setup lang="ts">
const mounted = ref(false)
const EditorComp = import.meta.client
  ? defineAsyncComponent(() => import('@tinymce/tinymce-vue'))
  : null

onMounted(() => { mounted.value = true })

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const handleChange = (_e: any, ed: any) => {
  emit('update:modelValue', ed.getContent())
}

const handleInit = (_e: any, ed: any) => {
  // Sync initial content if different from empty
  const val = props.modelValue
  if (val && ed.getContent() !== val) {
    ed.setContent(val)
  }
}

const initConfig = {
  height: 380,
  menubar: false,
  statusbar: false,
  promotion: false,
  branding: false,
  plugins: 'link lists image code',
  toolbar: 'bold italic | h2 h3 | bullist numlist | blockquote link image | code',
  content_style: `
    body { font-family: 'DM Mono', monospace; font-size: 13px; color: #f0f0f0; background: #111; line-height: 1.7; padding: 12px; }
    h2 { font-family: Syne, sans-serif; font-size: 18px; font-weight: 700; color: #f0f0f0; margin: 1.2em 0 0.5em; }
    h3 { font-family: Syne, sans-serif; font-size: 15px; font-weight: 600; color: #f0f0f0; margin: 1em 0 0.4em; }
    a { color: #a3c400; text-decoration: underline; }
    blockquote { border-left: 2px solid #c8ff00; padding-left: 12px; margin: 8px 0; color: #888; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    ul, ol { padding-left: 20px; }
    p { margin: 0 0 8px; }
    code { background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 3px; padding: 1px 5px; font-size: 12px; color: #c8ff00; }
    pre { background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 6px; padding: 12px; overflow-x: auto; }
  `,
  images_upload_handler: async (blobInfo: any) => {
    const { uploadFile } = useImageUpload()
    const file = blobInfo.blob() as File
    const url = await uploadFile(file, 'blog')
    if (!url) throw new Error('Upload failed')
    return url
  },
}
</script>
