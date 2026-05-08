<template>
  <component :is="linkComponent" :to="to" class="nav-item" :class="{ active: isActive }"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined">
    <span v-if="icon" class="w-4 h-4 flex items-center justify-center text-sm shrink-0">{{ icon }}</span>
    <span class="truncate">{{ label }}</span>
    <span v-if="count !== undefined" class="nav-count">{{ count }}</span>
  </component>
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

const linkComponent = computed(() => {
  if (isExternal.value) return 'a'
  return 'NuxtLink'
})

const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  const base = props.to.split('?')[0]
  return base !== undefined && route.path.startsWith(base)
})
</script>
