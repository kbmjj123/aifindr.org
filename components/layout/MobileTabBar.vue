<template>
  <nav class="sm:hidden mobile-tabbar flex">
    <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to"
      class="mobile-tab" :class="{ active: isActive(tab.to) }">
      <span v-html="tab.icon"></span>
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Home', to: '/', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { label: 'Browse', to: '/tools', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' },
  { label: 'Sites', to: '/backlink-sites', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>' },
  { label: 'Submit', to: '/submit', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
]

function isActive(to: string) {
  const [toPath, toQuery] = to.split('?')

  if (toPath === '/') return route.path === '/'

  if (toQuery) {
    const params = new URLSearchParams(toQuery)
    const active = Array.from(params.entries()).every(([k, v]) => route.query[k] === v)
    if (!active) return false
  }

  if (toPath === '/tools') return route.path.startsWith(toPath)

  if (toPath === '/backlink-sites') {
    return route.path === toPath || route.path.startsWith(toPath + '/') || route.path.startsWith('/submission-lists')
  }

  return route.path === toPath || route.path.startsWith(toPath + '/')
}
</script>
