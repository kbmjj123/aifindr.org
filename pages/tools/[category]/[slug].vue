<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${category}`">{{ categoryInfo?.name || category }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ name }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <!-- Tool header -->
        <div class="flex items-start gap-4 mb-6">
          <div class="tool-detail-logo shrink-0 flex items-center justify-center font-sans font-bold text-xl"
            :style="{ background: 'var(--color-bg-elevated)' }">
            {{ name[0] || 'T' }}
          </div>
          <div class="min-w-0">
            <h1 class="tool-detail-name mb-1">{{ name }}</h1>
            <div class="flex flex-wrap gap-2 mb-2">
              <ToolBadge v-if="featured" type="featured" />
              <ToolBadge v-if="verified" type="verified" />
            </div>
            <p class="font-body text-[13px]" style="color: var(--color-text-secondary)">
              {{ meta_description }}
            </p>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <ToolTag v-for="tag in tags" :key="tag">{{ tag }}</ToolTag>
              <ToolTag :type="pricing">{{ pricingLabel }}</ToolTag>
            </div>
          </div>
        </div>

        <!-- Markdown body -->
        <div class="markdown-content">
          <p class="font-body text-[12px]" style="color: var(--color-text-muted)">
            Tool description content will be rendered here from Markdown.
          </p>
        </div>
      </div>

      <!-- Right sidebar -->
      <div class="w-full lg:w-[270px] shrink-0">
        <div class="detail-sidebar sticky" style="top: 68px;">
          <a :href="website || '#'" target="_blank" rel="noopener noreferrer"
            class="btn-primary w-full flex items-center justify-center gap-2 !h-[38px]">
            Visit Website ↗
          </a>

          <div :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0' }" />

          <div class="space-y-1">
            <div>
              <div class="detail-sidebar-label">Pricing</div>
              <div class="detail-sidebar-value">{{ pricingLabel }}</div>
            </div>
            <div v-if="price_detail">
              <div class="detail-sidebar-label">Price Details</div>
              <div class="detail-sidebar-value">{{ price_detail }}</div>
            </div>
            <div>
              <div class="detail-sidebar-label">Category</div>
              <NuxtLink :to="`/tools/${category}`" class="detail-sidebar-value" style="color: var(--color-text-link)">
                {{ categoryInfo?.name || category }}
              </NuxtLink>
            </div>
            <div v-if="platforms.length">
              <div class="detail-sidebar-label">Platforms</div>
              <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                <ToolTag v-for="p in platforms" :key="p">{{ p }}</ToolTag>
              </div>
            </div>
          </div>

          <!-- Submitter info (dofollow backlink) -->
          <div v-if="submitter_site || submitter_github" :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0', paddingTop: '14px' }">
            <div class="detail-sidebar-label">Submitted by</div>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-5 h-5 rounded-full shrink-0" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }" />
              <div>
                <div class="font-body text-[12px]" style="color: var(--color-text-secondary)">
                  {{ submitter_github || 'Anonymous' }}
                </div>
                <a v-if="submitter_site" :href="submitter_site" target="_blank"
                  class="font-body text-[12px]" style="color: var(--color-text-link)">
                  {{ submitter_site.replace(/^https?:\/\//, '') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alternatives -->
    <section class="mt-12">
      <h2 class="font-sans font-bold text-[15px] mb-4" style="color: var(--color-text-primary)">
        Looking for Alternatives to {{ name }}?
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
        <ToolCardCompact v-for="i in 6" :key="i" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import type { ToolPricing } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))

// Placeholder data
const name = computed(() => slug.value)
const featured = true
const verified = false
const meta_description = 'This is an AI tool description that will be loaded from the Markdown content file.'
const tags: string[] = ['ai', 'tool']
const pricing: ToolPricing = 'freemium'
const pricingLabel = 'Freemium'
const price_detail = 'Free plan available'
const website = 'https://example.com'
const platforms: string[] = ['web', 'api']
const submitter_site: string = ''
const submitter_github: string = ''

useHead({
  title: computed(() => `${name.value} – AI Tool | aifindr.org`),
})
</script>
