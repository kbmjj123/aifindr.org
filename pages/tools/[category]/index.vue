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

    <ToolGrid>
      <ToolCard v-for="i in 12" :key="i" />
    </ToolGrid>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)

const categoryInfo = computed(() =>
  CATEGORIES.find(c => c.slug === category.value)
)

const toolCount = computed(() => Math.floor(Math.random() * 50) + 5)

usePageSeo(() => ({
  title: categoryInfo.value?.name || category.value,
  template: 'category',
  category: categoryInfo.value?.name || category.value,
  description: `Browse the best ${categoryInfo.value?.name || category.value} AI tools. Compare pricing, read reviews, and find the perfect tool.`,
}))
</script>
