<template>
  <NuxtLink :to="detailLink" class="tool-card min-w-[180px] lg:min-w-0 text-center no-underline block">
    <div class="flex flex-col items-center gap-2.5">
      <div class="tool-logo !w-9 !h-9 !rounded-[7px] !text-[11px]">
        <img v-if="t.cover_image" :src="t.cover_image" :alt="`${t.name} logo`" class="w-full h-full object-cover rounded-[7px]" />
        <span v-else class="font-sans font-bold text-[11px]" :style="{ color: 'var(--color-text-muted)' }">{{ (t.name || '?')[0] }}</span>
      </div>
      <div class="min-w-0 w-full">
        <h3 class="font-sans font-semibold text-[12px] truncate max-w-full" style="color: var(--color-text-primary)">
          {{ t.name }}
        </h3>
        <p class="font-body text-[10px] mt-0.5 line-clamp-2" style="color: var(--color-text-muted)">
          {{ t.meta_description || '' }}
        </p>
      </div>
      <span v-if="t.pricing" :class="['tag', `tag-${t.pricing}`]">{{ pricingLabel }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/tool'

const props = defineProps<{ tool: Tool }>()

const t = computed(() => props.tool)

const detailLink = computed(() => `/tools/${t.value.category}/${t.value.slug}`)

const pricingLabel = computed(() => {
  const p = t.value.pricing || 'free'
  return p.charAt(0).toUpperCase() + p.slice(1)
})
</script>
