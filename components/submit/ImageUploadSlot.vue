<template>
  <div>
    <div v-if="previewUrl || uploadedUrl" class="relative inline-block">
      <img :src="previewUrl || uploadedUrl" :class="previewClass" class="rounded-md object-cover"
        :style="{ border: '1px solid var(--color-border)' }" />
      <!-- Uploading overlay -->
      <div v-if="uploading"
        class="absolute inset-0 rounded-md flex items-center justify-center"
        :style="{ background: 'rgba(0,0,0,0.55)' }">
        <span class="inline-block w-4 h-4 border-2 rounded-full animate-spin"
          :style="{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }"></span>
      </div>
      <button type="button" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-body"
        :style="{ background: 'var(--color-danger)', color: '#fff' }"
        @click="removeUpload">&#x2715;</button>
    </div>

    <div v-else :class="uploadAreaClass" class="flex items-center justify-center rounded-md cursor-pointer hover:opacity-80 transition-opacity"
      :style="{ background: 'var(--color-bg-input)', border: '1px dashed var(--color-border)' }"
      @click="triggerInput">
      <span class="font-body text-[12px]" style="color: var(--color-text-muted)">
        <template v-if="uploading">
          <span class="inline-block w-3 h-3 border-2 rounded-full animate-spin align-middle mr-1.5"
            :style="{ borderColor: 'var(--color-text-muted)', borderTopColor: 'transparent' }"></span>
          Uploading...
        </template>
        <template v-else>
          + {{ buttonLabel }}
        </template>
      </span>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />

    <p v-if="uploadError" class="font-body text-[11px] mt-1" style="color: var(--color-danger)">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { useImageUpload } from '~/composables/useImageUpload'

const props = withDefaults(defineProps<{ modelValue: string; aspect?: 'square' | 'screenshot' }>(), {
  aspect: 'square',
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { uploading, uploadError, previewUrl, uploadedUrl, uploadFile, clearUpload } = useImageUpload()
const fileInput = ref<HTMLInputElement>()

const previewClass = computed(() =>
  props.aspect === 'square' ? 'w-[100px] h-[100px]' : 'w-[178px] h-[100px]'
)

const uploadAreaClass = computed(() =>
  props.aspect === 'square' ? 'w-[100px] h-[100px]' : 'w-[178px] h-[100px]'
)

const buttonLabel = computed(() =>
  props.aspect === 'square' ? 'Upload Icon' : 'Upload Image'
)

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
