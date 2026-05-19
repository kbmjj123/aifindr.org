<template>
  <NuxtLink :to="detailLink" class="tool-card min-w-[180px] lg:min-w-0 text-center no-underline block">
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
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

const props = withDefaults(defineProps<{
  name?: string
  slug?: string
  category?: string
  description?: string
  pricing?: ToolPricing
}>(), {
  name: 'Tool Name',
  slug: '',
  category: 'other',
  description: 'Brief description',
  pricing: 'free',
})

const detailLink = computed(() => `/tools/${props.category}/${props.slug}`)

const pricingLabel = computed(() => {
  const p = props.pricing
  return p.charAt(0).toUpperCase() + p.slice(1)
})
</script>
