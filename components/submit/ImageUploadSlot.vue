<template>
  <div>
    <div v-if="previewUrl || uploadedUrl" class="relative inline-block">
      <img :src="previewUrl || uploadedUrl" class="w-[100px] h-[100px] rounded-md object-cover"
        :style="{ border: '1px solid var(--color-border)' }" />
      <button type="button" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-body"
        :style="{ background: 'var(--color-danger)', color: '#fff' }"
        @click="removeUpload">&#x2715;</button>
    </div>

    <div v-else class="flex items-center justify-center h-[100px] rounded-md cursor-pointer hover:opacity-80 transition-opacity"
      :style="{ background: 'var(--color-bg-input)', border: '1px dashed var(--color-border)' }"
      @click="triggerInput">
      <span class="font-body text-[12px]" style="color: var(--color-text-muted)">
        <template v-if="uploading">
          <span class="inline-block w-3 h-3 border-2 rounded-full animate-spin align-middle mr-1.5"
            :style="{ borderColor: 'var(--color-text-muted)', borderTopColor: 'transparent' }"></span>
          Uploading...
        </template>
        <template v-else>
          + Upload Image
        </template>
      </span>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />

    <p v-if="uploadError" class="font-body text-[11px] mt-1" style="color: var(--color-danger)">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { useImageUpload } from '~/composables/useImageUpload'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { uploading, uploadError, previewUrl, uploadedUrl, uploadFile, clearUpload } = useImageUpload()
const fileInput = ref<HTMLInputElement>()

function triggerInput() {
  fileInput.value?.click()
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const url = await uploadFile(file)
  if (url) emit('update:modelValue', url)
  input.value = ''
}

function removeUpload() {
  clearUpload()
  emit('update:modelValue', '')
}
</script>
