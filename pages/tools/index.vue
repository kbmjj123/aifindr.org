<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-extrabold text-[24px] tracking-tight" style="color: var(--color-text-primary)">
        All AI Tools <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">({{ total }})</span>
      </h1>
    </div>

    <!-- Filter bar -->
    <CategoryFilterBar v-model="filters" class="mb-6" />

    <!-- Browse by Category -->
    <div class="mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
        Browse by Category
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        <NuxtLink v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
          class="flex items-center gap-2.5 px-3 rounded-lg h-[56px] transition-all duration-150"
          :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
          @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'">
          <span class="text-lg shrink-0">{{ cat.icon }}</span>
          <div class="min-w-0">
            <div class="font-sans font-semibold text-[12px] leading-tight" style="color: var(--color-text-primary)">
              {{ cat.title }}
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Tool grid -->
    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">Loading tools...</div>
    <div v-else-if="tools.length === 0" class="text-center py-20">
      <div class="text-3xl mb-3">🔍</div>
      <h3 class="font-sans font-bold text-[16px]" style="color: var(--color-text-primary)">No tools found</h3>
      <p class="font-body text-[13px] mt-1 mb-4" style="color: var(--color-text-muted)">Try adjusting your filters.</p>
      <NuxtLink to="/tools" class="btn-secondary no-underline">Browse All Tools</NuxtLink>
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
import { CATEGORIES } from '~/types/category'
import type { Tool } from '~/types/tool'

const route = useRoute()
const router = useRouter()
const { get } = useApi()

const filters = ref({ pricing: (route.query.pricing as string) || 'all', sort: (route.query.sort as string) || 'latest' })
const currentPage = ref(parseInt(route.query.page as string) || 1)
const pageSize = 24

watch([filters, currentPage], ([f, pg]) => {
  const query: Record<string, string> = {}
  if (f.sort && f.sort !== 'latest') query.sort = f.sort
  if (f.pricing && f.pricing !== 'all') query.pricing = f.pricing
  if (pg && pg > 1) query.page = String(pg)
  router.replace({ query }).catch(() => {})
}, { deep: true })

const apiQuery = computed(() => {
  const params = new URLSearchParams()
  params.set('sort', filters.value.sort)
  params.set('page', String(currentPage.value))
  params.set('pageSize', String(pageSize))
  if (filters.value.pricing !== 'all') params.set('pricing', filters.value.pricing)
  return params.toString()
})

const { data: result, pending } = useAsyncData<{ tools: Tool[]; total: number }>(
  () => `tools-${apiQuery.value}`,
  () => get<{ tools: Tool[]; total: number }>(`/api/tools?${apiQuery.value}`),
  {
    watch: [apiQuery],
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

const categories = CATEGORIES

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
