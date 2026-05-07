<template>
  <div :class="expanded ? 'w-full header-search' : 'header-search'" @click="openSearchModal">
    <svg class="search-icon shrink-0" :class="expanded ? 'w-[18px] h-[18px]' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <span class="placeholder">Search 500+ AI tools...</span>
    <span class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}K</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  expanded?: boolean
}>()

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
