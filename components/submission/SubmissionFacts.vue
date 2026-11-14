<template>
  <div class="rounded-lg p-4" :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
    <div class="font-body text-[9px] uppercase tracking-[0.1em] mb-3" style="color: var(--color-text-muted)">
      Submission facts
    </div>
    <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
      <div v-for="row in rows" :key="row.label">
        <dt class="detail-sidebar-label">{{ row.label }}</dt>
        <dd class="detail-sidebar-value !mb-0">{{ row.value }}</dd>
      </div>
    </dl>
    <div class="mt-4 pt-3 font-body text-[10px] leading-relaxed"
      :style="{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
      {{ site.attribution }}
      <div v-if="checkedLabel" class="mt-2">
        Checked {{ checkedLabel }} · <span :style="{ color: availabilityColor }">{{ availabilityLabel }}</span>
      </div>
      <div v-if="prLabel" class="mt-1">
        Page rank updated {{ prLabel }} · Open PageRank
      </div>
      <a v-if="site.source_url" :href="site.source_url" target="_blank" rel="nofollow noopener noreferrer"
        class="block mt-2 no-underline" style="color: var(--color-text-link)">
        Source record ↗
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { METHOD_LABELS, PRICING_LABELS, type SubmissionMethod, type SubmissionPricing, type SubmissionSite } from '~/types/submissionSite'

const props = defineProps<{ site: SubmissionSite }>()

const availabilityLabel = computed(() => {
  if (props.site.availability === 'reachable') return 'reachable'
  if (props.site.availability === 'unreachable') return 'unreachable'
  return ''
})
const availabilityColor = computed(() =>
  props.site.availability === 'unreachable' ? 'var(--color-danger)' : 'var(--color-success)')
const checkedLabel = computed(() => {
  const raw = props.site.last_checked_at
  if (!raw) return ''
  // 形如 2026-11-20 03:30:00
  const [date] = raw.split(' ')
  const parts = date.split('-')
  if (parts.length !== 3) return raw
  return `${parts[0]}-${parts[1]}-${parts[2]}`
})
const prLabel = computed(() => {
  const raw = props.site.page_rank_checked_at
  if (!raw) return ''
  const [date] = raw.split(' ')
  const parts = date.split('-')
  if (parts.length !== 3) return raw
  return `${parts[0]}-${parts[1]}-${parts[2]}`
})

const rows = computed(() => {
  const s = props.site
  return [
    { label: 'Domain rating', value: s.domain_rating === null ? 'Not stated' : `${s.domain_rating} · Ahrefs snapshot` },
    { label: 'Page rank', value: s.page_rank === null ? 'Not ranked' : String(s.page_rank) },
    { label: 'Platform pricing', value: PRICING_LABELS[s.pricing as SubmissionPricing] ?? 'Unknown' },
    { label: 'Free submission', value: s.has_free_submission === 1 ? 'Yes' : s.has_free_submission === 0 ? 'No' : 'Unconfirmed' },
    { label: 'Approval', value: s.approval },
    { label: 'Link type', value: s.dofollow_link === 1 ? 'Dofollow' : s.dofollow_link === 0 ? 'Nofollow' : 'Not stated' },
    { label: 'Backlink / badge', value: s.backlink_required === 1 ? 'Required' : s.backlink_required === 0 ? 'Not required' : 'Not stated' },
    { label: 'Submission channel', value: METHOD_LABELS[s.submit_method as SubmissionMethod] ?? 'Not stated' },
    { label: 'Snapshot', value: s.source_snapshot || 'Unknown' },
  ]
})
</script>
