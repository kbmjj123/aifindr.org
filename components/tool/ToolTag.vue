<template>
  <span :class="['tag', type ? `tag-${type}` : '']">
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { ToolPricing } from '~/types/tool'

defineProps<{
  type?: ToolPricing
}>()
</script>
