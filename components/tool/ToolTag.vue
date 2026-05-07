<template>
  <span class="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap border"
    :style="tagStyle">
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

const props = defineProps<{
  type?: ToolPricing
}>()

const pricingStyles: Record<ToolPricing, { bg: string; text: string; border: string }> = {
  free: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  freemium: { bg: 'rgba(6,182,212,0.1)', text: '#06b6d4', border: 'rgba(6,182,212,0.2)' },
  paid: { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
}

const tagStyle = computed(() => {
  if (!props.type) {
    return {
      background: 'var(--color-bg-elevated)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border)',
    }
  }
  const s = pricingStyles[props.type]
  return { background: s.bg, color: s.text, borderColor: s.border }
})
</script>
