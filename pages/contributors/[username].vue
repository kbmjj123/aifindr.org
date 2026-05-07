<template>
  <div>
    <NuxtLink to="/contributors" class="text-sm mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; All Contributors
    </NuxtLink>

    <div class="flex items-center gap-4 mb-8">
      <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        {{ (username[0] || 'U').toUpperCase() }}
      </div>
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">{{ username }}</h1>
        <a v-if="user?.website" :href="user.website" target="_blank"
          class="text-sm" style="color: var(--color-text-link)">
          {{ user.website.replace(/^https?:\/\//, '') }}
        </a>
        <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
          {{ user?.toolCount || 0 }} tools submitted
        </p>
      </div>
    </div>

    <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">Submitted Tools</h2>
    <ToolGrid>
      <ToolCard v-for="i in user?.toolCount || 3" :key="i" />
    </ToolGrid>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const username = computed(() => route.params.username as string)

const user = {
  username: username.value,
  website: 'https://example.com',
  toolCount: 3,
}

useHead({
  title: computed(() => `${username.value} – Contributor | aifindr.org`),
})
</script>
