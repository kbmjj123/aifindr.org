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
      <ToolCardCompact v-for="t in trending" :key="t.slug" :name="t.name" :description="t.meta_description || ''" :pricing="t.pricing" />
    </div>
  </section>

  <!-- ═══ Featured 区 ═══ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-sans font-bold text-[15px]" style="color: var(--color-text-primary)">⭐ Featured Tools</h2>
      <span class="font-body text-[10px]" style="color: var(--color-text-muted)">Sponsored</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
      <ToolCard v-for="t in featured" :key="t.slug" :name="t.name" :description="t.meta_description || ''" :pricing="t.pricing" :featured="true" :verified="t.verified" :has-free-trial="t.has_free_trial" :slug="t.slug" :category="t.category" />
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
          <div class="font-body text-[10px]" style="color: var(--color-text-muted)">{{ catCounts[cat.slug] || 0 }} tools</div>
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
      <ToolCard v-for="t in recent" :key="t.slug" :name="t.name" :description="t.meta_description || ''" :pricing="t.pricing" :featured="t.featured" :verified="t.verified" :has-free-trial="t.has_free_trial" :slug="t.slug" :category="t.category" />
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
import type { Tool } from '~/types/tool'

const categories = CATEGORIES
const catCounts = ref<Record<string, number>>({})

const { data: homeData } = await useAsyncData('home', () =>
  Promise.all([
    $fetch<{ tools: number; categories: number; contributors: number }>('/api/stats'),
    $fetch<{ tools: Tool[] }>('/api/tools?sort=trending&pageSize=8'),
    $fetch<{ tools: Tool[] }>('/api/tools?sort=featured&pageSize=6'),
    $fetch<{ tools: Tool[] }>('/api/tools?sort=latest&pageSize=20'),
  ]),
  { default: () => null, server: false }
)

const statsTools = computed(() => homeData.value?.[0]?.tools ?? 500)
const statsCategories = computed(() => homeData.value?.[0]?.categories ?? 12)
const statsContributors = computed(() => homeData.value?.[0]?.contributors ?? 50)

const trending = computed(() => homeData.value?.[1]?.tools ?? [])
const featured = computed(() => homeData.value?.[2]?.tools ?? [])
const recent = computed(() => homeData.value?.[3]?.tools ?? [])

// Build category counts from loaded data
watchEffect(() => {
  const all = [...trending.value, ...featured.value, ...recent.value]
  const counts: Record<string, number> = {}
  for (const t of all) {
    counts[t.category] = (counts[t.category] || 0) + 1
  }
  for (const cat of categories) {
    if (!counts[cat.slug]) counts[cat.slug] = 0
  }
  catCounts.value = counts
})

usePageSeo({
  description: 'Find the best AI tools for any task. Open-source AI tools directory with 500+ tools across 12 categories. Submit your tool, get free backlinks.',
})
</script>
