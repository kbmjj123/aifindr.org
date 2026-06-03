<template>
  <div>
    <!-- Upload area -->
    <div class="flex items-start gap-3">
      <button type="button"
        class="btn-secondary !h-[34px] !text-[11px] shrink-0"
        :disabled="uploading" @click="triggerInput">
        <template v-if="uploading">
          <span class="inline-block w-3 h-3 border-2 rounded-full animate-spin"
            :style="{ borderColor: 'var(--color-text-muted)', borderTopColor: 'transparent' }"></span>
          Uploading...
        </template>
        <template v-else>
          Choose File
        </template>
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />

      <!-- Status / preview -->
      <div v-if="previewUrl" class="relative shrink-0">
        <img :src="previewUrl" class="w-[60px] h-[60px] rounded-md object-cover"
          :style="{ border: '1px solid var(--color-border)' }" />
        <button type="button" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-body"
          :style="{ background: 'var(--color-danger)', color: '#fff' }"
          @click="removeUpload">&#x2715;</button>
      </div>
      <div v-else-if="uploadedUrl" class="relative shrink-0">
        <img :src="uploadedUrl" class="w-[60px] h-[60px] rounded-md object-cover"
          :style="{ border: '1px solid var(--color-border)' }" />
        <button type="button" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-body"
          :style="{ background: 'var(--color-danger)', color: '#fff' }"
          @click="removeUpload">&#x2715;</button>
      </div>
    </div>

    <p v-if="uploadError" class="font-body text-[11px] mt-1" style="color: var(--color-danger)">{{ uploadError }}</p>

    <!-- Fallback URL input -->
    <div class="mt-2">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-body text-[10px]" style="color: var(--color-text-muted)">or paste image URL</span>
        <span class="flex-1 h-px" :style="{ background: 'var(--color-border)' }"></span>
      </div>
      <BaseInput v-model="urlValue" :placeholder="placeholder"
        class="!h-[32px] !text-[11px]" @update:model-value="onUrlChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageUpload } from '~/composables/useImageUpload'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { uploading, uploadError, previewUrl, uploadedUrl, uploadFile, clearUpload } = useImageUpload()
const fileInput = ref<HTMLInputElement>()
const urlValue = ref(props.modelValue)

function triggerInput() {
  fileInput.value?.click()
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const url = await uploadFile(file)
  if (url) {
    urlValue.value = url
    emit('update:modelValue', url)
  }
  input.value = ''
}

function onUrlChange(val: string) {
  emit('update:modelValue', val)
}

function removeUpload() {
  clearUpload()
  urlValue.value = ''
  emit('update:modelValue', '')
}

watch(() => props.modelValue, (v) => {
  if (v !== urlValue.value) urlValue.value = v
})
</script>
