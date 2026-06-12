<template>
  <QuillEditor
    v-model:content="content"
    content-type="html"
    theme="snow"
    :toolbar="toolbar"
    style="min-height: 300px"
  />
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

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
</script>