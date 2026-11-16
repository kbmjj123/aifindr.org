<template>
  <div v-if="site">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <NuxtLink to="/backlink-sites">Submission sites</NuxtLink><span class="sep">/</span>
      <span class="current">{{ site.name }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-6">
      <main class="flex-1 min-w-0">
        <h1 class="font-sans font-extrabold text-[26px] tracking-tight mb-2" style="color: var(--color-text-primary)">
          {{ site.name }}
        </h1>
        <p class="font-body text-[13px] leading-relaxed mb-6" style="color: var(--color-text-secondary)">
          {{ site.editorial || site.summary }}
        </p>

        <div class="flex flex-wrap gap-2 mb-8">
          <a v-if="site.site_url" :href="site.site_url" target="_blank" rel="nofollow noopener noreferrer"
            class="btn-primary no-underline">Visit website ↗</a>
        </div>
        <p v-if="!site.submit_url" class="font-body text-[11px] mb-8" style="color: var(--color-warning)">
          A direct submission URL was not recorded in this snapshot. Visit the platform site to find the current form.
        </p>

        <section class="mb-8">
          <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">What to check before submitting</h2>
          <ul class="font-body text-[12px] leading-relaxed space-y-1.5" style="color: var(--color-text-secondary)">
            <li v-for="point in factPoints" :key="point">· {{ point }}</li>
            <li v-for="check in submissionChecks" :key="check">· {{ check }}</li>
          </ul>
        </section>

        <section v-if="productTypes.length" class="mb-8">
          <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">What this platform accepts</h2>
          <p class="font-body text-[12px] leading-relaxed mb-3" style="color: var(--color-text-secondary)">
            Product types recorded in the {{ site?.source_snapshot || 'latest' }} snapshot. These are factual tags, not a guarantee that a given submission will be accepted.
          </p>
          <div class="flex flex-wrap gap-2">
            <span v-for="type in productTypes" :key="type" class="tag">{{ type }}</span>
          </div>
        </section>

        <section v-if="categories.length" class="mb-8">
          <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Topics</h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink v-for="category in categories" :key="category"
              :to="`/backlink-sites?category=${category}`" class="tag no-underline">
              {{ category.replace(/-/g, ' ') }}
            </NuxtLink>
          </div>
        </section>

        <section v-if="lists.length" class="mb-8">
          <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Appears in these lists</h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink v-for="list in lists" :key="list.slug" :to="`/submission-lists/${list.slug}`" class="tag no-underline">
              {{ list.title }}
            </NuxtLink>
          </div>
        </section>

        <section v-if="related.length" class="mb-8">
          <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Similar platforms</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NuxtLink v-for="item in related" :key="item.slug" :to="`/backlink-sites/${item.slug}`"
              class="rounded-lg p-3 no-underline font-body text-[12px]"
              :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
              {{ item.name }}
              <span v-if="item.domain_rating !== null" class="ml-2" style="color: var(--color-text-muted)">DR {{ item.domain_rating }}</span>
            </NuxtLink>
          </div>
        </section>

        <div class="font-body text-[11px]" style="color: var(--color-text-muted)">
          Spotted a mistake? <NuxtLink to="/backlink-sites/data#report" style="color: var(--color-text-link)">Report a correction</NuxtLink>.
        </div>
      </main>

      <aside class="w-full lg:w-[290px] shrink-0">
        <SubmissionFacts :site="site" />
        <div class="mt-4 rounded-lg p-4" :style="{ border: '1px solid var(--color-accent-border)', background: 'var(--color-bg-surface)' }">
          <h3 class="font-sans font-bold text-[13px] mb-2" style="color: var(--color-text-primary)">Want a dofollow link from us?</h3>
          <p class="font-body text-[11px] leading-relaxed mb-3" style="color: var(--color-text-secondary)">
            Submit your AI tool to aifindr.org and, once approved, get three permanent dofollow backlinks. Free forever.
          </p>
          <NuxtLink to="/submit" class="btn-secondary no-underline !h-8">Submit a Tool →</NuxtLink>
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

const { data } = useAsyncData<DetailResponse>(
  () => `submission-site-${slug.value}`,
  () => get<DetailResponse>(`/api/submission-sites/${slug.value}`).catch(() => emptyDetail()),
  { default: emptyDetail },
)

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

usePageSeo(() => ({
  title: site.value ? `${site.value.name} — Submission Requirements & Link Details` : 'Submission Site',
  template: 'prefix',
  description: site.value?.editorial || site.value?.summary || 'Submission platform details.',
}))

useHead(() => ({
  link: [{ rel: 'canonical', href: `https://aifindr.org/backlink-sites/${slug.value}` }],
  meta: site.value && site.value.indexed === 0
    ? [{ name: 'robots', content: 'noindex, follow' }]
    : [],
  script: site.value ? [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aifindr.org/' },
        { '@type': 'ListItem', position: 2, name: 'Submission sites', item: 'https://aifindr.org/backlink-sites' },
        { '@type': 'ListItem', position: 3, name: site.value.name, item: `https://aifindr.org/backlink-sites/${slug.value}` },
      ],
    }),
  }] : [],
}))
</script>
