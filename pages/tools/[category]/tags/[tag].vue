<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools" class="no-underline">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${category}`" class="no-underline">{{ catTitle }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ tagLabel }}</span>
    </nav>

    <!-- Hero -->
    <div class="flex items-start gap-3 mb-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h1 class="font-sans font-extrabold text-[24px]" style="letter-spacing: -1.5px; line-height: 1.05; color: var(--color-text-primary)">
            {{ tagLabel }}
          </h1>
          <span v-if="tagType" class="badge capitalize"
            :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' }">
            {{ tagType }}
          </span>
        </div>
        <span class="font-body text-[14px]" style="color: var(--color-text-muted)">{{ toolCount }} tools</span>
      </div>
    </div>

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
      <span class="text-2xl">🏷️</span>
      <h3 class="font-sans font-bold text-[16px] text-center" style="letter-spacing: -0.3px; color: var(--color-text-primary)">
        {{ hasTools ? 'No tools match your filters' : 'No tools yet' }}
      </h3>
      <p class="font-body text-[12px] text-center max-w-[320px]" style="color: var(--color-text-secondary)">
        {{ hasTools ? 'Try adjusting your filter criteria.' : 'No tools have been tagged with this label yet.' }}
      </p>
      <button v-if="hasTools && !isDefaultFilters" class="btn-secondary" @click="resetFilters">
        Clear Filters
      </button>
      <NuxtLink v-else :to="`/tools/${category}`" class="btn-secondary no-underline">
        Browse All {{ catTitle }} Tools
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/tool'
import { FEATURE_TAGS, AUDIENCE_TAGS, USE_CASE_TAGS, CATEGORIES } from '~/types/category'

const route = useRoute()
const { get } = useApi()
const category = computed(() => route.params.category as string)
const tag = computed(() => route.params.tag as string)

const catTitle = computed(() => {
  const found = CATEGORIES.find(c => c.slug === category.value)
  return found?.title || category.value
})

function findTagInfo(cat: string, tagVal: string): { label: string; type: string } {
  const ft = FEATURE_TAGS.find(t => t.value === tagVal)
  if (ft) return { label: ft.label, type: 'feature' }

  const at = AUDIENCE_TAGS.find(t => t.value === tagVal)
  if (at) return { label: at.label, type: 'audience' }

  const uc = USE_CASE_TAGS[cat]?.find(t => t.value === tagVal)
  if (uc) return { label: uc.label, type: 'use_case' }

  return {
    label: tagVal.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: '',
  }
}

const tagInfo = computed(() => findTagInfo(category.value, tag.value))
const tagLabel = computed(() => tagInfo.value.label)
const tagType = computed(() => tagInfo.value.type)

const filters = ref({ pricing: 'all', sort: 'latest' })

const fetchKey = computed(() =>
  `tags-${category.value}-${tag.value}-p${filters.value.pricing}-s${filters.value.sort}`
)

function buildQueryString(): string {
  const params = new URLSearchParams()
  params.set('category', category.value)
  params.set('tags', tag.value)
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
  title: `${tagLabel.value} ${catTitle.value} AI Tools`,
  template: 'prefix',
  description: `Browse AI tools tagged with "${tagLabel.value}" in the ${catTitle.value} category.`,
}))
</script>
