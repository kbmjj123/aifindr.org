<template>
  <NuxtLink :to="`/submission-lists/${list.slug}`" class="tool-card flex flex-col gap-2 no-underline">
    <div class="flex items-start justify-between gap-2">
      <h3 class="tool-name">{{ list.title }}</h3>
      <span class="badge badge-verified shrink-0">{{ list.item_count }}</span>
    </div>
    <p class="tool-desc !mb-0">{{ list.description }}</p>
    <span class="font-body text-[10px] uppercase tracking-[0.08em]" style="color: var(--color-text-muted)">
      {{ list.dimension }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { SubmissionList } from '~/types/submissionSite'

defineProps<{ list: Pick<SubmissionList, 'slug' | 'title' | 'description' | 'dimension' | 'item_count'> }>()
</script>
