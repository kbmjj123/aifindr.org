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
  title: 'aifindr.org – Discover 500+ AI Tools, Free & Open Source',
  meta: [
    { name: 'description', content: 'Open-source AI tool directory. Submit your tool, get free backlinks.' },
  ],
  script: [
    {
      innerHTML: `(function(){var p=localStorage.getItem('aifindr-theme');var t='dark';if(p==='light'||p==='dark')t=p;else if(p!=='auto'){var h=new Date().getHours();t=(h>=6&&h<18)?'light':'dark'}document.documentElement.setAttribute('data-theme',t)})()`,
      type: 'text/javascript',
      tagPosition: 'head',
    },
  ],
})
</script>
