<template>
  <article class="tool-card group" :class="{ 'tool-card-featured': featured }">
    <div class="flex gap-3">
      <!-- Logo -->
      <div class="tool-logo">
        {{ name[0] }}
      </div>

      <div class="flex-1 min-w-0">
        <!-- Top row: name, badges, ext-link -->
        <div class="flex items-start gap-1.5 mb-0.5">
          <h3 class="tool-name flex-1 min-w-0">{{ name }}</h3>
          <div class="flex items-center gap-1 shrink-0">
            <ToolBadge v-if="featured" type="featured" />
            <ToolBadge v-if="verified" type="verified" />
          </div>
          <a :href="website" target="_blank" rel="noopener noreferrer"
            class="card-ext-link" @click.stop>
            <svg viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>

        <!-- Description -->
        <p class="tool-desc">{{ description }}</p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="tag in visibleTags" :key="tag" class="tag">{{ tag }}</span>
          <span :class="['tag', `tag-${pricing}`]">{{ pricingLabel }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

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
