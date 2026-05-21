<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-extrabold text-[24px] tracking-tight" style="color: var(--color-text-primary)">
        All AI Tools <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">({{ total }})</span>
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
    <div v-if="pending" class="text-center py-20 font-body text-[12px]" style="color: var(--color-text-muted)">Loading tools...</div>
    <div v-else-if="tools.length === 0" class="text-center py-20">
      <div class="text-3xl mb-3">🔍</div>
      <h3 class="font-sans font-bold text-[16px]" style="color: var(--color-text-primary)">No tools found</h3>
      <p class="font-body text-[12px] mt-1 mb-4" style="color: var(--color-text-muted)">Try adjusting your filters.</p>
      <button class="btn-secondary" @click="clearFilters">Browse All Tools</button>
    </div>
    <ToolGrid v-else>
      <ToolCard v-for="t in tools" :key="t.slug" :tool="t" />

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
        <button class="btn-secondary !h-8 !px-3" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">← Prev</button>
        <button v-for="p in visiblePages" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
        <button class="btn-secondary !h-8 !px-3" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">Next →</button>
      </div>
    </ToolGrid>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import type { Tool } from '~/types/tool'

const route = useRoute()
const router = useRouter()

const activeSort = ref((route.query.sort as string) || 'latest')
const activePricing = ref((route.query.pricing as string) || 'all')
const showFilters = ref(false)
const filterCategories = ref<string[]>([])
const filterPricing = ref<string[]>([])
const filterPlatforms = ref<string[]>([])
const filterTags = ref<string[]>([])
const currentPage = ref(parseInt(route.query.page as string) || 1)
const pageSize = 24

// Sync sort/pricing/page to URL when changed (for sidebar/external navigation)
watch([activeSort, activePricing, currentPage], ([s, p, pg]) => {
  const query: Record<string, string> = {}
  if (s && s !== 'latest') query.sort = s
  if (p && p !== 'all') query.pricing = p
  if (pg && pg > 1) query.page = String(pg)
  router.replace({ query }).catch(() => {})
})

function buildPricingParam(): string | undefined {
  if (activePricing.value === 'all') {
    return filterPricing.value.length > 0 ? filterPricing.value.join(',') : undefined
  }
  return activePricing.value
}

function buildQueryString(): string {
  const params = new URLSearchParams()
  params.set('sort', activeSort.value)
  params.set('page', String(currentPage.value))
  params.set('pageSize', String(pageSize))
  const pricing = buildPricingParam()
  if (pricing) params.set('pricing', pricing)
  if (filterCategories.value.length) params.set('category', filterCategories.value[0])
  if (filterPlatforms.value.length) params.set('platform', filterPlatforms.value[0])
  if (filterTags.value.length) params.set('tags', filterTags.value.join(','))
  return params.toString()
}

const { data: result, pending } = await useAsyncData<{ tools: Tool[]; total: number }>(
  () => `tools-${buildQueryString()}`,
  () => $fetch<{ tools: Tool[]; total: number }>(`/api/tools?${buildQueryString()}`),
  {
    watch: [activeSort, activePricing, currentPage, filterCategories, filterPricing, filterPlatforms, filterTags],
    default: () => ({ tools: [], total: 0 }),
  }
)

const tools = computed(() => result.value?.tools ?? [])
const total = computed(() => result.value?.total ?? 0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const visiblePages = computed(() => {
  const pages: number[] = []
  const last = totalPages.value
  const curr = currentPage.value
  const start = Math.max(1, curr - 2)
  const end = Math.min(last, curr + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

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
  activePricing.value = 'all'
  activeSort.value = 'latest'
  currentPage.value = 1
}

function goPage(p: number) {
  currentPage.value = p
}

usePageSeo({
  title: 'All AI Tools',
  template: 'prefix',
  description: 'Browse our curated collection of 500+ AI tools. Filter by category, pricing, and platform to find the perfect tool for your needs.',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://aifindr.org/tools' }],
})
</script>
