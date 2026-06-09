<template>
  <div v-if="subcategories.length > 0" class="mb-6 flex flex-wrap gap-1">
    <NuxtLink
      v-for="sub in subcategories"
      :key="sub.id"
      :to="`/tools/${categorySlug}/sub/${sub.id}`"
      class="h-[30px] px-3 rounded-md font-body text-[11px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 no-underline inline-flex items-center"
      :style="{
        background: activeTag === sub.id ? 'var(--color-accent-dim)' : 'transparent',
        border: activeTag === sub.id ? '1px solid var(--color-accent-border)' : '1px solid var(--color-border)',
        color: activeTag === sub.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
      }"
    >
      {{ sub.title }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Subcategory } from '~/types/category'

defineProps<{
  subcategories: Subcategory[]
  categorySlug: string
  activeTag?: string
}>()
</script>
