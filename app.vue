<template>
  <div class="min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
    <AppHeader />
    <AppSidebar />
    <main class="pt-13 lg:pl-55">
      <div class="mx-auto max-w-350 px-6 py-6">
        <NuxtPage />
      </div>
    </main>
    <AppFooter />
    <!-- Mobile tab bar -->
    <MobileTabBar />
    <!-- Search Modal -->
    <SearchModal />
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s',
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ],
  meta: [
    { name: 'description', content: 'Open-source AI tool directory. Submit your tool, get free backlinks.' },
    { name: 'theme-color', content: '#080808' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
  ],
  script: [
    {
      src: 'https://cloud.umami.is/script.js',
      'data-website-id': '0521130a-ecf4-4412-9546-26c4adf2c4bd',
      defer: true,
    },
    {
      // Capture OAuth token from URL BEFORE Nuxt hydration clears query params
      innerHTML: `(function(){var p=new URLSearchParams(window.location.search).get('token');if(p){localStorage.setItem('aifindr-token',p);var u=new URL(window.location);u.searchParams.delete('token');window.history.replaceState({},'',u.toString())}})()`,
      type: 'text/javascript',
      tagPosition: 'head',
    },
    {
      innerHTML: `(function(){var p=localStorage.getItem('aifindr-theme');var t='dark';if(p==='light'||p==='dark')t=p;else if(p!=='auto'){var h=new Date().getHours();t=(h>=6&&h<18)?'light':'dark'}document.documentElement.setAttribute('data-theme',t)})()`,
      type: 'text/javascript',
      tagPosition: 'head',
    },
  ],
})

const { handleUrlToken } = useAuth()
useKeyboardShortcuts()

onMounted(() => {
  handleUrlToken()

  // 登录后重定向到之前要访问的页面
  const redirect = sessionStorage.getItem('login-redirect')
  if (redirect) {
    sessionStorage.removeItem('login-redirect')
    navigateTo(redirect)
  }

  // 清除历史项目遗留的 Service Worker，防止缓存干扰
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister())
    })
  }
})
</script>
