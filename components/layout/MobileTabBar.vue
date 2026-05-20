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
  { label: 'Submit', to: '/submit', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
  { label: 'Profile', to: '/settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
]

function isActive(to: string) {
  const [toPath, toQuery] = to.split('?')

  if (toPath === '/') return route.path === '/'

  if (toQuery) {
    const params = new URLSearchParams(toQuery)
    const active = Array.from(params.entries()).every(([k, v]) => route.query[k] === v)
    if (!active) return false
  }

  if (toPath === '/tools' || toPath === '/settings') return route.path.startsWith(toPath)

  return route.path === toPath || route.path.startsWith(toPath + '/')
}
</script>
