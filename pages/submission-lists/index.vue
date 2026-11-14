<template>
  <div>
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <span class="current">Submission lists</span>
    </nav>

    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Submission lists
    </h1>
    <p class="font-body text-[13px] leading-relaxed mb-8 max-w-[700px]" style="color: var(--color-text-secondary)">
      {{ total }} focused slices of the directory. Each one is a filtered view with its own inclusion rule, sort order
      and a short explanation of when the list is useful. Lists are recalculated whenever the underlying snapshot is
      refreshed.
    </p>

    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">Loading lists...</div>
    <template v-else>
      <section v-for="group in groups" :key="group.dimension" class="mb-8">
        <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
          {{ SUBMISSION_DIMENSION_LABELS[group.dimension] }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          <SubmissionListCard v-for="list in group.lists" :key="list.slug" :list="list" />
        </div>
      </section>
    </template>

    <div class="mt-8 rounded-lg p-4 font-body text-[11px] leading-relaxed"
      :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: var_secondary }">
      Facts come from a 2026-11-13 public directory snapshot and are not independently verified by aifindr.org.
      All list descriptions, inclusion rules and explanatory text are written by aifindr.org.
      <div class="mt-2">
        <NuxtLink to="/backlink-sites" style="color: var(--color-text-link)">Browse the full directory →</NuxtLink>
        &nbsp;·&nbsp;
        <NuxtLink to="/backlink-sites/data" style="color: var(--color-text-link)">Download the open data →</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SUBMISSION_DIMENSION_LABELS, type ListDimension, type SubmissionList } from '~/types/submissionSite'

const { get } = useApi()
const var_secondary = 'var(--color-text-secondary)'

const { data, pending } = useAsyncData<{ lists: SubmissionList[] }>(
  'submission-lists-index',
  () => get<{ lists: SubmissionList[] }>('/api/submission-lists'),
  { default: () => ({ lists: [] }) },
)

const lists = computed(() => data.value?.lists ?? [])
const total = computed(() => lists.value.length)
const groups = computed(() => {
  const map = new Map<ListDimension, SubmissionList[]>()
  for (const list of lists.value) {
    const bucket = map.get(list.dimension) || []
    bucket.push(list)
    map.set(list.dimension, bucket)
  }
  return [...map.entries()].map(([dimension, items]) => ({ dimension, lists: items }))
})

usePageSeo({
  title: 'Submission Lists — Find Platforms by Cost, Link Type & Topic',
  template: 'prefix',
  description: 'Focused lists of product submission platforms: free dofollow sites, fast approvals, high domain rating sites and topic-specific directories.',
})
useHead({ link: [{ rel: 'canonical', href: 'https://aifindr.org/submission-lists' }] })
</script>
