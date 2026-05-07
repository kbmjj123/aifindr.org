<template>
  <div class="min-h-screen">
    <AppHeader />
    <AppSidebar />
    <main class="pt-14 lg:ml-60">
      <div class="mx-auto max-w-[1160px] px-4 py-6 lg:px-8">
        <NuxtPage />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'aifindr.org – Discover 500+ AI Tools, Free & Open Source',
  meta: [
    { name: 'description', content: 'Open-source AI tool directory. Submit your tool, get free backlinks.' },
  ],
})
</script>
