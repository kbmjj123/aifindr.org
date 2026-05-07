<template>
  <article class="tool-card min-w-[180px] lg:min-w-0">
    <div class="flex flex-col items-center text-center gap-2">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        {{ name[0] }}
      </div>
      <div class="min-w-0">
        <h3 class="text-sm font-semibold truncate max-w-full" style="color: var(--color-text-primary)">
          {{ name }}
        </h3>
        <p class="text-xs mt-0.5 line-clamp-2" style="color: var(--color-text-muted)">
          {{ description }}
        </p>
      </div>
      <ToolTag :type="pricing">{{ pricingLabel }}</ToolTag>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

withDefaults(defineProps<{
  name?: string
  description?: string
  pricing?: ToolPricing
}>(), {
  name: 'Tool Name',
  description: 'Brief description',
  pricing: 'free',
})

const pricingLabel = 'Free'
</script>
