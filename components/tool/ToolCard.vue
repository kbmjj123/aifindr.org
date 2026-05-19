<template>
  <NuxtLink :to="detailLink" class="tool-card group no-underline" :class="{ 'tool-card-featured': t.featured }">
    <div class="flex gap-3 pr-5">
      <!-- Logo / Icon -->
      <div class="tool-logo">
        <img v-if="t.cover_image" :src="t.cover_image" :alt="`${t.name} logo`" class="w-full h-full object-cover rounded-[7px]" />
        <span v-else class="font-sans font-bold text-[11px]" :style="{ color: 'var(--color-text-muted)' }">{{ (t.name || '?')[0] }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Top row: name, badges -->
        <div class="flex items-start gap-1.5 mb-0.5">
          <h3 class="tool-name flex-1 min-w-0">{{ t.name }}</h3>
          <div class="flex items-center gap-1 shrink-0">
            <ToolBadge v-if="t.featured" type="featured" />
            <ToolBadge v-if="t.verified" type="verified" />
            <span v-if="t.has_free_trial" class="badge badge-verified" style="font-size: 9px;">Free Trial</span>
          </div>
        </div>

        <!-- Description -->
        <p class="tool-desc">{{ t.meta_description || '' }}</p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="tag in visibleTags" :key="tag" class="tag">{{ tag }}</span>
          <span v-if="t.pricing" :class="['tag', `tag-${t.pricing}`]" class="tag-pricing">{{ pricingLabel }}</span>
        </div>
      </div>
    </div>

    <!-- External link icon -->
    <div class="absolute top-3 right-3 card-ext-link opacity-0 group-hover:opacity-100 transition-opacity">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/tool'

const props = defineProps<{ tool: Tool }>()

const t = computed(() => props.tool)

const detailLink = computed(() => `/tools/${t.value.category}/${t.value.slug}`)

const visibleTags = computed(() => {
  const tags = t.value.tags
  if (!tags) return []
  if (Array.isArray(tags)) return tags.slice(0, 3)
  return String(tags).split(',').slice(0, 3).filter(Boolean)
})

const pricingLabel = computed(() => {
  const p = t.value.pricing || 'free'
  return p.charAt(0).toUpperCase() + p.slice(1)
})
</script>
