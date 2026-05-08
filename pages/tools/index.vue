<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-extrabold text-[24px] tracking-tight" style="color: var(--color-text-primary)">
        All AI Tools <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">(500+)</span>
      </h1>
      <NuxtLink to="/submit" class="btn-header-submit hidden sm:inline-flex">
        + Submit Tool
      </NuxtLink>
    </div>

    <!-- Sort tabs -->
    <div class="filter-tabs mb-6">
      <button v-for="tab in sortTabs" :key="tab.key"
        class="filter-tab shrink-0"
        :class="{ active: activeSort === tab.key }"
        @click="activeSort = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <!-- Pricing quick filter + Filter button -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button v-for="p in pricingFilters" :key="p.key"
        class="filter-tab"
        :class="{ active: activePricing === p.key }"
        @click="activePricing = p.key">
        {{ p.label }}
      </button>
      <button class="filter-tab ml-auto flex items-center gap-1.5" :class="{ active: showFilters }"
        @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
        Filters
      </button>
    </div>

    <!-- Expandable filter panel -->
    <div v-if="showFilters" class="p-5 mb-6 rounded-lg"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Category -->
        <div>
          <div class="nav-section-title !mt-0">Category</div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <label v-for="cat in categories" :key="cat.slug"
              class="flex items-center gap-2 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
              <input type="checkbox" :value="cat.slug" v-model="filterCategories"
                class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
              <span>{{ cat.emoji }} {{ cat.name }}</span>
            </label>
          </div>
        </div>
        <!-- Pricing -->
        <div>
          <div class="nav-section-title !mt-0">Pricing</div>
          <div class="space-y-1.5">
            <label v-for="p in pricingOptions" :key="p.value"
              class="flex items-center gap-2 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
              <input type="checkbox" :value="p.value" v-model="filterPricing"
                class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
              {{ p.label }}
            </label>
          </div>
        </div>
        <!-- Platform -->
        <div>
          <div class="nav-section-title !mt-0">Platform</div>
          <div class="space-y-1.5">
            <label v-for="p in platformOptions" :key="p.value"
              class="flex items-center gap-2 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
              <input type="checkbox" :value="p.value" v-model="filterPlatforms"
                class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
              {{ p.label }}
            </label>
          </div>
        </div>
        <!-- Tags -->
        <div>
          <div class="nav-section-title !mt-0">Tags</div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="tag in popularTags" :key="tag"
              class="filter-tab !h-7 !px-2.5 !text-[10px]"
              :class="{ active: filterTags.includes(tag) }"
              @click="toggleTag(tag)">
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2 mt-4 pt-4"
        :style="{ borderTop: '1px solid var(--color-border)' }">
        <button class="btn-ghost" @click="clearFilters">Clear Filters</button>
        <button class="btn-primary !h-8 !px-4" @click="showFilters = false">Apply</button>
      </div>
    </div>

    <!-- Tool grid -->
    <ToolGrid>
      <ToolCard v-for="i in 24" :key="i" />
    </ToolGrid>

    <!-- Pagination -->
    <div class="flex items-center justify-center gap-2 mt-8">
      <button class="btn-secondary !h-8 !px-3" disabled>← Prev</button>
      <button class="page-btn active">1</button>
      <button class="page-btn">2</button>
      <button class="page-btn">3</button>
      <span class="font-body text-[11px]" style="color: var(--color-text-muted)">...</span>
      <button class="page-btn">12</button>
      <button class="btn-secondary !h-8 !px-3">Next →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const activeSort = ref('latest')
const activePricing = ref('all')
const showFilters = ref(false)
const filterCategories = ref<string[]>([])
const filterPricing = ref<string[]>([])
const filterPlatforms = ref<string[]>([])
const filterTags = ref<string[]>([])

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

const categories = CATEGORIES

const pricingOptions = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
]

const platformOptions = [
  { value: 'web', label: 'Web' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'api', label: 'API' },
]

const popularTags = ['ai', 'image-generation', 'chat', 'writing', 'video', 'code', 'automation', 'productivity']

function toggleTag(tag: string) {
  const idx = filterTags.value.indexOf(tag)
  if (idx >= 0) filterTags.value.splice(idx, 1)
  else filterTags.value.push(tag)
}

function clearFilters() {
  filterCategories.value = []
  filterPricing.value = []
  filterPlatforms.value = []
  filterTags.value = []
}

usePageSeo({
  title: 'All AI Tools',
  template: 'prefix',
  description: 'Browse our curated collection of 500+ AI tools. Filter by category, pricing, and platform to find the perfect tool for your needs.',
})
</script>
