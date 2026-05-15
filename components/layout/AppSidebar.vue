<template>
  <!-- Desktop sidebar -->
  <aside class="hidden lg:block fixed left-0 top-[52px] bottom-0 w-[220px] overflow-y-auto px-3 py-5"
    :style="{ background: 'var(--color-bg-base)', borderRight: '1px solid var(--color-border)' }">

    <!-- Stats -->
    <div class="sidebar-stats">
      <div class="stat-item">
        <div class="stat-num">{{ stats }}</div>
        <div class="stat-label">Tools</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ categoriesCount }}</div>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">{{ contributors }}+</div>
        <div class="stat-label">Contributors</div>
      </div>
    </div>

    <!-- Main nav -->
    <div class="mb-1">
      <div class="nav-section-title">Browse</div>
      <NavItem v-for="item in mainNav" :key="item.label" :to="item.to" :icon="item.icon" :label="item.label" />
    </div>

    <!-- Categories -->
    <div class="mb-1">
      <div class="nav-section-title">Categories</div>
      <NavItem v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
        :icon="cat.emoji" :label="cat.name" />
    </div>

    <!-- Bottom links -->
    <div class="mt-6 pt-4" :style="{ borderTop: '1px solid var(--color-border)' }">
      <NavItem to="/submit" label="Submit a Tool" />
      <NavItem to="https://github.com/aifindr-org/aifindr.org" label="Open Source on GitHub" />
      <NavItem to="/blog" label="Blog" />
    </div>
  </aside>

  <!-- Mobile drawer -->
  <Teleport to="body">
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] lg:hidden">
      <div class="absolute inset-0" :style="{ background: 'rgba(0,0,0,0.6)' }" @click="isMobileMenuOpen = false" />
      <aside class="sidebar-drawer open px-3 py-4">
        <div class="flex items-center justify-between mb-4 px-3">
          <NuxtLink to="/" class="flex items-center gap-2" @click="isMobileMenuOpen = false">
            <div class="logo-icon">A</div>
            <span class="logo-text">aifindr</span>
          </NuxtLink>
          <button class="w-7 h-7 flex items-center justify-center rounded-md"
            style="color: var(--color-text-secondary)" @click="isMobileMenuOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="nav-section-title">Browse</div>
        <NavItem v-for="item in mainNav" :key="item.label" :to="item.to" :icon="item.icon" :label="item.label" @click="isMobileMenuOpen = false" />
        <div class="nav-section-title">Categories</div>
        <NavItem v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
          :icon="cat.emoji" :label="cat.name" @click="isMobileMenuOpen = false" />
        <div class="mt-6 pt-4" :style="{ borderTop: '1px solid var(--color-border)' }">
          <NavItem to="/submit" label="Submit a Tool" @click="isMobileMenuOpen = false" />
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const isMobileMenuOpen = useState('mobileMenuOpen')

const mainNav = [
  { label: 'Home', to: '/', icon: '🏠' },
  { label: 'Trending', to: '/tools?sort=trending', icon: '🔥' },
  { label: 'Featured', to: '/tools?sort=featured', icon: '⭐' },
  { label: 'New', to: '/tools?sort=latest', icon: '🆕' },
  { label: 'All Tools', to: '/tools', icon: '🔍' },
]

const categories = CATEGORIES

const stats = ref(0)
const categoriesCount = ref(0)
const contributors = ref(0)

useAsyncData('sidebar-stats', async () => {
  const data = await $fetch<{ tools: number; categories: number; contributors: number }>('/api/stats')
  if (data) {
    stats.value = data.tools
    categoriesCount.value = data.categories
    contributors.value = data.contributors
  }
  return data
}, { server: false })
</script>
