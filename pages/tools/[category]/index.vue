<template>
  <div>
    <!-- Breadcrumb -->
    <NuxtLink to="/tools" class="font-body text-[12px] mb-4 inline-block no-underline" style="color: var(--color-text-secondary)">
      &larr; All Tools
    </NuxtLink>

    <!-- ═══ Hero ═══ -->
    <div class="mb-8">
      <div class="flex items-start gap-3 mb-4">
        <span class="text-2xl mt-1 shrink-0">{{ categoryInfo?.icon }}</span>
        <div class="min-w-0">
          <h1 class="font-sans font-extrabold text-[24px] lg:text-[28px]" style="letter-spacing: -1.5px; line-height: 1.05; color: var(--color-text-primary)">
            {{ categoryInfo?.h1 || categoryInfo?.title || category }}
          </h1>
          <span class="font-body text-[14px]" style="color: var(--color-text-muted)">{{ toolCount }} tools</span>
        </div>
      </div>
      <p v-if="categoryInfo?.use" class="font-body text-[13px] max-w-[640px]" style="color: var(--color-text-secondary); line-height: 1.65">
        {{ categoryInfo.use }}
      </p>
    </div>

    <!-- ═══ Subcategories ═══ -->
    <div v-if="subcategories.length" class="mb-10">
      <h2 class="font-sans font-bold text-[16px] mb-4" style="color: var(--color-text-primary)">
        Browse by {{ categoryInfo?.title }} Subcategories
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
        <NuxtLink
          v-for="sub in subcategories" :key="sub.id"
          :to="`/tools/${category}/sub/${sub.id}`"
          class="block rounded-lg p-3.5 transition-all duration-150 no-underline"
          :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
          @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'"
        >
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">
            {{ sub.title }}
          </div>
          <div class="font-body text-[11px] line-clamp-2" style="color: var(--color-text-muted)">
            {{ sub.description }}
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- ═══ Featured Tools ═══ -->
    <FeaturedTools :tools="featuredTools" />

    <!-- ═══ Filter Bar ═══ -->
    <CategoryFilterBar v-model="filters" />

    <!-- ═══ Loading / Tool Grid ═══ -->
    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">Loading tools...</div>
    <template v-else-if="filteredTools.length > 0">
      <ToolGrid>
        <ToolCard v-for="t in filteredTools" :key="t.slug" :tool="t" />
      </ToolGrid>
    </template>
    <div v-else class="flex flex-col items-center py-16 gap-3">
      <div class="text-3xl">{{ categoryInfo?.icon }}</div>
      <h3 class="font-sans font-bold text-[16px]" style="color: var(--color-text-primary)">
        {{ allTools.length ? 'No tools match your filters' : 'No tools yet' }}
      </h3>
      <p class="font-body text-[12px] max-w-[320px] text-center" style="color: var(--color-text-muted)">
        {{ allTools.length ? 'Try adjusting your filter criteria.' : 'No tools have been added to this category yet. Check back soon.' }}
      </p>
      <button v-if="allTools.length && !isDefaultFilters" class="btn-secondary" @click="filters = { pricing: 'all', sort: 'latest' }">
        Clear Filters
      </button>
      <NuxtLink v-else to="/tools" class="btn-secondary no-underline">Browse All Tools</NuxtLink>
    </div>

    <!-- ═══ Category Guides ═══ -->
    <div v-if="categoryGuides.length" class="mt-12 mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-4" style="color: var(--color-text-primary)">
        Guides & Tips
      </h2>
      <div class="space-y-3">
        <div v-for="(guide, gi) in categoryGuides" :key="gi"
          class="rounded-lg overflow-hidden transition-all duration-150"
          :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
          <button
            class="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
            :style="{ color: 'var(--color-text-primary)' }"
            @click="toggleGuide(gi)">
            <span class="text-xl shrink-0">{{ guide.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-sans font-semibold text-[13px]">{{ guide.title }}</div>
              <div class="font-body text-[11px] line-clamp-1" style="color: var(--color-text-muted)">{{ guide.description }}</div>
            </div>
            <svg
              class="shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': openGuide === gi }"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              :style="{ stroke: 'var(--color-text-muted)' }" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-if="openGuide === gi" class="px-4 pb-4 space-y-3">
            <p class="font-body text-[12px]" style="color: var(--color-text-secondary); line-height: 1.6">
              {{ guide.description }}
            </p>
            <div v-for="(faq, fi) in guide.faq" :key="fi"
              class="rounded-md p-3"
              :style="{ background: 'var(--color-bg-elevated)' }">
              <div class="font-sans font-semibold text-[12px] mb-1.5" style="color: var(--color-text-primary)">
                Q: {{ faq.question }}
              </div>
              <div class="font-body text-[12px]" style="color: var(--color-text-secondary); line-height: 1.6">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/category'
import type { Tool } from '~/types/tool'

const route = useRoute()
const { get } = useApi()
const category = computed(() => route.params.category as string)

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))
const subcategories = computed(() => categoryInfo.value?.subcategories || [])
const categoryGuides = computed(() => categoryInfo.value?.guides || [])

// Guide accordion
const openGuide = ref<number | null>(null)
function toggleGuide(idx: number) {
  openGuide.value = openGuide.value === idx ? null : idx
}

// Filters: pricing + sort
const filters = ref({ pricing: 'all', sort: 'latest' })

// Fetch key changes when category or filters change → triggers re-fetch
const fetchKey = computed(() =>
  `category-${category.value}-p${filters.value.pricing}-s${filters.value.sort}`
)

function buildQueryString(): string {
  const params = new URLSearchParams()
  params.set('category', category.value)
  params.set('pageSize', '100')
  if (filters.value.pricing !== 'all') params.set('pricing', filters.value.pricing)
  if (filters.value.sort !== 'latest') params.set('sort', filters.value.sort)
  return params.toString()
}

const { data: result, pending } = useAsyncData<{ tools: Tool[]; total: number }>(
  fetchKey,
  () => get<{ tools: Tool[]; total: number }>(`/api/tools?${buildQueryString()}`),
  {
    watch: [fetchKey],
    default: () => ({ tools: [], total: 0 }),
  }
)

const allTools = computed(() => result.value?.tools ?? [])
const featuredTools = computed(() => allTools.value.filter(t => t.featured).slice(0, 3))
const filteredTools = computed(() => allTools.value.filter(t => !t.featured))
const toolCount = computed(() => filteredTools.value.length)

const isDefaultFilters = computed(() =>
  filters.value.pricing === 'all' && filters.value.sort === 'latest'
)

usePageSeo(() => ({
  title: categoryInfo.value?.title || category.value,
  template: 'category',
  category: categoryInfo.value?.title || category.value,
  description: categoryInfo.value?.description
    || `Browse the best ${categoryInfo.value?.title || category.value} AI tools. Compare pricing, read reviews, and find the perfect tool.`,
}))

// FAQPage schema for SEO rich results
const faqSchema = computed(() => {
  const guides = categoryGuides.value
  if (!guides.length) return []
  const faqs = guides.flatMap((g: any) =>
    (g.faq || []).map((f: any) => ({
      '@type': 'Question' as const,
      name: f.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: f.answer },
    }))
  )
  if (!faqs.length) return []
  return [{ '@type': 'FAQPage' as const, mainEntity: faqs }]
})
useSchemaOrg(faqSchema)
</script>
