<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100]" @click.self="close">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="fixed top-[20%] left-1/2 -translate-x-1/2 w-[min(600px,90vw)] overflow-hidden rounded-2xl"
        :style="{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }">
        <!-- Search input -->
        <div class="relative" :style="{ borderBottom: '1px solid var(--color-border)' }">
          <svg class="absolute left-5 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-muted)">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input ref="inputRef" v-model="query" placeholder="Search tools..."
            class="w-full h-14 text-lg pl-[52px] pr-5 border-none bg-transparent"
            :style="{ color: 'var(--color-text-primary)' }"
            @keydown.down.prevent="navigate(1)"
            @keydown.up.prevent="navigate(-1)"
            @keydown.enter="selectResult"
            @keydown.escape="close" />
        </div>

        <!-- Results -->
        <div class="max-h-[400px] overflow-y-auto p-2">
          <div v-for="(result, i) in results" :key="i"
            class="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
            :class="{ 'is-selected': selectedIndex === i }"
            :style="selectedIndex === i ? { background: 'var(--color-bg-surface)' } : {}"
            @click="selectedIndex = i; selectResult()"
            @mouseenter="selectedIndex = i">
            <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold"
              :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
              {{ result.name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate" style="color: var(--color-text-primary)">
                {{ result.name }}
              </div>
              <div class="text-xs truncate" style="color: var(--color-text-muted)">
                {{ result.category }}
              </div>
            </div>
            <ToolTag :type="result.pricing">{{ result.pricingLabel }}</ToolTag>
          </div>
          <div v-if="query && results.length === 0" class="py-8 text-center text-sm" style="color: var(--color-text-muted)">
            No tools found for "{{ query }}"
          </div>
          <div v-if="!query" class="py-8 text-center text-sm" style="color: var(--color-text-muted)">
            Type to search AI tools...
          </div>
        </div>

        <!-- Footer -->
        <div class="h-9 flex items-center px-4 text-xs gap-4"
          :style="{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span class="ml-auto">esc close</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

const { isOpen, close } = useSearch()
const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement>()

interface SearchResultItem {
  name: string
  category: string
  pricing: ToolPricing
  pricingLabel: string
}

const results = computed<SearchResultItem[]>(() => {
  if (!query.value) return []
  // Placeholder results
  return [
    { name: 'Midjourney', category: 'Image & Design', pricing: 'paid' as ToolPricing, pricingLabel: 'Paid' },
    { name: 'ChatGPT', category: 'Writing & Content', pricing: 'freemium' as ToolPricing, pricingLabel: 'Freemium' },
    { name: 'Stable Diffusion', category: 'Image & Design', pricing: 'free' as ToolPricing, pricingLabel: 'Free' },
  ].filter(r => r.name.toLowerCase().includes(query.value.toLowerCase()))
})

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => inputRef.value?.focus())
  } else {
    query.value = ''
  }
})

function navigate(dir: number) {
  selectedIndex.value = Math.max(0, Math.min(results.value.length - 1, selectedIndex.value + dir))
}

function selectResult() {
  if (results.value[selectedIndex.value]) {
    close()
    navigateTo('/tools/image/midjourney')
  }
}
</script>

<style scoped>
.is-selected {
  background: var(--color-bg-surface);
}
</style>
