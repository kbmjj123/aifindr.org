<template>
  <div>
    <div class="flex gap-1 mb-2 p-0.5 rounded-md"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <button class="filter-tab flex-1 justify-center text-[11px]"
        :class="{ active: mode === 'edit' }" @click="mode = 'edit'">
        Edit
      </button>
      <button class="filter-tab flex-1 justify-center text-[11px]"
        :class="{ active: mode === 'preview' }" @click="mode = 'preview'">
        Preview
      </button>
    </div>

    <textarea v-show="mode === 'edit'" :value="modelValue"
      class="textarea min-h-[200px]" :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />

    <div v-show="mode === 'preview'" class="markdown-content min-h-[200px] p-3 rounded-md"
      :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }"
      v-html="renderedHtml" />

    <p class="font-body text-[11px] mt-1 text-right" style="color: var(--color-text-muted)">
      {{ modelValue.length }} chars
      <template v-if="wordCount < 100">
        &middot; <span style="color: var(--color-warning)">{{ wordCount }}/100 words min</span>
      </template>
      &middot; Renders as tool detail page content
    </p>

    <div v-show="mode === 'edit'" class="mt-2 p-2 rounded-md font-body text-[10px] leading-relaxed"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
      <span class="font-medium" style="color: var(--color-text-secondary)">Markdown hints:</span>
      <code class="text-[10px]"># h1</code> <code class="text-[10px]">## h2</code>
      <code class="text-[10px]">**bold**</code> <code class="text-[10px]">*italic*</code>
      <code class="text-[10px]">[link](url)</code> <code class="text-[10px]">![](img)</code>
      <code class="text-[10px]">- list</code> <code class="text-[10px]">```code```</code>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { render } = useMarkdown()
const mode = ref<'edit' | 'preview'>('edit')

const wordCount = computed(() => {
  const words = props.modelValue.trim().split(/\s+/)
  return words.length === 1 && words[0] === '' ? 0 : words.length
})

const renderedHtml = computed(() => render(props.modelValue))
</script>
