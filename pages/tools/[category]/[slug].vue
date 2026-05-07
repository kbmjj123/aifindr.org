<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm mb-4" style="color: var(--color-text-muted)">
      <NuxtLink :to="`/tools/${category}`" style="color: var(--color-text-secondary)">
        {{ categoryInfo?.name || category }}
      </NuxtLink>
      <span>/</span>
      <span style="color: var(--color-text-primary)">{{ slug }}</span>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <!-- Tool header -->
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 lg:w-16 lg:h-16 rounded-xl shrink-0 flex items-center justify-center text-lg font-bold"
            :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
            {{ name?.[0] || 'T' }}
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl lg:text-3xl font-bold mb-1 truncate" style="color: var(--color-text-primary)">
              {{ name || slug }}
            </h1>
            <div class="flex flex-wrap gap-2 mb-2">
              <ToolBadge v-if="featured" type="featured" />
              <ToolBadge v-if="verified" type="verified" />
            </div>
            <p class="text-base" style="color: var(--color-text-secondary)">
              {{ meta_description || 'No description available.' }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <ToolTag v-for="tag in tags" :key="tag">{{ tag }}</ToolTag>
              <ToolTag :type="pricing">{{ pricingLabel }}</ToolTag>
            </div>
          </div>
        </div>

        <!-- Markdown body -->
        <div class="markdown-content">
          <p class="text-sm" style="color: var(--color-text-muted)">
            Tool description content will be rendered here from Markdown.
          </p>
        </div>
      </div>

      <!-- Right sidebar -->
      <div class="w-full lg:w-[280px] shrink-0">
        <div class="p-5 rounded-xl sticky top-[72px]"
          :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
          <a :href="website || '#'" target="_blank" rel="noopener noreferrer"
            class="btn-primary w-full flex items-center justify-center gap-2 mb-4">
            Visit Website ↗
          </a>

          <div class="space-y-4 text-sm">
            <div>
              <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">
                Pricing
              </div>
              <div style="color: var(--color-text-primary)">{{ pricingLabel }}</div>
            </div>
            <div v-if="price_detail">
              <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">
                Price Details
              </div>
              <div style="color: var(--color-text-primary)">{{ price_detail }}</div>
            </div>
            <div>
              <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">
                Category
              </div>
              <NuxtLink :to="`/tools/${category}`" style="color: var(--color-text-link)">
                {{ categoryInfo?.name || category }}
              </NuxtLink>
            </div>
            <div v-if="platforms.length">
              <div class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">
                Platforms
              </div>
              <div class="flex flex-wrap gap-1.5">
                <ToolTag v-for="p in platforms" :key="p">{{ p }}</ToolTag>
              </div>
            </div>
          </div>

          <!-- Submitter info (dofollow backlink) -->
          <div v-if="submitter_site || submitter_github" class="mt-4 pt-4"
            :style="{ borderTop: '1px solid var(--color-border)' }">
            <div class="text-xs font-medium uppercase tracking-wider mb-2" style="color: var(--color-text-muted)">
              Submitted by
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }" />
              <div>
                <span class="text-sm" style="color: var(--color-text-secondary)">
                  {{ submitter_github || 'Anonymous' }}
                </span>
                <a v-if="submitter_site" :href="submitter_site" target="_blank"
                  class="block text-sm" style="color: var(--color-text-link)">
                  {{ submitter_site.replace(/^https?:\/\//, '') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import type { ToolPricing } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))

// Placeholder data (will be replaced with real data from Content query)
const name = computed(() => slug.value)
const featured = true
const verified = false
const meta_description = 'This is an AI tool description that will be loaded from the Markdown content file.'
const tags: string[] = ['ai', 'tool']
const pricing: ToolPricing = 'freemium'
const pricingLabel = computed(() => pricing.charAt(0).toUpperCase() + pricing.slice(1))
const price_detail = 'Free plan available'
const website = 'https://example.com'
const platforms: string[] = ['web', 'api']
const submitter_site: string = ''
const submitter_github: string = ''

useHead({
  title: computed(() => `${name.value} – AI Tool | aifindr.org`),
})
</script>
