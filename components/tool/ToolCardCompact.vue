<template>
  <article class="tool-card min-w-[180px] lg:min-w-0 text-center">
    <div class="flex flex-col items-center gap-2.5">
      <div class="tool-logo !w-9 !h-9 !rounded-[7px] !text-[11px]">
        {{ name[0] }}
      </div>
      <div class="min-w-0 w-full">
        <h3 class="font-sans font-semibold text-[12px] truncate max-w-full" style="color: var(--color-text-primary)">
          {{ name }}
        </h3>
        <p class="font-body text-[10px] mt-0.5 line-clamp-2" style="color: var(--color-text-muted)">
          {{ description }}
        </p>
      </div>
      <span :class="['tag', `tag-${pricing}`]">{{ pricingLabel }}</span>
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
