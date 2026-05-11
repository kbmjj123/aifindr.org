<template>
  <NuxtLink :to="detailLink" class="tool-card group no-underline" :class="{ 'tool-card-featured': featured }">
    <div class="flex gap-3 pr-5">
      <!-- Logo -->
      <div class="tool-logo">
        {{ name[0] }}
      </div>

      <div class="flex-1 min-w-0">
        <!-- Top row: name, badges -->
        <div class="flex items-start gap-1.5 mb-0.5">
          <h3 class="tool-name flex-1 min-w-0">{{ name }}</h3>
          <div class="flex items-center gap-1 shrink-0">
            <ToolBadge v-if="featured" type="featured" />
            <ToolBadge v-if="verified" type="verified" />
          </div>
        </div>

        <!-- Description -->
        <p class="tool-desc">{{ description }}</p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="tag in visibleTags" :key="tag" class="tag">{{ tag }}</span>
          <span :class="['tag', `tag-${pricing}`]" class="tag-pricing">{{ pricingLabel }}</span>
        </div>
      </div>
    </div>

    <!-- External link (positioned absolute, outside flex flow) -->
    <a :href="website" target="_blank" rel="noopener noreferrer"
      class="card-ext-link absolute top-3 right-3 z-10" @click.stop>
      <svg viewBox="0 0 24 24">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

const props = withDefaults(defineProps<{
  name?: string
  description?: string
  website?: string
  slug?: string
  category?: string
  tags?: string[]
  pricing?: ToolPricing
  featured?: boolean
  verified?: boolean
}>(), {
  name: 'Tool Name',
  description: 'AI-powered tool description goes here.',
  website: 'https://example.com',
  slug: '',
  category: '',
  tags: () => ['ai', 'tool'],
  pricing: 'free',
  featured: false,
  verified: false,
})

const detailLink = computed(() => {
  if (props.slug && props.category) return `/tools/${props.category}/${props.slug}`
  return '#'
})

const pricingLabel = computed(() => {
  return props.pricing.charAt(0).toUpperCase() + props.pricing.slice(1)
})

const visibleTags = computed(() => {
  return props.tags?.slice(0, 3) || []
})
</script>
