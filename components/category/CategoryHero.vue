<template>
  <div class="mb-8">
    <div class="flex items-start gap-3 mb-3">
      <span class="text-xl mt-1 shrink-0">{{ category.icon }}</span>
      <div class="min-w-0">
        <h1 class="font-sans font-extrabold text-[24px]" style="letter-spacing: -1.5px; line-height: 1.05; color: var(--color-text-primary)">
          {{ category.h1 }}
        </h1>
        <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">{{ toolCount }} tools</span>
      </div>
    </div>
    <p class="font-body text-[13px] leading-relaxed max-w-[720px]" style="color: var(--color-text-secondary)">
      {{ category.hero }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types/category'

defineProps<{
  category: Category
  toolCount: number
}>()
</script>
