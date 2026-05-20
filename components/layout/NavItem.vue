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
  const currentUrl = new URL(route.fullPath, 'https://aifindr.org')
  // Nav item has query params → require exact path + query match
  if (toUrl.search) {
    return currentUrl.pathname + currentUrl.search === toUrl.pathname + toUrl.search
  }
  // Nav item has NO query → only active if current URL also has no query
  if (currentUrl.search) return false
  // Match /tools, /tools/image, /tools/image/midjourney
  const normalized = toUrl.pathname.endsWith('/') ? toUrl.pathname.slice(0, -1) : toUrl.pathname
  return currentUrl.pathname === normalized || currentUrl.pathname.startsWith(normalized + '/')
})
</script>
