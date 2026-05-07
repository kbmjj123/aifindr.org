<template>
  <div class="relative" :class="expanded ? 'w-full' : 'w-full max-w-[280px]'">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-muted)">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input
      :class="['input', expanded ? 'h-12 text-base rounded-xl pl-10 pr-20' : 'h-9 text-xs rounded-lg pl-9 pr-16']"
      :placeholder="expanded ? 'Search 500+ AI tools...' : 'Search 500+ AI tools...'"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @click="openSearchModal"
      readonly
    />
    <kbd class="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-medium"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
      {{ isMac ? '⌘' : 'Ctrl' }}K
    </kbd>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  expanded?: boolean
}>()

const isFocused = ref(false)
const isMac = computed(() => {
  if (import.meta.client) {
    return navigator.platform.includes('Mac')
  }
  return true
})

function openSearchModal() {
  const { open } = useSearch()
  open()
}
</script>
