<template>
  <div v-if="guides.length > 0" class="mt-12 mb-8">
    <h2 class="font-sans font-bold text-[15px] mb-4" style="letter-spacing: -0.3px; color: var(--color-text-primary)">
      How to Choose the Right {{ categoryTitle }} Tool
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="guide in guides"
        :key="guide.title"
        class="p-4 rounded-[10px]"
        :style="{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }"
      >
        <div class="flex items-start gap-3">
          <span class="text-lg mt-0.5 shrink-0">{{ guide.icon }}</span>
          <div class="min-w-0">
            <h3 class="font-sans font-semibold text-[13px] mb-1" style="letter-spacing: -0.2px; color: var(--color-text-primary)">
              {{ guide.title }}
            </h3>
            <p class="font-body text-[11px] leading-relaxed" style="color: var(--color-text-secondary)">
              {{ guide.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GuideItem } from '~/types/category'

defineProps<{
  guides: GuideItem[]
  categoryTitle: string
}>()
</script>
