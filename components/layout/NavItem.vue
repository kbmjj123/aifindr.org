<template>
  <NuxtLink v-if="!isExternal" :to="resolvedTo" class="nav-item" :class="{ active: isActive }"
    @click="handleClick">
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
const router = useRouter()
const isExternal = computed(() => props.to.startsWith('http'))
const emitClick = (e: MouseEvent) => emit('click', e)

// Parse to into { path, query, hash }
const parsed = computed(() => {
  const [pathAndQuery, hash] = props.to.split('#')
  const [path, rawQuery] = pathAndQuery.split('?')
  let p = path || '/'
  // Resolve relative hash anchors like "#trending" → path is current page
  if (props.to.startsWith('#') && !p.startsWith('/')) p = '/'
  const query = rawQuery ? Object.fromEntries(new URLSearchParams(rawQuery)) : undefined
  return { path: p, query, hash: hash || undefined }
})

const resolvedTo = computed(() => {
  const { path, query, hash } = parsed.value
  if (!query && !hash) return path
  return { path, query: query || undefined, hash: hash ? `#${hash}` : undefined }
})

function handleClick(e: MouseEvent) {
  const { hash } = parsed.value
  if (hash && route.path === '/') {
    e.preventDefault()
    router.replace({ hash: `#${hash}` })
  }
  emitClick(e)
}

const isActive = computed(() => {
  const { path: toPathRaw, hash: toHash, query } = parsed.value
  // 去掉尾斜杠但保留根路径 "/"（否则 "/" 变 "" 会让 Home 落到通用路径匹配，无视 hash 恒亮）
  const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p)
  const toPath = normalize(toPathRaw)
  const currentPath = normalize(route.path)

  // Hash anchor link first (Home 与 /#trending 共用 path "/"，必须先按 hash 区分)
  if (toHash) {
    return currentPath === toPath && route.hash === `#${toHash}`
  }

  // Home: active on '/' with no hash and no query
  if (toPath === '/') {
    return currentPath === '/' && !route.hash && !Object.keys(route.query).length
  }

  // Query params — exact match required
  if (query) {
    const matchAll = Object.entries(query).every(([k, v]) => route.query[k] === v)
    if (!matchAll) return false
  } else if (Object.keys(route.query).length > 0) {
    return false
  }

  // Path match
  if (toPath === currentPath) return true
  const toDepth = toPath.split('/').filter(Boolean).length
  if (toDepth >= 2 && currentPath.startsWith(toPath + '/')) return true
  return false
})
</script>
