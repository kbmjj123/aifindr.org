<template>
  <div class="min-h-screen" :style="{ background: 'var(--color-bg-base)' }">
    <!-- Minimal admin top bar -->
    <header class="h-12 flex items-center px-4 gap-3"
      :style="{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }">
      <span class="font-sans font-bold text-[13px] tracking-tight" style="color: var(--color-accent)">
        aifindr CMS
      </span>
      <span class="text-[10px] font-body" style="color: var(--color-text-muted)">|</span>
      <NuxtLink to="/" class="font-body text-[11px] hover:underline" style="color: var(--color-text-secondary)">
        &larr; Back to site
      </NuxtLink>
      <div class="ml-auto flex items-center gap-2">
        <span class="font-body text-[11px]" style="color: var(--color-text-muted)">
          {{ user?.username }}
        </span>
        <img v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="w-6 h-6 rounded-full"
          :style="{ border: '1px solid var(--color-border)' }" />
      </div>
    </header>
    <main class="max-w-360 mx-auto px-6 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser: checkAuth } = useAuth()

onMounted(() => checkAuth())
</script>
