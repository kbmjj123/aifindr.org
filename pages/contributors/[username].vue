<template>
  <div>
    <NuxtLink to="/contributors" class="font-body text-[11px] mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; All Contributors
    </NuxtLink>

    <div class="flex items-center gap-4 mb-8">
      <div class="w-20 h-20 rounded-full flex items-center justify-center font-sans font-bold text-[22px]"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        {{ (username[0] || 'U').toUpperCase() }}
      </div>
      <div>
        <h1 class="font-sans font-bold text-[22px] tracking-tight" style="color: var(--color-text-primary)">
          {{ username }}</h1>
        <a v-if="user?.website" :href="user.website" target="_blank"
          class="font-body text-[12px]" style="color: var(--color-text-link)">
          {{ user.website.replace(/^https?:\/\//, '') }}
        </a>
        <p class="font-body text-[12px] mt-1" style="color: var(--color-text-secondary)">
          {{ user?.toolCount || 0 }} tools submitted
        </p>
      </div>
    </div>

    <h2 class="font-sans font-bold text-[15px] mb-4" style="color: var(--color-text-primary)">
      Submitted Tools
    </h2>
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

usePageSeo(() => ({
  title: `${username.value} – Contributor`,
  template: 'prefix',
  description: `AI tools submitted by ${username.value} on aifindr.org.`,
}))
</script>
