<template>
  <div>
    <NuxtLink to="/blog" class="text-sm mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; Back to Blog
    </NuxtLink>

    <article>
      <h1 class="text-3xl font-bold mb-2" style="color: var(--color-text-primary)">{{ title }}</h1>
      <p class="text-sm mb-8" style="color: var(--color-text-muted)">{{ date }}</p>

      <div class="markdown-content">
        <p>Blog post content will be rendered here from Markdown.</p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const title = computed(() => slug.value.charAt(0).toUpperCase() + slug.value.slice(1))
const date = 'May 2026'

useHead({
  title: computed(() => `${title.value} | aifindr.org Blog`),
})
</script>
