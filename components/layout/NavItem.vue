<template>
  <NuxtLink :to="to" class="nav-item" :class="{ active: isActive }"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined">
    <span v-if="icon" class="w-4 h-4 flex items-center justify-center text-sm">{{ icon }}</span>
    <span>{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string
  label: string
  icon?: string
}>()

const route = useRoute()
const isExternal = computed(() => props.to.startsWith('http'))
const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  return route.path.startsWith(props.to)
})
</script>
