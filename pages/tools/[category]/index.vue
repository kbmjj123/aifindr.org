<template>
  <div>
    <NuxtLink to="/tools" class="text-sm mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; All Tools
    </NuxtLink>

    <div class="flex items-center gap-2 mb-6">
      <span class="text-xl">{{ categoryInfo?.emoji }}</span>
      <h1 class="text-3xl font-bold" style="color: var(--color-text-primary)">
        {{ categoryInfo?.name || category }}
      </h1>
      <span class="text-lg font-normal" style="color: var(--color-text-muted)">({{ toolCount }})</span>
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

useHead({
  title: computed(() => `Best ${categoryInfo.value?.name || category.value} AI Tools in 2026 – aifindr.org`),
})
</script>
