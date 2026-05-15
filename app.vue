<template>
  <div class="min-h-screen">
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
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [　
    { name: 'description', content: 'Open-source AI tool directory. Submit your tool, get free backlinks.' },
  ],
  script: [
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

onMounted(() => {
  handleUrlToken()
})
</script>
