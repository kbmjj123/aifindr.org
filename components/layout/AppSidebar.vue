<template>
  <!-- Desktop sidebar -->
  <aside class="hidden lg:block fixed left-0 top-14 bottom-0 w-60 overflow-y-auto px-3 py-4"
    :style="{ background: 'var(--color-bg-base)', borderRight: '1px solid var(--color-border)' }">

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-2 pb-4 mb-4 text-center"
      :style="{ borderBottom: '1px solid var(--color-border)' }">
      <div>
        <div class="text-base font-bold" style="color: var(--color-text-primary)">500+</div>
        <div class="text-xs" style="color: var(--color-text-muted)">Tools</div>
      </div>
      <div>
        <div class="text-base font-bold" style="color: var(--color-text-primary)">12</div>
        <div class="text-xs" style="color: var(--color-text-muted)">Categories</div>
      </div>
      <div>
        <div class="text-base font-bold" style="color: var(--color-text-primary)">50+</div>
        <div class="text-xs" style="color: var(--color-text-muted)">Contributors</div>
      </div>
    </div>

    <!-- Main nav -->
    <div class="mb-4">
      <div class="text-xs font-medium uppercase tracking-widest px-3 mb-2" style="color: var(--color-text-muted)">
        Browse
      </div>
      <NavItem v-for="item in mainNav" :key="item.label" :to="item.to" :icon="item.icon" :label="item.label" />
    </div>

    <!-- Categories -->
    <div class="mb-4">
      <div class="text-xs font-medium uppercase tracking-widest px-3 mb-2" style="color: var(--color-text-muted)">
        Categories
      </div>
      <NavItem v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
        :icon="cat.emoji" :label="cat.name" />
    </div>

    <!-- Bottom links -->
    <div class="mt-auto pt-4" :style="{ borderTop: '1px solid var(--color-border)' }">
      <NavItem to="/submit" label="Submit a Tool" />
      <NavItem to="https://github.com/aifindr-org/aifindr.org" label="Open Source on GitHub" />
      <NavItem to="/blog" label="Blog" />
    </div>
  </aside>

  <!-- Mobile drawer -->
  <Teleport to="body">
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] lg:hidden">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
      <aside class="relative w-72 max-w-[80vw] h-full overflow-y-auto px-3 py-4"
        :style="{ background: 'var(--color-bg-base)', borderRight: '1px solid var(--color-border)' }"
        style="animation: slideIn 250ms ease">
        <!-- Same content as desktop sidebar but simpler -->
        <div class="flex items-center justify-between mb-4 px-3">
          <NuxtLink to="/" class="flex items-center gap-2" @click="isMobileMenuOpen = false">
            <div class="w-4 h-4 rounded" style="background: var(--color-accent)" />
            <span class="text-sm font-semibold" style="color: var(--color-text-primary)">aifindr</span>
          </NuxtLink>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg"
            style="color: var(--color-text-secondary)" @click="isMobileMenuOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <NavItem v-for="item in mainNav" :key="item.label" :to="item.to" :icon="item.icon" :label="item.label" @click="isMobileMenuOpen = false" />
        <div class="text-xs font-medium uppercase tracking-widest px-3 my-2 mt-4" style="color: var(--color-text-muted)">
          Categories
        </div>
        <NavItem v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
          :icon="cat.emoji" :label="cat.name" @click.native="isMobileMenuOpen = false" />
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
</script>

<style scoped>
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
</style>
