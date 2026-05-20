<template>
  <NuxtLink v-if="!isExternal" :to="to" class="nav-item" :class="{ active: isActive }" @click="emitClick">
    <span v-if="icon" class="w-4 h-4 flex items-center justify-center text-sm shrink-0">{{ icon }}</span>
    <span class="truncate">{{ label }}</span>
    <span v-if="count !== undefined" class="nav-count">{{ count }}</span>
  </NuxtLink>
  <a v-else :href="to" target="_blank" rel="noopener noreferrer" class="nav-item" @click="emitClick">
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

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const route = useRoute()
const isExternal = computed(() => props.to.startsWith('http'))
const emitClick = (e: MouseEvent) => emit('click', e)

const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'

  const toUrl = new URL(props.to, 'https://aifindr.org')
  const toPath = toUrl.pathname.endsWith('/') ? toUrl.pathname.slice(0, -1) : toUrl.pathname
  const currentPath = route.path.endsWith('/') ? route.path.slice(0, -1) : route.path

  // Nav has query → must match path AND query params exactly
  if (toUrl.search) {
    const toParams = new URLSearchParams(toUrl.search)
    const matchAll = Array.from(toParams.entries()).every(([k, v]) => route.query[k] === v)
    if (!matchAll) return false
  } else {
    // Nav has NO query → only active if current URL also has NO query
    if (Object.keys(route.query).length > 0) return false
  }

  // Exact path match
  if (toPath === currentPath) return true
  // Prefix match: only if nav item has 2+ segments (e.g. /tools/image matches /tools/image/midjourney)
  // Single-segment roots like /tools do NOT match children (/tools/image)
  const toDepth = toPath.split('/').filter(Boolean).length
  if (toDepth >= 2 && currentPath.startsWith(toPath + '/')) return true
  return false
})
</script>
