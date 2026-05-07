<template>
  <span class="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium border whitespace-nowrap"
    :style="badgeStyle">
    {{ icon }} {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  type: 'featured' | 'verified' | 'new'
}>()

const badgeConfig: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
  featured: { icon: '⭐', label: 'Featured', bg: 'var(--color-featured-bg)', text: 'var(--color-featured-text)', border: 'var(--color-featured-border)' },
  verified: { icon: '✓', label: 'Verified', bg: 'var(--color-verified-bg)', text: 'var(--color-verified-text)', border: 'var(--color-verified-border)' },
  new: { icon: '🆕', label: 'New', bg: 'var(--color-new-bg)', text: 'var(--color-new-text)', border: 'var(--color-new-border)' },
}

const config = computed(() => badgeConfig[props.type]!)
const icon = computed(() => config.value.icon)
const label = computed(() => config.value.label)
const badgeStyle = computed(() => ({
  background: config.value.bg,
  color: config.value.text,
  borderColor: config.value.border,
}))
</script>
