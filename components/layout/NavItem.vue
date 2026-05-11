<template>
  <NuxtLink v-if="!isExternal" :to="to" class="nav-item" :class="{ active: isActive }">
    <span v-if="icon" class="w-4 h-4 flex items-center justify-center text-sm shrink-0">{{ icon }}</span>
    <span class="truncate">{{ label }}</span>
    <span v-if="count !== undefined" class="nav-count">{{ count }}</span>
  </NuxtLink>
  <a v-else :href="to" target="_blank" rel="noopener noreferrer" class="nav-item">
    <span v-if="icon" class="w-4 h-4 flex items-center justify-center text-sm shrink-0">{{ icon }}</span>
    <span class="truncate">{{ label }}</span>
    <span v-if="count !== undefined" class="nav-count">{{ count }}</span>
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string
  label: string
  icon?: string
  count?: number
}>()

const route = useRoute()
const isExternal = computed(() => props.to.startsWith('http'))

const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  const base = props.to.split('?')[0]
  return base !== undefined && route.path.startsWith(base)
})
</script>
