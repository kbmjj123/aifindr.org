<template>
  <div>
    <!-- Breadcrumb -->
    <NuxtLink to="/tools" class="font-body text-[11px] mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; All Tools
    </NuxtLink>

    <div class="flex items-center gap-2 mb-6">
      <span class="text-xl">{{ categoryInfo?.emoji }}</span>
      <h1 class="font-sans font-extrabold text-[24px] tracking-tight" style="color: var(--color-text-primary)">
        {{ categoryInfo?.name || category }}
      </h1>
      <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">({{ toolCount }})</span>
    </div>

    <div v-if="loading" class="text-center py-20 font-body text-[12px]" style="color: var(--color-text-muted)">Loading tools...</div>
    <ToolGrid v-else>
      <ToolCard v-for="t in tools" :key="t.slug" :name="t.name" :description="t.meta_description || ''" :pricing="t.pricing" :featured="t.featured" :verified="t.verified" />
    </ToolGrid>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import type { Tool } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))

const tools = ref<Tool[]>([])
const toolCount = ref(0)
const loading = ref(true)

watch(category, () => loadCategory(), { immediate: true })

async function loadCategory() {
  loading.value = true
  try {
    const { data } = await useFetch<{ tools: Tool[]; total: number }>(`/api/tools?category=${category.value}&pageSize=50`)
    if (data.value) {
      tools.value = data.value.tools || []
      toolCount.value = data.value.total || 0
    }
  } catch {
    tools.value = []
  } finally {
    loading.value = false
  }
}

usePageSeo(() => ({
  title: categoryInfo.value?.name || category.value,
  template: 'category',
  category: categoryInfo.value?.name || category.value,
  description: `Browse the best ${categoryInfo.value?.name || category.value} AI tools. Compare pricing, read reviews, and find the perfect tool.`,
}))
</script>
