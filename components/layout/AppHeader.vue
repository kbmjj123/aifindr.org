<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-14"
    :style="{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)' }">
    <div class="mx-auto flex h-full items-center gap-4 px-4 lg:px-8 max-w-[1400px]">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <div class="w-4 h-4 rounded" style="background: var(--color-accent)" />
        <span class="text-sm font-semibold" style="color: var(--color-text-primary)">aifindr</span>
        <span class="text-sm" style="color: var(--color-text-muted)">.org</span>
      </NuxtLink>

      <!-- Desktop Search -->
      <div class="hidden md:flex flex-1 justify-center">
        <SearchBar />
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-3 ml-auto">
        <NuxtLink to="/submit" class="btn-primary flex items-center gap-1.5 text-xs h-8 px-3">
          + Submit Tool
        </NuxtLink>
        <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-bg-elevated)]"
          style="color: var(--color-text-secondary)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <!-- Mobile menu toggle -->
        <button class="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
          style="color: var(--color-text-secondary)" @click="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const isMobileMenuOpen = useState('mobileMenuOpen', () => false)
</script>
