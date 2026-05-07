<template>
  <div class="skeleton" :style="{ width, height, borderRadius: radius }" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  height?: string
  radius?: string
}>(), {
  width: '100%',
  height: '20px',
  radius: '4px',
})
</script>
