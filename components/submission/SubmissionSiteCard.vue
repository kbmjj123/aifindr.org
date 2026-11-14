<template>
  <article class="tool-card flex flex-col gap-2">
    <div class="flex items-start gap-2">
      <NuxtLink :to="`/backlink-sites/${site.slug}`" class="tool-name flex-1 min-w-0 no-underline hover:underline">
        {{ site.name }}
      </NuxtLink>
      <span v-if="site.domain_rating !== null" class="badge badge-new shrink-0">DR {{ site.domain_rating }}</span>
    </div>

    <p class="tool-desc !mb-0">{{ site.editorial || site.summary }}</p>

    <div class="flex flex-wrap gap-1.5">
      <span v-if="site.pricing" :class="['tag', pricingClass ? `tag-${pricingClass}` : '']" class="tag-pricing">{{ pricingLabel }}</span>
      <span v-if="site.dofollow_link !== null" class="tag">{{ site.dofollow_link ? 'dofollow' : 'nofollow' }}</span>
      <span v-if="site.backlink_required === 0" class="tag">no badge</span>
      <span v-if="site.approval_bucket === 'fast'" class="tag">fast approval</span>
    </div>

    <div class="mt-auto flex items-center gap-2 pt-1">
      <NuxtLink :to="`/backlink-sites/${site.slug}`" class="font-body text-[11px] no-underline"
        style="color: var(--color-text-link)">
        Details →
      </NuxtLink>
      <a v-if="site.submit_url" :href="site.submit_url" target="_blank" rel="nofollow noopener noreferrer"
        class="font-body text-[11px] ml-auto no-underline" style="color: var(--color-text-link)">
        Go to submit ↗
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { PRICING_LABELS, type SubmissionPricing, type SubmissionSite } from '~/types/submissionSite'

const props = defineProps<{ site: SubmissionSite }>()

const pricingClass = computed(() => {
  const value = props.site.pricing as SubmissionPricing
  return value === 'free' || value === 'freemium' || value === 'paid' ? value : ''
})
const pricingLabel = computed(() => PRICING_LABELS[props.site.pricing as SubmissionPricing] ?? 'Unknown')
</script>
