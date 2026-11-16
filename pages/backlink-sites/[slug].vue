<template>
  <div v-if="site">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <NuxtLink to="/backlink-sites">Submission sites</NuxtLink><span class="sep">/</span>
      <span class="current">{{ site.name }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-6">
      <main class="flex-1 min-w-0">
        <header class="mb-8">
          <div class="flex items-start gap-4 mb-3">
            <img v-if="site.icon_url" :src="site.icon_url" :alt="`${site.name} logo`"
              width="36" height="36" class="w-9 h-9 rounded-md shrink-0 object-contain"
              style="border: 1px solid var(--color-border)" />
            <div class="min-w-0">
              <h1 class="font-sans font-extrabold text-[26px] tracking-tight leading-tight"
                style="color: var(--color-text-primary)">
                {{ site.name }}
              </h1>
              <p class="font-body text-[13px] leading-relaxed mt-1" style="color: var(--color-text-secondary)">
                {{ site.editorial || site.summary }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <span v-if="site.domain_rating !== null" class="font-body text-[11px] px-2 py-1 rounded-md"
              :style="chipStyle('muted')">DR {{ site.domain_rating }}</span>
            <span v-if="priceChip" class="font-body text-[11px] px-2 py-1 rounded-md"
              :style="chipStyle(priceChip.tone)">{{ priceChip.label }}</span>
            <span v-if="site.dofollow_link !== null" class="font-body text-[11px] px-2 py-1 rounded-md"
              :style="chipStyle(site.dofollow_link === 1 ? 'accent' : 'muted')">
              {{ site.dofollow_link === 1 ? 'Dofollow link' : 'Nofollow link' }}
            </span>
            <span v-if="approvalChip" class="font-body text-[11px] px-2 py-1 rounded-md"
              :style="chipStyle('muted')">{{ approvalChip }}</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <a v-if="site.site_url" :href="site.site_url" target="_blank" rel="nofollow noopener noreferrer"
              class="btn-primary no-underline">Visit website ↗</a>
          </div>
          <p v-if="!site.submit_url" class="font-body text-[11px] mt-3" style="color: var(--color-warning)">
            A direct submission URL was not recorded in this snapshot. Visit the platform site to find the current form.
          </p>
        </header>

        <!-- 全部抓取内容按原样填入，不做折叠或删减 -->
        <section v-if="hasQuotedContent" aria-labelledby="how-to-submit" class="mb-8">
          <h2 id="how-to-submit" class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
            How to submit
          </h2>
          <ol v-if="submitSteps.length" class="list-none pl-0 font-body text-[12px] leading-relaxed space-y-2"
            style="color: var(--color-text-secondary)">
            <li v-for="(step, i) in submitSteps" :key="i" class="flex gap-3">
              <span class="shrink-0 font-sans font-bold" style="color: var(--color-accent)">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <span>{{ step }}</span>
            </li>
          </ol>
          <div class="mt-5 space-y-5">
            <div v-if="requirements.length">
              <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">What you need</h3>
              <ul class="font-body text-[12px] leading-relaxed space-y-1.5" style="color: var(--color-text-secondary)">
                <li v-for="item in requirements" :key="item">· {{ item }}</li>
              </ul>
            </div>
            <div v-if="rejectionReasons.length">
              <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">
                Common rejection reasons
              </h3>
              <ul class="font-body text-[12px] leading-relaxed space-y-1.5" style="color: var(--color-text-secondary)">
                <li v-for="item in rejectionReasons" :key="item">· {{ item }}</li>
              </ul>
            </div>
            <div v-if="gotchas.length">
              <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">Watch out for</h3>
              <ul class="font-body text-[12px] leading-relaxed space-y-1.5" style="color: var(--color-text-secondary)">
                <li v-for="item in gotchas" :key="item">· {{ item }}</li>
              </ul>
            </div>
          </div>
          <p class="font-body text-[11px] mt-4" style="color: var(--color-text-muted)">
            Steps, requirements, gotchas and rejection reasons are quoted from this platform's
            {{ site.source_snapshot }} SubmitMap page. Details can change without notice — verify on the live site.
          </p>
        </section>

        <section aria-labelledby="facts-verification" class="mb-8">
          <h2 id="facts-verification" class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
            Facts &amp; verification
          </h2>
          <ul class="font-body text-[12px] leading-relaxed space-y-1.5" style="color: var(--color-text-secondary)">
            <li v-for="point in factPoints" :key="point">· {{ point }}</li>
            <li v-for="check in submissionChecks" :key="check">· {{ check }}</li>
          </ul>
        </section>

        <section v-if="productTypes.length || categories.length || lists.length"
          aria-labelledby="where-it-fits" class="mb-8">
          <h2 id="where-it-fits" class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
            Where it fits
          </h2>
          <div v-if="productTypes.length" class="mb-4">
            <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">Accepts</h3>
            <p class="font-body text-[12px] leading-relaxed mb-3" style="color: var(--color-text-secondary)">
              Product types recorded in the {{ site.source_snapshot }} snapshot. These are factual tags, not a guarantee
              that a given submission will be accepted.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="type in productTypes" :key="type" class="tag">{{ type }}</span>
            </div>
          </div>
          <div v-if="categories.length" class="mb-4">
            <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">Topics</h3>
            <div class="flex flex-wrap gap-2">
              <NuxtLink v-for="category in categories" :key="category"
                :to="`/backlink-sites?category=${category}`" class="tag no-underline">
                {{ category.replace(/-/g, ' ') }}
              </NuxtLink>
            </div>
          </div>
          <div v-if="lists.length">
            <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">
              Appears in these lists
            </h3>
            <div class="flex flex-wrap gap-2">
              <NuxtLink v-for="list in lists" :key="list.slug" :to="`/submission-lists/${list.slug}`"
                class="tag no-underline">
                {{ list.title }}
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- FAQ 区块预留：改写阶段填入 faqItems 后，区块与 FAQPage schema 自动启用 -->
        <section v-if="faqItems.length" aria-labelledby="faq" class="mb-8">
          <h2 id="faq" class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">
            Frequently asked questions
          </h2>
          <div class="space-y-2">
            <div v-for="(item, i) in faqItems" :key="item.question" class="rounded-lg overflow-hidden"
              :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
              <button class="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
                :aria-expanded="openFaq === i" :aria-controls="`faq-answer-${i}`" @click="toggleFaq(i)">
                <span class="font-sans font-bold text-[13px] pr-4" style="color: var(--color-text-primary)">
                  {{ item.question }}
                </span>
                <svg class="shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openFaq === i }"
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  style="stroke: var(--color-text-muted)" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div v-show="openFaq === i" :id="`faq-answer-${i}`" class="px-4 pb-3">
                <p class="font-body text-[12px] leading-relaxed" style="color: var(--color-text-secondary)">
                  {{ item.answer }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="related.length" aria-labelledby="similar-platforms" class="mb-8">
          <h2 id="similar-platforms" class="font-sans font-bold text-[16px] mb-3"
            style="color: var(--color-text-primary)">Similar platforms</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NuxtLink v-for="item in related" :key="item.slug" :to="`/backlink-sites/${item.slug}`"
              class="rounded-lg p-3 no-underline font-body text-[12px]"
              :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
              {{ item.name }}
              <span v-if="item.domain_rating !== null" class="ml-2" style="color: var(--color-text-muted)">
                DR {{ item.domain_rating }}
              </span>
            </NuxtLink>
          </div>
        </section>

        <div class="font-body text-[11px]" style="color: var(--color-text-muted)">
          Spotted a mistake? <NuxtLink to="/backlink-sites/data#report" style="color: var(--color-text-link)">Report a correction</NuxtLink>.
        </div>
      </main>

      <aside class="w-full lg:w-[290px] shrink-0">
        <div class="lg:sticky lg:top-[72px]">
          <SubmissionFacts :site="site" />
          <div v-if="site.screenshot_url" class="mt-4 rounded-lg overflow-hidden"
            :style="{ border: '1px solid var(--color-border)' }">
            <div class="w-full overflow-hidden" style="aspect-ratio: 16 / 10; background: var(--color-bg-elevated)">
              <img :src="site.screenshot_url"
                :alt="`${site.name} homepage as captured in the ${site.source_snapshot} snapshot`"
                class="w-full h-full object-cover object-top block" loading="lazy" decoding="async" />
            </div>
            <p class="font-body text-[11px] p-2" style="color: var(--color-text-secondary)">
              Homepage screenshot from the {{ site.source_snapshot }} snapshot (via SubmitMap).
            </p>
          </div>
          <div class="mt-4 rounded-lg p-4"
            :style="{ border: '1px solid var(--color-accent-border)', background: 'var(--color-bg-surface)' }">
            <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">
              Want a dofollow link from us?
            </h3>
            <p class="font-body text-[11px] leading-relaxed mb-3" style="color: var(--color-text-secondary)">
              Submit your AI tool to aifindr.org and, once approved, get three permanent dofollow backlinks. Free forever.
            </p>
            <NuxtLink to="/submit" class="btn-secondary no-underline !h-8">Submit a Tool →</NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="icon">🔍</div>
    <h3>Platform not found</h3>
    <NuxtLink to="/backlink-sites" class="btn-secondary no-underline">Back to directory</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { SubmissionSite } from '~/types/submissionSite'

interface FaqItem { question: string; answer: string }

interface DetailResponse {
  site: SubmissionSite | null
  categories: string[]
  lists: { slug: string; title: string; dimension: string }[]
  related: { slug: string; name: string; domain_rating: number | null }[]
}

const route = useRoute()
const { get } = useApi()
const slug = computed(() => String(route.params.slug || ''))

const emptyDetail = (): DetailResponse => ({ site: null, categories: [], lists: [], related: [] })

const { data, error } = useAsyncData<DetailResponse>(
  () => `submission-site-${slug.value}`,
  () => get<DetailResponse>(`/api/submission-sites/${slug.value}`),
  { default: emptyDetail },
)

// 软 404 修复：让不存在的 slug 真正返回 404，服务端错误返回 502，而不是一律 200 空态
if (import.meta.server) {
  watchEffect(() => {
    if (!error.value) return
    setResponseStatus(error.value.statusCode === 404 ? 404 : 502)
  })
}

const site = computed(() => data.value?.site ?? null)
const categories = computed(() => data.value?.categories ?? [])
const lists = computed(() => data.value?.lists ?? [])
const related = computed(() => data.value?.related ?? [])
const factPoints = computed<string[]>(() => {
  try { return JSON.parse(site.value?.fact_points || '[]') as string[] } catch { return [] }
})
const productTypes = computed<string[]>(() => {
  try {
    const parsed = JSON.parse(site.value?.accepts_product_types || '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch { return [] }
})

/** 快照引用内容（步骤 / 要求 / 坑 / 被拒原因）统一解析 */
function jsonList(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value || '[]')) as unknown
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string' && v !== '') : []
  } catch { return [] }
}
const submitSteps = computed(() => jsonList(site.value?.submit_steps))
const requirements = computed(() => jsonList(site.value?.submit_requirements))
const gotchas = computed(() => jsonList(site.value?.gotchas))
const rejectionReasons = computed(() => jsonList(site.value?.rejection_reasons))
const hasQuotedContent = computed(() =>
  submitSteps.value.length > 0 || requirements.value.length > 0
  || gotchas.value.length > 0 || rejectionReasons.value.length > 0,
)

/** 改写阶段填入；FAQ 区块与 FAQPage schema 在填入后自动启用 */
const faqItems = ref<FaqItem[]>([])
const openFaq = ref<number | null>(null)
function toggleFaq(i: number) { openFaq.value = openFaq.value === i ? null : i }

function joinPhrase(values: string[]): string {
  const shown = values.slice(0, 3)
  if (shown.length <= 1) return shown[0] || ''
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`
}

// 以下提示全部由本站按结构化事实模板原创生成，不复用来源页面的编辑文案
const submissionChecks = computed<string[]>(() => {
  const target = site.value
  if (!target) return []
  const checks: string[] = []
  if (productTypes.value.length) {
    checks.push(`This platform is recorded as accepting ${joinPhrase(productTypes.value)}. Check that your product fits that scope before you start.`)
  }
  if (target.submit_method === 'github_pr' || target.submit_method === 'awesome_list') {
    checks.push('A repository-based submission usually needs a public repo and a clear one-line description of what the project does.')
  } else if (target.submit_method === 'sign_in') {
    checks.push('The recorded channel requires signing in, so expect to create an account before the submission form is available.')
  } else if (target.submit_method === 'community_post') {
    checks.push('This is a community post rather than a directory form; follow the community rules on self-promotion.')
  } else {
    checks.push('Prepare a one-line description, a public URL and a logo before starting a submission run.')
  }
  if (target.backlink_required === 1) {
    checks.push('A badge or return link is expected, so decide where it will go on your own site first.')
  }
  if (target.pricing === 'paid' || target.pricing === 'freemium') {
    checks.push('Paid and freemium tiers change more often than link attributes; confirm the current price on the live page.')
  }
  checks.push('Link attributes, pricing and review times can change without notice — verify on the live page.')
  return checks
})

const priceChip = computed<{ label: string; tone: string } | null>(() => {
  const target = site.value
  if (!target) return null
  if (target.has_free_submission === 1) return { label: 'Free lane', tone: 'success' }
  if (target.pricing === 'free') return { label: 'Free', tone: 'success' }
  if (target.pricing === 'freemium') return { label: 'Freemium', tone: 'new' }
  if (target.pricing === 'paid') return { label: 'Paid', tone: 'paid' }
  return null
})
const approvalChip = computed(() => {
  const target = site.value
  if (!target) return ''
  if (target.approval_time) return `${target.approval_time} approval`
  if (target.approval && target.approval !== 'Not stated') return `${target.approval} approval`
  return ''
})
function chipStyle(tone: string) {
  const tones: Record<string, { bg: string; text: string; border: string }> = {
    success: {
      bg: 'var(--color-pricing-free-bg)', text: 'var(--color-pricing-free-text)',
      border: 'var(--color-pricing-free-border)',
    },
    new: {
      bg: 'var(--color-pricing-freemium-bg)', text: 'var(--color-pricing-freemium-text)',
      border: 'var(--color-pricing-freemium-border)',
    },
    paid: {
      bg: 'var(--color-pricing-paid-bg)', text: 'var(--color-pricing-paid-text)',
      border: 'var(--color-pricing-paid-border)',
    },
    accent: {
      bg: 'var(--color-accent-dim)', text: 'var(--color-accent)', border: 'var(--color-accent-border)',
    },
    muted: {
      bg: 'var(--color-bg-surface)', text: 'var(--color-text-secondary)', border: 'var(--color-border)',
    },
  }
  const chosen = tones[tone] ?? tones.muted!
  return { background: chosen.bg, color: chosen.text, border: `1px solid ${chosen.border}` }
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

// 用结构化事实生成每页唯一的 title / description，避免 848 页共用同一套模板文案
const seoTitleBase = computed(() => {
  const target = site.value
  if (!target) return 'Submission Site'
  const bits: string[] = []
  if (target.domain_rating !== null) bits.push(`DR ${target.domain_rating}`)
  if (target.has_free_submission === 1) bits.push('Free lane')
  else if (target.pricing === 'free') bits.push('Free')
  if (target.dofollow_link === 1) bits.push('Dofollow')
  return clip(`${target.name}${bits.length ? `: ${bits.join(', ')}` : ''}`, 46)
})
const seoTitle = computed(() => `${seoTitleBase.value} | aifindr.org`)
const seoDescription = computed(() => {
  const target = site.value
  if (!target) return 'Submission platform details.'
  const bits: string[] = []
  if (target.domain_rating !== null) bits.push(`DR ${target.domain_rating}`)
  if (target.pricing === 'free') bits.push('free to submit')
  else if (target.has_free_submission === 1) bits.push('a free lane')
  else if (target.pricing === 'freemium') bits.push('freemium')
  if (target.dofollow_link === 1) bits.push('a dofollow link')
  if (target.backlink_required === 1) bits.push('badge required')
  if (target.approval_time) bits.push(`${target.approval_time} approval`)
  else if (target.approval && target.approval !== 'Not stated') bits.push(`${target.approval.toLowerCase()} approval`)
  const lead = `${target.name}${bits.length ? `: ${bits.join(', ')}` : ''}.`
  const detail = submitSteps.value.length
    ? `${submitSteps.value.length} submission steps, requirements and gotchas from the ${target.source_snapshot || 'latest'} snapshot.`
    : `Submission requirements and facts from the ${target.source_snapshot || 'latest'} snapshot.`
  return clip(`${lead} ${detail}`, 158)
})

usePageSeo(() => ({
  title: seoTitleBase.value,
  description: seoDescription.value,
  template: 'prefix',
  ogTitle: site.value?.name,
}))

const canonicalUrl = computed(() => `https://aifindr.org/backlink-sites/${slug.value}`)

// 结构化数据：面包屑 + 页面主体 + FAQ（FAQ 内容填入后自动出现）
const jsonLdScripts = computed(() => {
  const target = site.value
  if (!target) return []
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aifindr.org/' },
      { '@type': 'ListItem', position: 2, name: 'Submission sites', item: 'https://aifindr.org/backlink-sites' },
      { '@type': 'ListItem', position: 3, name: target.name, item: canonicalUrl.value },
    ],
  }
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seoTitle.value,
    description: seoDescription.value,
    mainEntityOfPage: canonicalUrl.value,
    dateModified: target.source_snapshot || undefined,
    author: { '@type': 'Organization', name: 'aifindr.org', url: 'https://aifindr.org/' },
    publisher: { '@type': 'Organization', name: 'aifindr.org', url: 'https://aifindr.org/' },
    about: productTypes.value.length ? [{
      '@type': 'SoftwareApplication',
      name: target.name,
      ...(target.site_url ? { url: target.site_url } : {}),
      applicationCategory: productTypes.value.join(', '),
    }] : undefined,
  }
  const schemas: Record<string, unknown>[] = [breadcrumb, article]
  if (faqItems.value.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.value.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    })
  }
  return schemas.map(schema => ({ type: 'application/ld+json', innerHTML: JSON.stringify(schema) }))
})

useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  meta: site.value && site.value.indexed === 0
    ? [{ name: 'robots', content: 'noindex, follow' }]
    : [],
  script: jsonLdScripts.value,
}))
</script>
