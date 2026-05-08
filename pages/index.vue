<template>
  <!-- ═══ Hero 区 ═══ -->
  <section class="pt-12 pb-9 lg:pt-12 lg:pb-9">
    <div class="hero-tag">Open Source</div>
    <h1 class="hero-title">
      Discover <em>AI Tools</em><br />Built for Makers.
    </h1>
    <p class="hero-sub">
      Open-source AI tool directory. Submit your tool, get 3 free dofollow backlinks.
    </p>
    <!-- Hero search -->
    <div class="max-w-[560px]">
      <SearchBar :expanded="true" />
    </div>
  </section>

  <!-- ═══ Trending 区 ═══ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">🔥 Trending</h2>
        <p class="font-body text-[11px]" style="color: var(--color-text-muted)">Most viewed this week</p>
      </div>
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:gap-[10px] scrollbar-none">
      <ToolCardCompact v-for="i in 8" :key="i" />
    </div>
  </section>

  <!-- ═══ Featured 区 ═══ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">⭐ Featured Tools</h2>
      <span class="font-body text-[10px]" style="color: var(--color-text-muted)">Sponsored</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
      <ToolCard v-for="i in 4" :key="i" :featured="true" />
    </div>
  </section>

  <!-- ═══ Browse by Category 区 ═══ -->
  <section class="mb-10">
    <h2 class="font-sans font-bold text-[15px] mb-4" style="color: var(--color-text-primary)">
      Browse by Category
    </h2>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-2">
      <NuxtLink v-for="cat in categories" :key="cat.slug" :to="`/tools/${cat.slug}`"
        class="flex items-center gap-2.5 px-3 rounded-lg"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', height: '64px' }"
        @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'">
        <span class="text-lg shrink-0">{{ cat.emoji }}</span>
        <div class="min-w-0">
          <div class="font-sans font-semibold text-[12px]" style="color: var(--color-text-primary)">
            {{ cat.name }}
          </div>
          <div class="font-body text-[10px]" style="color: var(--color-text-muted)">{{ Math.floor(Math.random() * 50) + 5 }} tools</div>
        </div>
      </NuxtLink>
    </div>
  </section>

  <!-- ═══ Recently Added 区 ═══ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">
        🆕 Recently Added
      </h2>
      <NuxtLink to="/tools" class="font-body text-[11px]" style="color: var(--color-accent)">
        View all tools &rarr;
      </NuxtLink>
    </div>
    <ToolGrid>
      <ToolCard v-for="i in 20" :key="i" />
    </ToolGrid>
  </section>

  <!-- ═══ Submit CTA 区 ═══ -->
  <section class="cta-section mb-10">
    <h2 class="font-sans font-extrabold text-[20px] tracking-tight mb-2"
      style="color: var(--color-text-primary)">
      Get 3 Free Backlinks for Your Tool
    </h2>
    <p class="font-body text-[12px] mb-6" style="color: var(--color-text-muted)">
      Submit your AI tool and get listed on GitHub (DA 100), aifindr.org, and your contributor page.
    </p>

    <div class="flex flex-wrap justify-center gap-6 mb-6">
      <div class="flex items-center gap-2 font-body text-[12px]" style="color: var(--color-text-secondary)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
        </svg>
        github.com <span class="font-body text-[10px]" style="color: var(--color-text-muted)">DA 100</span>
      </div>
      <div class="flex items-center gap-2 font-body text-[12px]" style="color: var(--color-text-secondary)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
        </svg>
        aifindr.org <span class="font-body text-[10px]" style="color: var(--color-text-muted)">DA growing</span>
      </div>
      <div class="flex items-center gap-2 font-body text-[12px]" style="color: var(--color-text-secondary)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
        </svg>
        /contributors/you <span class="font-body text-[10px]" style="color: var(--color-text-muted)">Dofollow</span>
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
      <NuxtLink to="/submit" class="btn-primary">
        Submit via Form
      </NuxtLink>
      <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
        class="btn-secondary">
        Submit via GitHub PR
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const categories = CATEGORIES

usePageSeo({
  description: 'Open-source AI tool directory. Submit your tool, get free backlinks on GitHub (DA 100), aifindr.org, and your contributor page.',
})
</script>
