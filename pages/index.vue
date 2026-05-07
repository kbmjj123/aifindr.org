<template>
  <!-- Hero -->
  <section class="py-12 lg:py-16 text-center lg:text-left">
    <h1 class="text-3xl sm:text-4xl font-bold leading-tight"
      style="color: var(--color-text-primary)">
      Discover 500+ AI Tools, Handpicked for You.
    </h1>
    <p class="mt-3 text-base" style="color: var(--color-text-secondary)">
      Open-source directory. Submit your tool, get free backlinks.
    </p>
    <div class="mt-6 max-w-[560px] mx-auto lg:mx-0">
      <SearchBar :expanded="true" />
    </div>
  </section>

  <!-- Trending -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">🔥 Trending</h2>
        <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">Most viewed this week</p>
      </div>
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:gap-3 scrollbar-none">
      <ToolCardCompact v-for="i in 8" :key="i" />
    </div>
  </section>

  <!-- Featured -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">⭐ Featured Tools</h2>
      <span class="text-xs" style="color: var(--color-text-muted)">Sponsored</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ToolCard v-for="i in 4" :key="i" :featured="true" />
    </div>
  </section>

  <!-- Browse by Category -->
  <section class="mb-10">
    <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary)">Browse by Category</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLink v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
        class="flex items-center gap-3 px-4 rounded-xl"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', height: '72px' }"
        @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'">
        <span class="text-2xl">{{ cat.emoji }}</span>
        <div>
          <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ cat.name }}</div>
          <div class="text-xs" style="color: var(--color-text-muted)">{{ Math.floor(Math.random() * 50) + 5 }} tools</div>
        </div>
      </NuxtLink>
    </div>
  </section>

  <!-- Recently Added -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">🆕 Recently Added</h2>
      <NuxtLink to="/tools" class="text-sm font-medium" style="color: var(--color-accent-light)">
        View all tools &rarr;
      </NuxtLink>
    </div>
    <ToolGrid>
      <ToolCard v-for="i in 20" :key="i" />
    </ToolGrid>
  </section>

  <!-- Submit CTA -->
  <section class="rounded-xl text-center py-10 px-8 mb-10"
    :style="{
      background: 'linear-gradient(rgba(79,70,229,0.08), rgba(79,70,229,0.02))',
      border: '1px solid rgba(79,70,229,0.2)'
    }">
    <h2 class="text-2xl font-bold mb-2" style="color: var(--color-text-primary)">
      Get 3 Free Backlinks for Your Tool
    </h2>
    <p class="text-sm mb-6" style="color: var(--color-text-secondary)">
      Submit your AI tool and get listed on GitHub (DA 100), aifindr.org, and your contributor page.
    </p>
    <div class="flex flex-wrap justify-center gap-6 mb-6">
      <div class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary)">
        <span style="color: var(--color-success)">✓</span> github.com <span class="text-xs" style="color: var(--color-text-muted)">DA 100</span>
      </div>
      <div class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary)">
        <span style="color: var(--color-success)">✓</span> aifindr.org <span class="text-xs" style="color: var(--color-text-muted)">DA growing</span>
      </div>
      <div class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary)">
        <span style="color: var(--color-success)">✓</span> /contributors/you <span class="text-xs" style="color: var(--color-text-muted)">Dofollow</span>
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-3">
      <NuxtLink to="/submit" class="btn-primary inline-flex items-center">
        Submit via Form
      </NuxtLink>
      <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
        class="btn-secondary inline-flex items-center">
        Submit via GitHub PR
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const categories = CATEGORIES

useHead({
  title: 'aifindr.org – Discover 500+ AI Tools, Free & Open Source',
})
</script>
