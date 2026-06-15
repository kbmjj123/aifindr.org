<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools" class="no-underline">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${cat.slug}`" class="no-underline">{{ cat.title }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ subcat.title }}</span>
    </nav>

    <!-- Hero -->
    <div class="flex items-start gap-3 mb-3">
      <span class="text-xl mt-1 shrink-0">{{ cat.icon }}</span>
      <div class="min-w-0">
        <h1 class="font-sans font-extrabold text-[24px]" style="letter-spacing: -1.5px; line-height: 1.05; color: var(--color-text-primary)">
          {{ subcat.title }}
        </h1>
        <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">{{ toolCount }} tools</span>
      </div>
    </div>

    <p class="font-body text-[13px] leading-relaxed max-w-[720px] mb-6" style="color: var(--color-text-secondary)">
      {{ subcat.hero }}
    </p>

    <!-- Subcategory nav -->
    <SubcategoryNav
      :subcategories="cat.subcategories"
      :category-slug="cat.slug"
      :active-tag="subcat.id"
    />

    <!-- Filter -->
    <CategoryFilterBar v-model="filters" />

    <!-- Tools -->
    <div v-if="pending" class="text-center py-20 font-body text-[12px]" style="color: var(--color-text-muted)">
      Loading tools...
    </div>
    <ToolGrid v-else-if="filteredTools.length > 0">
      <ToolCard v-for="t in filteredTools" :key="t.slug" :tool="t" />
    </ToolGrid>
    <div v-else class="flex flex-col items-center py-16 gap-3">
      <span class="text-2xl">{{ cat.icon }}</span>
      <h3 class="font-sans font-bold text-[16px] text-center" style="letter-spacing: -0.3px; color: var(--color-text-primary)">
        {{ hasTools ? 'No tools match your filters' : 'No tools yet' }}
      </h3>
      <p class="font-body text-[12px] text-center max-w-[320px]" style="color: var(--color-text-muted)">
        {{ hasTools ? 'Try adjusting your filter criteria.' : 'No tools have been added to this subcategory yet.' }}
      </p>
      <button v-if="hasTools && !isDefaultFilters" class="btn-secondary" @click="resetFilters">
        Clear Filters
      </button>
      <NuxtLink v-else :to="`/tools/${cat.slug}`" class="btn-secondary no-underline">
        Browse All {{ cat.title }} Tools
      </NuxtLink>
    </div>

    <!-- Guide -->
    <CategoryGuide :guides="subcat.guides" :category-title="subcat.title" />
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/category'
import type { Category, Subcategory } from '~/types/category'
import type { Tool } from '~/types/tool'

const route = useRoute()
const { get } = useApi()
const category = computed(() => route.params.category as string)
const tag = computed(() => route.params.tag as string)

const cat = computed((): Category => {
  const found = CATEGORIES.find(c => c.slug === category.value)
  if (!found) throw createError({ statusCode: 404, message: 'Category not found' })
  return found
})

const subcat = computed((): Subcategory => {
  const found = cat.value.subcategories.find(s => s.id === tag.value)
  if (!found) throw createError({ statusCode: 404, message: 'Subcategory not found' })
  return found
})

const filters = ref({ pricing: 'all', sort: 'latest' })

const fetchKey = computed(() =>
  `category-${category.value}-${tag.value}-p${filters.value.pricing}-s${filters.value.sort}`
)

function buildQueryString(): string {
  const params = new URLSearchParams()
  params.set('category', category.value)
  params.set('sub_category', tag.value)
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

const filteredTools = computed(() => {
  let tools = [...allTools.value]
  if (filters.value.pricing !== 'all') {
    tools = tools.filter(t => t.pricing === filters.value.pricing)
  }
  switch (filters.value.sort) {
    case 'trending':
      tools.sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
      break
    case 'featured':
      tools.sort((a, b) => (b.editor_pick ? 1 : 0) - (a.editor_pick ? 1 : 0))
      break
    default:
      tools.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }
  return tools
})

const toolCount = computed(() => filteredTools.value.length)
const hasTools = computed(() => allTools.value.length > 0)

const isDefaultFilters = computed(() =>
  filters.value.pricing === 'all' && filters.value.sort === 'latest'
)

function resetFilters() {
  filters.value = { pricing: 'all', sort: 'latest' }
}

usePageSeo(() => ({
  title: `${subcat.value.title} — ${cat.value.title}`,
  template: 'prefix',
  description: subcat.value.description,
}))
</script>
