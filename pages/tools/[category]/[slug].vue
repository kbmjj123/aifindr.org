<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/tools">All Tools</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink :to="`/tools/${category}`">{{ categoryInfo?.title || category }}</NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ tool?.name || slug }}</span>
    </nav>

    <div v-if="isPreview" class="mb-4 p-3 rounded-lg flex items-center gap-2 font-body text-[13px]"
      :style="{ background: 'var(--color-featured-bg)', border: '1px solid var(--color-featured-border)', color: 'var(--color-featured-text)' }">
      🔍 Preview — This tool is <strong>{{ tool?.status || 'pending' }}</strong> and not publicly visible yet.
    </div>

    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">Loading...</div>
    <LoginPrompt v-if="authRequired" message="Sign in with GitHub to preview pending tools." />

    <template v-else-if="tool">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Cover: Screenshots gallery as hero -->
          <div v-if="toolScreenshots.length" class="mb-6">
            <ScreenshotGallery :urls="toolScreenshots" :alt="tool.name" />
          </div>

          <div class="flex items-start gap-4 mb-6">
            <div class="tool-detail-logo shrink-0 flex items-center justify-center"
              :style="{ background: 'var(--color-bg-elevated)' }">
              <img v-if="tool.logo" :src="tool.logo" :alt="`${tool.name} logo`" class="w-full h-full object-cover rounded-[var(--radius-lg)]" />
              <span v-else class="font-sans font-bold text-xl" :style="{ color: 'var(--color-text-muted)' }">{{ (tool.name || 'T')[0] }}</span>
            </div>
            <div class="min-w-0">
              <h1 class="tool-detail-name mb-1">{{ tool.name }}<span v-if="tool.short_description" class="font-normal" style="color: var(--color-text-secondary); font-size: 0.65em; letter-spacing: -0.3px"> — {{ tool.short_description }}</span></h1>
              <p class="font-body text-[13px]" style="color: var(--color-text-secondary)">
                {{ tool.meta_description }}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-3">
                <NuxtLink v-for="tag in toolTags" :key="tag"
                  :to="`/tools/${category}/tags/${tag}`"
                  class="tag no-underline cursor-pointer hover:opacity-70 transition-opacity">
                  {{ tag }}
                </NuxtLink>
                <ToolTag :type="tool.pricing">{{ pricingLabel(tool.pricing) }}</ToolTag>
              </div>
            </div>
          </div>

          <!-- Media: Videos -->
          <div v-if="toolVideos.length" class="mb-6">
            <h2 class="font-sans font-semibold text-[15px] mb-3" style="color: var(--color-text-primary); letter-spacing: -0.3px">Demo Videos</h2>
            <div class="space-y-3">
              <div v-for="v in toolVideos" :key="v.id || v.url"
                class="rounded-lg overflow-hidden"
                :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }">
                <div class="aspect-video flex flex-col items-center justify-center gap-2 font-body text-[11px]"
                  :style="{ color: 'var(--color-text-muted)' }">
                  ▶️ {{ v.title || 'Demo Video' }}
                  <span class="text-[11px]">({{ v.platform }} — {{ formatDuration(v.duration) }})</span>
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
              <p class="font-body text-[13px]" style="color: var(--color-text-muted)">
                No detailed description available.
              </p>
            </template>
          </div>

          <!-- FAQ -->
          <div v-if="toolFaq.length" class="mb-6">
            <h2 class="font-sans font-semibold text-[15px] mb-3" style="color: var(--color-text-primary); letter-spacing: -0.3px">
              Frequently Asked Questions
            </h2>
            <div class="space-y-2">
              <div v-for="(faq, fi) in toolFaq" :key="fi"
                class="rounded-lg overflow-hidden transition-all"
                :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
                <button
                  class="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors"
                  :style="{ color: 'var(--color-text-primary)' }"
                  @click="toggleFaq(fi)">
                  <span class="font-sans font-semibold text-[13px] pr-4">{{ faq.question }}</span>
                  <svg
                    class="shrink-0 transition-transform duration-200"
                    :class="{ 'rotate-180': openFaq === fi }"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    :style="{ stroke: 'var(--color-text-muted)' }" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div v-if="openFaq === fi" class="px-4 pb-3">
                  <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-secondary)">
                    {{ faq.answer }}
                  </p>
                </div>
              </div>
            </div>
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
              <div v-if="tool.price_tiers || tool.price_detail">
                <div class="detail-sidebar-label">Price Details</div>
                <div :class="{ 'max-h-[100px] overflow-hidden': !priceExpanded }">
                  <PriceTiersDisplay :tiers="(tool as any).price_tiers" :fallback="tool.price_detail" />
                </div>
                <button v-if="priceTierCount > 3" type="button"
                  class="mt-1.5 font-body text-[11px] cursor-pointer transition-opacity hover:opacity-70"
                  :style="{ color: 'var(--color-accent)' }"
                  @click="priceExpanded = !priceExpanded">
                  {{ priceExpanded ? 'Show less ↑' : `Show all ${priceTierCount} tiers ↓` }}
                </button>
              </div>
              <div>
                <div class="detail-sidebar-label">Category</div>
                <NuxtLink :to="`/tools/${tool.category}`" class="detail-sidebar-value" style="color: var(--color-text-link)">
                  {{ categoryInfo?.title || tool.category }}
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
                    :to="`/tools/${category}/tags/${u}`"
                    class="tag cursor-pointer no-underline" style="background: var(--color-verified-bg); color: var(--color-verified-text); border-color: var(--color-verified-border)">
                    {{ formatUserLabel(u) }}
                  </NuxtLink>
                </div>
              </div>
              <!-- Use Cases -->
              <div v-if="toolUseCases.length">
                <div class="detail-sidebar-label">Use Cases</div>
                <div class="flex flex-wrap gap-1.5 mt-1 mb-3">
                  <NuxtLink v-for="uc in toolUseCases" :key="uc"
                    :to="`/tools/${category}/tags/${uc}`"
                    class="tag cursor-pointer no-underline" style="background: var(--color-accent-dim); color: var(--color-accent); border-color: var(--color-accent-border)">
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
                <img v-if="(tool as any).submitter_avatar" :src="(tool as any).submitter_avatar" :alt="tool.submitter_github"
                  class="w-5 h-5 rounded-full shrink-0 object-cover" />
                <div v-else class="w-5 h-5 rounded-full shrink-0" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }" />
                <div>
                  <div class="font-body text-[13px]" style="color: var(--color-text-secondary)">
                  <NuxtLink v-if="tool.submitter_github"
                    :to="`/contributors/${tool.submitter_github}`"
                    class="font-body text-[13px]" style="color: var(--color-text-secondary)">
                    {{ tool.submitter_github }}
                  </NuxtLink>
                  <span v-else class="font-body text-[13px]" style="color: var(--color-text-secondary)">Anonymous</span>
                  </div>
                  <a v-if="tool.submitter_site" :href="tool.submitter_site" target="_blank"
                    class="font-body text-[13px]" style="color: var(--color-text-link)">
                    {{ tool.submitter_site.replace(/^https?:\/\//, '') }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/category'
import type { Tool, ToolPricing } from '~/types/tool'

const route = useRoute()
const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)
const isPreview = computed(() => route.query.preview === '1')
const { get, post } = useApi()

const categoryInfo = computed(() => CATEGORIES.find(c => c.slug === category.value))
const toolTags = ref<string[]>([])
const authRequired = ref(false)

const toolPlatforms = computed(() => {
  const p = tool.value?.platforms
  if (!p) return []
  if (Array.isArray(p)) return p
  return String(p).split(',').filter(Boolean)
})

// Price accordion
const priceExpanded = ref(false)
const priceTierCount = computed(() => {
  const t = (tool.value as any)?.price_tiers
  if (!t) return 0
  if (Array.isArray(t)) return t.length
  try { return JSON.parse(t as string).length } catch { return 0 }
})

const toolTargetUsers = computed(() => {
  const t = (tool.value as any)?.tags
  if (!Array.isArray(t)) return []
  return t.filter((x: any) => x.type === 'audience').map((x: any) => x.tag)
})

const toolUseCases = computed(() => {
  const t = (tool.value as any)?.tags
  if (!Array.isArray(t)) return []
  return t.filter((x: any) => x.type === 'use_case').map((x: any) => x.tag)
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

const toolScreenshots = computed(() => {
  const s = (tool.value as any)?.screenshots
  if (Array.isArray(s)) return s
  if (typeof s === 'string') {
    try { return JSON.parse(s) as (string | { url: string; alt?: string })[] } catch { return [] }
  }
  return [] as (string | { url: string; alt?: string })[]
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

// FAQ accordion
const openFaq = ref<number | null>(null)
function toggleFaq(idx: number) {
  openFaq.value = openFaq.value === idx ? null : idx
}
const toolFaq = computed(() => {
  const f = (tool.value as any)?.faq
  if (Array.isArray(f)) return f
  if (typeof f === 'string') { try { return JSON.parse(f) } catch { return [] } }
  return []
})

const { data: tool, pending } = useAsyncData<Tool>(
  `tool-${slug.value}${isPreview.value ? '-preview' : ''}`,
  async () => {
    authRequired.value = false
    const previewParam = isPreview.value ? '?preview=1' : ''
    try {
      const result = await get<Tool>(`/api/tools/${category.value}/${slug.value}${previewParam}`)
      return result
    } catch (e: any) {
      if (e?.response?.status === 401) {
        authRequired.value = true
      }
      return null as unknown as Tool
    }
  },
  { watch: [category, slug] }
)

// Render markdown body
const { render } = useMarkdown()
const toolLinksMap = ref<Record<string, { slug: string; category: string }>>({})
const mdBody = computed(() => {
  const body = tool.value?.body
  if (!body) return ''
  const html = render(body as string)
  return replaceToolLinks(html, toolLinksMap.value)
})

// Fetch tool website → internal path mapping for link replacement
try {
  const links = await get<Record<string, { slug: string; category: string }>>('/api/tools/links')
  if (links) toolLinksMap.value = links
} catch {}

// Extract feature tags from structured tags
watchEffect(() => {
  const t = (tool.value as any)?.tags
  if (!Array.isArray(t)) { toolTags.value = []; return }
  toolTags.value = t.filter((x: any) => x.type === 'feature').map((x: any) => x.tag)
})

async function recordClick() {
  if (tool.value?.id) {
    await post(`/api/click/${tool.value.id}`, {})
  }
}

usePageSeo(() => ({
  title: tool.value?.name || slug.value,
  template: 'tool',
  subtitle: (tool.value as any)?.short_description || tool.value?.meta_description || '',
  description: tool.value?.meta_description || '',
}))

// ─── SEO: keywords + canonical ──────────────────────────────────────

const canonical = computed(() =>
  `https://aifindr.org/tools/${category.value}/${tool.value?.slug || slug.value}`
)

useHead(() => {
  const t = tool.value
  if (!t) return {}

  return {
    meta: [
      { name: 'keywords', content: toolTags.value.length ? toolTags.value.join(', ') : t.category },
    ],
    link: [
      { rel: 'canonical', href: canonical.value },
    ],
  }
})

// ─── Schema: BreadcrumbList ───────────────────────────────────────

useSchemaOrg([
  defineBreadcrumb(() => ({
    itemListElement: [
      { name: 'All Tools', item: '/tools' },
      { name: categoryInfo.value?.title || category.value, item: `/tools/${category.value}` },
      { name: tool.value?.name || slug.value, item: `/tools/${category.value}/${tool.value?.slug || slug.value}` },
    ],
  })),
])

// ─── Schema: SoftwareApplication (via @nuxtjs/seo) ─────────────────

useSchemaOrg([
  defineSoftwareApp(() => {
    const t = tool.value
    if (!t) return {}
    const price = t.pricing === 'free' ? '0' : String(t.price_starting || 0)
    return {
      name: t.name,
      description: t.meta_description || '',
      url: t.website,
      applicationCategory: categoryInfo.value?.title || t.category,
      image: t.logo || (Array.isArray(t.screenshots) ? t.screenshots[0] : undefined),
      operatingSystem: toolPlatforms.value.length ? toolPlatforms.value.join(', ') : undefined,
      offers: { '@type': 'Offer', price, priceCurrency: 'USD' },
    }
  }),
])

// ─── FAQPage schema (reactive, separate call) ─────────────────────
const faqSchema = computed(() => {
  const f = toolFaq.value
  if (!f.length) return []
  return [{
    '@type': 'FAQPage' as const,
    mainEntity: f.map((q: any) => ({
      '@type': 'Question' as const,
      name: q.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: q.answer },
    })),
  }]
})
useSchemaOrg(faqSchema)

// ── record view ──────────────────────────────────────────────
watchEffect(() => {
  const id = tool.value?.id
  if (id && import.meta.client) {
    post(`/api/view/${id}`, {}).catch(() => {}) // silent
  }
})
</script>