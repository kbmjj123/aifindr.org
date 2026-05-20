<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-[52px]"
    :style="{ background: 'var(--color-header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)' }">
    <div class="mx-auto flex h-full items-center gap-3 sm:gap-4 px-4 lg:px-6 max-w-[1400px] w-full">
      <!-- Left: Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <div class="logo-icon">A</div>
        <span class="logo-text">aifindr<span class="org">.org</span></span>
      </NuxtLink>

      <!-- Center: Search (full bar desktop, compact icon mobile) -->
      <div class="flex-1 flex justify-center max-w-[420px] mx-auto">
        <div class="hidden sm:contents"><SearchBar /></div>
        <div class="sm:hidden ml-auto"><SearchBar compact /></div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <!-- Desktop: Submit + Auth -->
        <NuxtLink to="/submit" class="btn-header-submit hidden sm:inline-flex">
          + Submit
        </NuxtLink>
        <div class="hidden sm:flex"><AuthButton /></div>
        <ThemeToggle />
        <!-- Mobile hamburger -->
        <button class="lg:hidden flex items-center justify-center w-7 h-7 rounded-md shrink-0"
          style="color: var(--color-text-secondary)" @click="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
