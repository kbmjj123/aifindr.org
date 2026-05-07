<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold" style="color: var(--color-text-primary)">
        All AI Tools <span class="text-lg font-normal" style="color: var(--color-text-muted)">(500+)</span>
      </h1>
      <div class="flex items-center gap-2">
        <NuxtLink to="/submit" class="btn-primary text-xs hidden sm:inline-flex">
          + Submit Tool
        </NuxtLink>
      </div>
    </div>

    <!-- Sort tabs -->
    <div class="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
      <button v-for="tab in sortTabs" :key="tab.key"
        class="filter-tab shrink-0"
        :class="{ active: activeSort === tab.key }"
        @click="activeSort = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <!-- Pricing quick filter -->
    <div class="flex gap-2 mb-6">
      <button v-for="p in pricingFilters" :key="p.key"
        class="filter-tab"
        :class="{ active: activePricing === p.key }"
        @click="activePricing = p.key">
        {{ p.label }}
      </button>
    </div>

    <!-- Tool grid -->
    <ToolGrid>
      <ToolCard v-for="i in 24" :key="i" />
    </ToolGrid>

    <!-- Pagination -->
    <div class="flex items-center justify-center gap-2 mt-8">
      <button class="btn-secondary text-xs h-8 px-3" disabled>← Prev</button>
      <button class="page-btn active">1</button>
      <button class="page-btn">2</button>
      <button class="page-btn">3</button>
      <span style="color: var(--color-text-muted)">...</span>
      <button class="page-btn">12</button>
      <button class="btn-secondary text-xs h-8 px-3">Next →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const activeSort = ref('latest')
const activePricing = ref('all')

const sortTabs = [
  { key: 'latest', label: 'Latest' },
  { key: 'trending', label: 'Trending' },
  { key: 'featured', label: 'Featured' },
]

const pricingFilters = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'freemium', label: 'Freemium' },
  { key: 'paid', label: 'Paid' },
]

useHead({
  title: 'All AI Tools – aifindr.org',
})
</script>
