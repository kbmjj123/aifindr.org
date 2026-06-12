<template>
  <QuillEditor
    ref="quillRef"
    v-model:content="content"
    content-type="html"
    theme="snow"
    :toolbar="toolbar"
    style="min-height: 300px"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const quillRef = ref<InstanceType<typeof QuillEditor>>()

const content = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const toolbar = [
  [{ heading: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
]

function onReady() {
  const quill = quillRef.value?.getQuill()
  if (!quill) return
  const tb = quill.getModule('toolbar') as any
  if (!tb) return
  tb.addHandler('image', imageHandler)
}

async function imageHandler() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const { uploadFile } = useImageUpload()
    const url = await uploadFile(file, 'blog')
    if (!url) return
    const quill = quillRef.value?.getQuill()
    if (!quill) return
    const range = quill.getSelection()
    quill.insertEmbed(range?.index || quill.getLength(), 'image', url)
  }
  input.click()
}
</script>

<style>
/* Dark theme overrides for Quill snow theme */
.ql-toolbar {
  border-color: var(--color-border) !important;
  background: var(--color-bg-input);
  border-radius: 6px 6px 0 0;
}
.ql-container {
  border-color: var(--color-border) !important;
  background: var(--color-bg-input);
  border-radius: 0 0 6px 6px;
  min-height: 300px;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: var(--color-text-primary);
}
.ql-editor {
  min-height: 300px;
}
.ql-editor h1, .ql-editor h2, .ql-editor h3 {
  font-family: 'Syne', sans-serif;
  color: var(--color-text-primary);
}
.ql-editor a { color: var(--color-text-link); }
.ql-editor blockquote {
  border-left: 2px solid var(--color-accent);
  color: var(--color-text-secondary);
  padding-left: 12px;
}
.ql-editor img {
  max-width: 100%;
  border-radius: 6px;
}
.ql-snow .ql-stroke { stroke: var(--color-text-secondary); }
.ql-snow .ql-fill { fill: var(--color-text-secondary); }
.ql-snow .ql-picker-label { color: var(--color-text-secondary); }
.ql-snow.ql-toolbar button:hover .ql-stroke,
.ql-snow .ql-toolbar button:hover .ql-stroke { stroke: var(--color-accent); }
.ql-snow.ql-toolbar button:hover,
.ql-snow .ql-toolbar button:hover { color: var(--color-accent); }
</style>
