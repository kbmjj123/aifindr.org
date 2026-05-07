<template>
  <article class="tool-card group">
    <div class="flex gap-3">
      <div class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-semibold text-sm"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        {{ name[0] }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold truncate" style="color: var(--color-text-primary)">
            {{ name }}
          </h3>
          <div class="flex gap-1 ml-auto shrink-0">
            <ToolBadge v-if="featured" type="featured" />
            <ToolBadge v-if="verified" type="verified" />
          </div>
          <a :href="website" target="_blank" rel="noopener noreferrer"
            class="shrink-0" style="color: var(--color-text-muted)"
            @click.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
        <p class="text-xs leading-relaxed line-clamp-2 mb-2" style="color: var(--color-text-secondary)">
          {{ description }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <ToolTag v-for="tag in visibleTags" :key="tag">{{ tag }}</ToolTag>
          <ToolTag :type="pricing">{{ pricingLabel }}</ToolTag>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

// Placeholder props — will be replaced with real Tool data
withDefaults(defineProps<{
  name?: string
  description?: string
  website?: string
  tags?: string[]
  pricing?: ToolPricing
  featured?: boolean
  verified?: boolean
}>(), {
  name: 'Tool Name',
  description: 'AI-powered tool description goes here.',
  website: 'https://example.com',
  tags: () => ['ai', 'tool'],
  pricing: 'free',
  featured: false,
  verified: false,
})

const pricingLabel = 'Free'
const visibleTags = ['ai', 'tool']
</script>
