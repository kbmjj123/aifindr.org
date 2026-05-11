<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${category}`">{{ categoryInfo?.name || category }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ toolWithBody?.name || slug }}</span>
    </nav>

    <div v-if="pending" class="text-center py-20 font-body text-[12px]" style="color: var(--color-text-muted)">Loading...</div>
    <template v-else-if="toolWithBody">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start gap-4 mb-6">
            <div class="tool-detail-logo shrink-0 flex items-center justify-center font-sans font-bold text-xl"
              :style="{ background: 'var(--color-bg-elevated)' }">
              {{ toolWithBody.name[0] || 'T' }}
            </div>
            <div class="min-w-0">
              <h1 class="tool-detail-name mb-1">{{ toolWithBody.name }}</h1>
              <div class="flex flex-wrap gap-2 mb-2">
                <ToolBadge v-if="toolWithBody.featured" type="featured" />
                <ToolBadge v-if="toolWithBody.verified" type="verified" />
              </div>
              <p class="font-body text-[13px]" style="color: var(--color-text-secondary)">
                {{ toolWithBody.meta_description }}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-3">
                <ToolTag v-for="tag in toolTags" :key="tag">{{ tag }}</ToolTag>
                <ToolTag :type="toolWithBody.pricing">{{ pricingLabel(toolWithBody.pricing) }}</ToolTag>
              </div>
            </div>
          </div>

          <!-- Markdown body -->
          <div class="markdown-content">
            <template v-if="toolWithBody.body">
              <ContentRenderer :value="toolWithBody" />
            </template>
            <template v-else>
              <p class="font-body text-[12px]" style="color: var(--color-text-muted)">
                No detailed description available.
              </p>
            </template>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="w-full lg:w-[270px] shrink-0">
          <div class="detail-sidebar sticky" style="top: 68px;">
            <a :href="toolWithBody.website || '#'" target="_blank" rel="noopener noreferrer"
              class="btn-primary w-full flex items-center justify-center gap-2 !h-[38px]"
              @click="recordClick">
              Visit Website ↗
            </a>

            <div :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0' }" />

            <div class="space-y-1">
              <div>
                <div class="detail-sidebar-label">Pricing</div>
                <div class="detail-sidebar-value">{{ pricingLabel(toolWithBody.pricing) }}</div>
              </div>
              <div v-if="toolWithBody.price_detail">
                <div class="detail-sidebar-label">Price Details</div>
                <div class="detail-sidebar-value">{{ toolWithBody.price_detail }}</div>
              </div>
              <div>
                <div class="detail-sidebar-label">Category</div>
                <NuxtLink :to="`/tools/${toolWithBody.category}`" class="detail-sidebar-value" style="color: var(--color-text-link)">
                  {{ categoryInfo?.name || toolWithBody.category }}
                </NuxtLink>
              </div>
              <div v-if="toolPlatforms.length">
                <div class="detail-sidebar-label">Platforms</div>
                <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                  <ToolTag v-for="p in toolPlatforms" :key="p">{{ p }}</ToolTag>
                </div>
              </div>
            </div>

            <!-- Submitter info (dofollow backlink) -->
            <div v-if="toolWithBody.submitter_site || toolWithBody.submitter_github" :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0', paddingTop: '14px' }">
              <div class="detail-sidebar-label">Submitted by</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-5 h-5 rounded-full shrink-0" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }" />
                <div>
                  <div class="font-body text-[12px]" style="color: var(--color-text-secondary)">
                    {{ toolWithBody.submitter_github || 'Anonymous' }}
                  </div>
                  <a v-if="toolWithBody.submitter_site" :href="toolWithBody.submitter_site" target="_blank"
                    class="font-body text-[12px]" style="color: var(--color-text-link)">
                    {{ toolWithBody.submitter_site.replace(/^https?:\/\//, '') }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alternatives -->
      <section v-if="alternatives.length" class="mt-12">
        <h2 class="font-sans font-bold text-[15px] mb-4" style="color: var(--color-text-primary)">
          Looking for Alternatives to {{ toolWithBody.name }}?
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
          <ToolCardCompact v-for="t in alternatives" :key="t.slug" :name="t.name" :description="t.meta_description || ''" :pricing="t.pricing" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import type { Tool, ToolPricing } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))

const toolTags = ref<string[]>([])
const alternatives = ref<Tool[]>([])

const toolPlatforms = computed(() => {
  const p = tool.value?.platforms
  if (!p) return []
  if (Array.isArray(p)) return p
  return String(p).split(',').filter(Boolean)
})

function pricingLabel(p: ToolPricing) {
  return p.charAt(0).toUpperCase() + p.slice(1)
}

// 1. Load metadata from API
const { data: tool, pending } = useAsyncData<Tool>(
  `tool-api-${slug.value}`,
  () => $fetch<Tool>(`/api/tools/${category.value}/${slug.value}`),
  { watch: [category, slug] }
)

// 2. Load markdown body from Nuxt Content (SSR only)
const { data: contentTool } = useAsyncData(
  `tool-body-${slug.value}`,
  () => queryCollection('tools').where('slug', '=', slug.value).first(),
  { watch: [category, slug] }
)

// Merge body into tool
const toolWithBody = computed(() => {
  if (!tool.value) return null
  return { ...tool.value, body: (contentTool.value as any)?.body || null }
})

// Extract tags and load alternatives
watchEffect(async () => {
  if (!tool.value) return
  toolTags.value = (tool.value as any).tags || []

  try {
    const altData = await $fetch<{ tools: Tool[] }>(
      `/api/tools?category=${category.value}&pageSize=7`
    )
    if (altData?.tools) {
      alternatives.value = altData.tools.filter(t => t.slug !== slug.value).slice(0, 6)
    }
  } catch {
    // alternatives optional
  }
})

async function recordClick() {
  if (tool.value?.id) {
    await $fetch(`/api/click/${tool.value.id}`, { method: 'POST' })
  }
}

usePageSeo(() => ({
  title: tool.value?.name || slug.value,
  template: 'tool',
  subtitle: tool.value?.meta_description || '',
  description: tool.value?.meta_description || '',
}))
</script>
