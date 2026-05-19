<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${category}`">{{ categoryInfo?.name || category }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ tool?.name || slug }}</span>
    </nav>

    <div v-if="pending" class="text-center py-20 font-body text-[12px]" style="color: var(--color-text-muted)">Loading...</div>
    <template v-else-if="tool">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start gap-4 mb-6">
            <div class="tool-detail-logo shrink-0 flex items-center justify-center font-sans font-bold text-xl"
              :style="{ background: 'var(--color-bg-elevated)' }">
              {{ tool.name[0] || 'T' }}
            </div>
            <div class="min-w-0">
              <h1 class="tool-detail-name mb-1">{{ tool.name }}</h1>
              <div class="flex flex-wrap gap-2 mb-2">
                <ToolBadge v-if="tool.featured" type="featured" />
                <ToolBadge v-if="tool.verified" type="verified" />
              </div>
              <p class="font-body text-[13px]" style="color: var(--color-text-secondary)">
                {{ tool.meta_description }}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-3">
                <ToolTag v-for="tag in toolTags" :key="tag">{{ tag }}</ToolTag>
                <ToolTag :type="tool.pricing">{{ pricingLabel(tool.pricing) }}</ToolTag>
              </div>
            </div>
          </div>

          <!-- Cover image -->
          <div v-if="tool.cover_image" class="mb-6 rounded-lg overflow-hidden"
            :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }">
            <div class="aspect-video flex items-center justify-center font-body text-[11px]"
              :style="{ color: 'var(--color-text-muted)' }">
              🖼️ {{ tool.name }} Cover
            </div>
          </div>

          <!-- Media: Screenshots -->
          <div v-if="toolImages.length" class="mb-6">
            <h3 class="font-sans font-semibold text-[13px] mb-3" style="color: var(--color-text-primary)">Screenshots</h3>
            <div v-if="toolImages.length === 1" class="rounded-lg overflow-hidden"
              :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }">
              <div class="aspect-video flex items-center justify-center font-body text-[11px]"
                :style="{ color: 'var(--color-text-muted)' }">
                🖼️ {{ toolImages[0].alt || 'Screenshot' }}
              </div>
              <div v-if="toolImages[0].caption" class="px-3 py-2 font-body text-[10px]"
                :style="{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }">
                {{ toolImages[0].caption }}
              </div>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="img in toolImages" :key="img.id || img.url"
                class="rounded-lg overflow-hidden"
                :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }">
                <div class="aspect-video flex items-center justify-center font-body text-[11px]"
                  :style="{ color: 'var(--color-text-muted)' }">
                  🖼️ {{ img.alt || 'Screenshot' }}
                </div>
                <div v-if="img.caption" class="px-3 py-2 font-body text-[10px]"
                  :style="{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }">
                  {{ img.caption }}
                </div>
              </div>
            </div>
          </div>

          <!-- Media: Videos -->
          <div v-if="toolVideos.length" class="mb-6">
            <h3 class="font-sans font-semibold text-[13px] mb-3" style="color: var(--color-text-primary)">Demo Videos</h3>
            <div class="space-y-3">
              <div v-for="v in toolVideos" :key="v.id || v.url"
                class="rounded-lg overflow-hidden"
                :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }">
                <div class="aspect-video flex flex-col items-center justify-center gap-2 font-body text-[11px]"
                  :style="{ color: 'var(--color-text-muted)' }">
                  ▶️ {{ v.title || 'Demo Video' }}
                  <span class="text-[10px]">({{ v.platform }} — {{ formatDuration(v.duration) }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Markdown body -->
          <div class="markdown-content">
            <template v-if="tool.body">
              <div class="markdown" v-html="mdBody" />
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
            <a :href="tool.website || '#'" target="_blank" rel="noopener noreferrer"
              class="btn-primary w-full flex items-center justify-center gap-2 !h-[38px]"
              @click="recordClick">
              Visit Website ↗
            </a>

            <div :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0' }" />

            <div class="space-y-1">
              <div>
                <div class="detail-sidebar-label">Pricing</div>
                <div class="detail-sidebar-value">{{ pricingLabel(tool.pricing) }}</div>
              </div>
              <div v-if="tool.price_detail">
                <div class="detail-sidebar-label">Price Details</div>
                <div class="detail-sidebar-value">{{ tool.price_detail }}</div>
              </div>
              <div>
                <div class="detail-sidebar-label">Category</div>
                <NuxtLink :to="`/tools/${tool.category}`" class="detail-sidebar-value" style="color: var(--color-text-link)">
                  {{ categoryInfo?.name || tool.category }}
                </NuxtLink>
              </div>
              <div v-if="toolPlatforms.length">
                <div class="detail-sidebar-label">Platforms</div>
                <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                  <ToolTag v-for="p in toolPlatforms" :key="p">{{ p }}</ToolTag>
                </div>
              </div>
              <!-- Target Users -->
              <div v-if="toolTargetUsers.length">
                <div class="detail-sidebar-label">Best For</div>
                <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                  <NuxtLink v-for="u in toolTargetUsers" :key="u"
                    :to="`/tools?target_users=${u}`"
                    class="tag cursor-pointer" style="background: var(--color-verified-bg); color: var(--color-verified-text); border-color: var(--color-verified-border)">
                    {{ formatUserLabel(u) }}
                  </NuxtLink>
                </div>
              </div>
              <!-- Use Cases -->
              <div v-if="toolUseCases.length">
                <div class="detail-sidebar-label">Use Cases</div>
                <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                  <NuxtLink v-for="uc in toolUseCases" :key="uc"
                    :to="`/tools?use_cases=${uc}`"
                    class="tag cursor-pointer" style="background: var(--color-accent-dim); color: var(--color-accent); border-color: var(--color-accent-border)">
                    {{ formatUseCaseLabel(uc) }}
                  </NuxtLink>
                </div>
              </div>
              <!-- Free Trial -->
              <div v-if="tool.has_free_trial" class="mb-3">
                <span class="badge badge-verified">Free Trial</span>
              </div>
              <!-- Data Source + Last Verified -->
              <div :style="{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '4px' }">
                <div v-if="tool.data_source" class="detail-sidebar-value" style="font-size: 10px; margin-bottom: 4px;">
                  Data from {{ tool.data_source }}
                </div>
                <div v-if="tool.last_verified" class="detail-sidebar-value" style="font-size: 10px;">
                  Verified {{ formatDate(tool.last_verified) }}
                </div>
              </div>
            </div>

            <!-- Submitter info (dofollow backlink) -->
            <div v-if="tool.submitter_site || tool.submitter_github" :style="{ borderTop: '1px solid var(--color-border)', margin: '14px 0', paddingTop: '14px' }">
              <div class="detail-sidebar-label">Submitted by</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-5 h-5 rounded-full shrink-0" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }" />
                <div>
                  <div class="font-body text-[12px]" style="color: var(--color-text-secondary)">
                    {{ tool.submitter_github || 'Anonymous' }}
                  </div>
                  <a v-if="tool.submitter_site" :href="tool.submitter_site" target="_blank"
                    class="font-body text-[12px]" style="color: var(--color-text-link)">
                    {{ tool.submitter_site.replace(/^https?:\/\//, '') }}
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
          Looking for Alternatives to {{ tool.name }}?
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

const toolTargetUsers = computed(() => {
  const u = (tool.value as any)?.target_users
  if (!u) return []
  if (Array.isArray(u)) return u
  return String(u).split(',').filter(Boolean)
})

const toolUseCases = computed(() => {
  const uc = (tool.value as any)?.use_cases
  if (!uc) return []
  if (Array.isArray(uc)) return uc
  return String(uc).split(',').filter(Boolean)
})

function formatUserLabel(slug: string) {
  const labels: Record<string, string> = {
    marketer: 'Marketer', developer: 'Developer', designer: 'Designer',
    writer: 'Writer', student: 'Student', researcher: 'Researcher',
    entrepreneur: 'Entrepreneur', educator: 'Educator',
    'data-analyst': 'Data Analyst', 'small-business': 'Small Business',
    'non-technical': 'Non-Technical',
  }
  return labels[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatUseCaseLabel(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function pricingLabel(p: ToolPricing) {
  return p.charAt(0).toUpperCase() + p.slice(1)
}

const toolImages = computed(() => {
  const imgs = (tool.value as any)?.images
  return Array.isArray(imgs) ? imgs : []
})

const toolVideos = computed(() => {
  const vids = (tool.value as any)?.videos
  return Array.isArray(vids) ? vids : []
})

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const { data: tool, pending } = useAsyncData<Tool>(
  `tool-${slug.value}`,
  async () => {
    const result = await $fetch<Tool>(`/api/tools/${category.value}/${slug.value}`)

    // Load alternatives (same category, exclude current)
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

    return result
  },
  { watch: [category, slug], server: false }
)

// Render markdown body
const { render } = useMarkdown()
const mdBody = computed(() => tool.value?.body ? render(tool.value.body as string) : '')

// Extract tags from tool data
watchEffect(() => {
  if (!tool.value) return
  toolTags.value = (tool.value as any).tags || []
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

// ─── SoftwareApplication Schema ──────────────────────────────────────

useHead(() => {
  const t = tool.value
  if (!t) return {}

  const price = t.pricing === 'free' ? '0' : String(t.price_starting || 0)

  return {
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: t.name,
          description: t.meta_description || '',
          url: t.website,
          applicationCategory: categoryInfo.value?.name || t.category,
          image: t.cover_image || t.og_image || undefined,
          operatingSystem: toolPlatforms.value.length ? toolPlatforms.value.join(', ') : undefined,
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'USD',
          },
        }),
      },
    ],
  }
})
</script>
