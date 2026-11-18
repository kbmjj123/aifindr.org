<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-[52px]"
    :style="{ background: 'var(--color-header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)' }">
    <div class="relative flex h-full items-center gap-3 px-4 w-full">
      <!-- Left: Logo — shares the sidebar's left axis -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <img src="/web-app-manifest-192x192.png" alt="aifindr" class="logo-icon object-cover" />
        <span class="logo-text">aifindr<span class="org">.org</span></span>
      </NuxtLink>

      <!-- Center: Search — hidden at home top (hero has its own), fades in after scroll -->
      <Transition name="search-fade">
        <div v-if="showHeaderSearch"
          class="flex-1 hidden sm:flex justify-center lg:flex-none lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:w-[340px]">
          <SearchBar />
        </div>
      </Transition>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
        <!-- Desktop: Submit + Auth -->
        <button class="btn-header-submit hidden sm:inline-flex" @click="handleSubmitClick">
          + Submit
        </button>
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
const route = useRoute()
const isHome = computed(() => route.path === '/')
const scrollY = ref(0)
// hero 搜索条在 y≈318，滚过它（约 280px）后 header 搜索条淡入
const showHeaderSearch = computed(() => !isHome.value || scrollY.value > 280)

function onScroll() {
  scrollY.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const isMobileMenuOpen = useState('mobileMenuOpen', () => false)
const { isLoggedIn, login } = useAuth()

function handleSubmitClick() {
  if (isLoggedIn.value) {
    navigateTo('/submit')
  } else {
    sessionStorage.setItem('login-redirect', '/submit')
    login()
  }
}
</script>
