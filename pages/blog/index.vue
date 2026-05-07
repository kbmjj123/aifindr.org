<template>
  <div>
    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Blog
    </h1>
    <p class="font-body text-[12px] mb-8" style="color: var(--color-text-muted)">
      Latest updates, tool reviews, and AI industry insights.
    </p>

    <div class="grid gap-3">
      <NuxtLink v-for="post in posts" :key="post.slug" :to="`/blog/${post.slug}`"
        class="block p-5 rounded-lg"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
        @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'">
        <h2 class="font-sans font-semibold text-[15px] mb-1" style="color: var(--color-text-primary)">
          {{ post.title }}
        </h2>
        <p class="font-body text-[12px] mb-2" style="color: var(--color-text-secondary)">
          {{ post.excerpt }}
        </p>
        <span class="font-body text-[10px]" style="color: var(--color-text-muted)">{{ post.date }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const posts = [
  { slug: 'welcome', title: 'Welcome to aifindr.org', excerpt: 'Our mission to build the best open-source AI tool directory.', date: 'May 1, 2026' },
  { slug: 'why-backlinks', title: 'Why Backlinks Matter for Your AI Tool', excerpt: 'How submitting to aifindr.org boosts your SEO.', date: 'May 3, 2026' },
]

useHead({
  title: 'Blog – aifindr.org',
})
</script>
