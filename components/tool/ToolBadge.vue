<template>
  <span class="badge" :class="`badge-${type}`">
    {{ icon }} {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  type: 'featured' | 'verified' | 'new'
}>()

const badgeConfig: Record<string, { icon: string; label: string }> = {
  featured: { icon: '⭐', label: 'Featured' },
  verified: { icon: '✓', label: 'Verified' },
  new: { icon: '🆕', label: 'New' },
}

const config = badgeConfig[props.type]!
const icon = config.icon
const label = config.label
</script>
