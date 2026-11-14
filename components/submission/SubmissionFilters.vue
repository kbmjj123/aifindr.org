<template>
  <div class="rounded-lg p-4" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <input
        class="input sm:min-w-[220px] sm:flex-1"
        :value="model.q"
        type="search"
        placeholder="Search a platform or domain..."
        aria-label="Search submission platforms"
        @input="set('q', ($event.target as HTMLInputElement).value)"
      />
      <select class="select sm:w-auto sm:min-w-[130px]" :value="model.pricing" aria-label="Pricing"
        @change="set('pricing', ($event.target as HTMLSelectElement).value)">
        <option value="">All pricing</option>
        <option value="free">Free ({{ facets.pricing.free ?? 0 }})</option>
        <option value="freemium">Freemium ({{ facets.pricing.freemium ?? 0 }})</option>
        <option value="paid">Paid ({{ facets.pricing.paid ?? 0 }})</option>
      </select>
      <select class="select sm:w-auto sm:min-w-[130px]" :value="model.dofollow" aria-label="Link type"
        @change="set('dofollow', ($event.target as HTMLSelectElement).value)">
        <option value="">Any link type</option>
        <option value="yes">Dofollow ({{ facets.dofollow.yes ?? 0 }})</option>
        <option value="no">Nofollow ({{ facets.dofollow.no ?? 0 }})</option>
      </select>
      <select class="select sm:w-auto sm:min-w-[145px]" :value="model.backlink" aria-label="Backlink requirement"
        @change="set('backlink', ($event.target as HTMLSelectElement).value)">
        <option value="">Any requirement</option>
        <option value="no">No backlink ({{ facets.backlinkRequired.no ?? 0 }})</option>
        <option value="yes">Backlink required ({{ facets.backlinkRequired.yes ?? 0 }})</option>
      </select>
      <select class="select sm:w-auto sm:min-w-[140px]" :value="model.approval" aria-label="Approval speed"
        @change="set('approval', ($event.target as HTMLSelectElement).value)">
        <option value="">Any approval time</option>
        <option value="fast">Within 2 days ({{ facets.approvalBucket.fast ?? 0 }})</option>
        <option value="week">Within a week ({{ facets.approvalBucket.week ?? 0 }})</option>
        <option value="month">Within a month ({{ facets.approvalBucket.month ?? 0 }})</option>
        <option value="slow">Longer ({{ facets.approvalBucket.slow ?? 0 }})</option>
      </select>
      <select class="select sm:w-auto sm:min-w-[140px]" :value="model.method" aria-label="Submission channel"
        @change="set('method', ($event.target as HTMLSelectElement).value)">
        <option value="">Any channel</option>
        <option value="form">Online form</option>
        <option value="github_pr">GitHub PR</option>
        <option value="awesome_list">Awesome list</option>
        <option value="sign_in">Sign-in required</option>
        <option value="community_post">Community post</option>
        <option value="external">External page</option>
      </select>
      <select class="select sm:w-auto sm:min-w-[170px]" :value="model.category" aria-label="Topic"
        @change="set('category', ($event.target as HTMLSelectElement).value)">
        <option value="">All topics</option>
        <option v-for="option in categoryOptions" :key="option.slug" :value="option.slug">
          {{ option.name }} ({{ option.count }})
        </option>
      </select>
      <select class="select sm:w-auto sm:min-w-[150px]" :value="model.sort" aria-label="Sort order"
        @change="set('sort', ($event.target as HTMLSelectElement).value)">
        <option value="dr">Highest DR first</option>
        <option value="fast">Fastest approval</option>
        <option value="featured">Featured first</option>
        <option value="name">Name A–Z</option>
      </select>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 font-body text-[11px] cursor-pointer" style="color: var(--color-text-secondary)">
        <input type="checkbox" :checked="model.free === 'yes'" @change="set('free', ($event.target as HTMLInputElement).checked ? 'yes' : '')" />
        Free to submit
      </label>
      <span class="font-body text-[11px]" style="color: var(--color-text-muted)">
        {{ facets.total }} platforms · {{ facets.withSubmitUrl }} with a direct submission link
      </span>
      <button class="btn-ghost ml-auto" type="button" @click="emit('reset')">Clear filters</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SUBMISSION_CATEGORIES, type SubmissionFacets, type SubmissionFilterState } from '~/types/submissionSite'

const model = defineModel<SubmissionFilterState>({ required: true })
const props = defineProps<{ facets: SubmissionFacets }>()
const emit = defineEmits<{ reset: [] }>()

/** 直接由 D1 的 site_categories 聚合驱动，后台新增分类会自动出现 */
const categoryOptions = computed(() => {
  const labels = new Map(SUBMISSION_CATEGORIES.map(item => [item.slug, item.name]))
  return Object.entries(props.facets.categories || {})
    .map(([slug, count]) => ({ slug, name: labels.get(slug) || slug.replace(/-/g, ' '), count }))
    .sort((a, b) => b.count - a.count)
})

function set(key: keyof SubmissionFilterState, value: string) {
  model.value = { ...model.value, [key]: value }
}
</script>
