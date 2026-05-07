<template>
  <Teleport to="body">
    <div v-if="isOpen" class="search-overlay" @click.self="close">
      <div class="search-modal">
        <!-- Search input -->
        <div :style="{ borderBottom: '1px solid var(--color-border)' }">
          <svg class="absolute left-5 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-muted)">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input ref="inputRef" v-model="query" placeholder="Search tools..."
            class="search-modal-input !pl-[52px]"
            @keydown.down.prevent="navigate(1)"
            @keydown.up.prevent="navigate(-1)"
            @keydown.enter="selectResult" />
        </div>

        <!-- Results -->
        <div class="search-results">
          <div v-for="(result, i) in results" :key="i"
            class="search-result-item"
            :class="{ active: selectedIndex === i }"
            @click="selectedIndex = i; selectResult()"
            @mouseenter="selectedIndex = i">
            <div class="w-8 h-8 rounded-[7px] shrink-0 flex items-center justify-center font-sans font-bold text-[11px]"
              :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
              {{ result.name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-sans font-semibold text-[13px] truncate" style="color: var(--color-text-primary)">
                {{ result.name }}
              </div>
              <div class="font-body text-[11px] truncate" style="color: var(--color-text-muted)">
                {{ result.category }}
              </div>
            </div>
            <span :class="['tag', `tag-${result.pricing}`]">{{ result.pricingLabel }}</span>
          </div>
          <div v-if="query && results.length === 0" class="empty-state !py-10">
            <span class="icon">🔍</span>
            <h3>No tools found</h3>
            <p>No results for "{{ query }}"</p>
          </div>
          <div v-if="!query" class="h-24 flex items-center justify-center font-body text-sm" style="color: var(--color-text-muted)">
            Type to search AI tools...
          </div>
        </div>

        <!-- Footer -->
        <div class="search-modal-footer">
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
    selectedIndex.value = 0
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
