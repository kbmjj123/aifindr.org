<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-[52px]"
    :style="{ background: 'var(--color-header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)' }">
    <div class="mx-auto flex h-full items-center gap-4 px-4 lg:px-6 max-w-[1400px]">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <div class="logo-icon">A</div>
        <span class="logo-text">aifindr<span class="org">.org</span></span>
      </NuxtLink>

      <!-- Desktop Search -->
      <div class="hidden md:flex flex-1 justify-center max-w-[340px] mx-auto">
        <SearchBar />
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <NuxtLink to="/submit" class="btn-header-submit !hidden sm:!inline-flex">
          + Submit Tool
        </NuxtLink>
        <AuthButton />
        <ThemeToggle />
        <!-- Mobile hamburger -->
        <button class="lg:hidden flex items-center justify-center w-7 h-7 rounded-md"
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
