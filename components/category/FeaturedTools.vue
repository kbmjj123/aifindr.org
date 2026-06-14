<template>
  <div v-if="tools.length > 0" class="mb-10">
    <h2 class="font-sans font-bold text-[15px] mb-3" style="letter-spacing: -0.3px; color: var(--color-text-primary)">
      ⭐ Editor's Pick
    </h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-[10px]">
      <article
        v-for="tool in tools.slice(0, 3)"
        :key="tool.slug"
        class="rounded-[10px] relative overflow-hidden transition-all duration-200"
        :style="{
          background: 'linear-gradient(135deg, var(--color-featured-bg) 0%, transparent 60%)',
          borderLeft: '2px solid var(--color-featured-text)',
          border: '1px solid var(--color-border)',
        }"
      >
        <NuxtLink
          :to="`/tools/${tool.category}/${tool.slug}`"
          class="flex items-start gap-3 p-4 no-underline"
        >
          <div
            class="w-[36px] h-[36px] rounded-[7px] flex items-center justify-center shrink-0 font-sans font-bold text-[11px] overflow-hidden"
            :style="{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }"
          >
            <img
              v-if="tool.logo"
              :src="tool.logo"
              :alt="`${tool.name} logo`"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ (tool.name || '?')[0] }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-sans font-semibold text-[13px] whitespace-nowrap overflow-hidden text-ellipsis" style="letter-spacing: -0.2px; color: var(--color-text-primary)">
                {{ tool.name }}
              </h3>
              <ToolBadge v-if="tool.featured" type="featured" />
            </div>
            <p class="font-body text-[11px] leading-relaxed mb-2" style="color: var(--color-text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              {{ tool.meta_description || '' }}
            </p>
            <div class="flex items-center gap-1.5 flex-wrap">
              <template v-for="tag in (tool.tags || []).filter(t => typeof t === 'string' || t.type === 'feature').slice(0, 2)" :key="typeof tag === 'string' ? tag : tag.tag">
                <span v-if="(typeof tag === 'string' ? tag : tag.type === 'feature')" class="tag">{{ typeof tag === 'string' ? tag : tag.tag }}</span>
              </template>
              <span v-if="tool.pricing" :class="['tag', `tag-${tool.pricing}`]">{{ tool.pricing }}</span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/tool'

defineProps<{
  tools: Tool[]
}>()
</script>
