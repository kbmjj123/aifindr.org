<template>
  <div v-if="parsedTiers.length" class="space-y-1.5">
    <div v-for="(tier, i) in parsedTiers" :key="i"
      class="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px]"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <div class="min-w-0 flex-1">
        <span class="font-medium" style="color: var(--color-text-primary)">{{ tier.name }}</span>
        <span v-if="tier.features?.length" class="ml-1.5 font-body" style="color: var(--color-text-muted)">
          {{ tier.features.join(', ') }}
        </span>
      </div>
      <span class="shrink-0 ml-2 font-medium" style="color: var(--color-accent)">
        {{ formatPrice(tier) }}
      </span>
    </div>
  </div>
  <p v-else-if="fallback" class="font-body text-[12px]" style="color: var(--color-text-secondary)">
    {{ fallback }}
  </p>
</template>

<script setup lang="ts">
export interface PriceTier {
  name: string
  type?: 'free' | 'subscription' | 'credits' | 'usage' | 'custom'
  price?: number | null
  period?: string | null
  credits?: number | null
  unit?: string | null
  features?: string[]
}

const props = defineProps<{
  tiers?: PriceTier[] | string | null
  fallback?: string | null
}>()

const parsedTiers = computed<PriceTier[]>(() => {
  if (!props.tiers) return []
  if (Array.isArray(props.tiers)) return props.tiers
  try { return JSON.parse(props.tiers) as PriceTier[] } catch { return [] }
})

function formatPrice(tier: PriceTier): string {
  if (tier.type === 'free' || (tier.price === 0 && !tier.credits)) return 'Free'
  if (tier.type === 'custom' || tier.price == null) return 'Contact us'
  if (tier.type === 'credits' && tier.credits) {
    const p = tier.price ? `$${tier.price}` : ''
    return tier.price ? `${tier.credits} credits / ${p}` : `${tier.credits} credits`
  }
  if (tier.type === 'usage' && tier.unit) return `$${tier.price}/${tier.unit}`
  const p = `$${tier.price}`
  if (tier.period === 'one-time') return `${p} one-time`
  if (tier.period) return `${p}/${tier.period}`
  if (tier.price) return `From ${p}`
  return 'Free'
}
</script>
