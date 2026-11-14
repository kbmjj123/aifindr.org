<template>
  <div>
    <div class="mb-6">
      <h1 class="font-sans font-extrabold text-[24px] tracking-tight" style="color: var(--color-text-primary)">
        Where to submit for a backlink
        <span class="font-body font-normal text-[14px]" style="color: var(--color-text-muted)">({{ total }})</span>
      </h1>
      <p class="font-body text-[13px] mt-1" style="color: var(--color-text-secondary)">
        A free, open directory of {{ facets.total }} places that accept product and website submissions.
        Filter by cost, link type, approval speed and topic, then open the submission page directly.
      </p>
    </div>

    <SubmissionFilters v-model="filters" :facets="facets" class="mb-6" @reset="resetFilters" />

    <!-- Browse by list -->
    <section v-if="lists.length" class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-sans font-bold text-[16px]" style="color: var(--color-text-primary)">Browse by list</h2>
        <NuxtLink to="/submission-lists" class="font-body text-[11px] no-underline" style="color: var(--color-text-link)">
          All lists →
        </NuxtLink>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        <SubmissionListCard v-for="list in lists.slice(0, 6)" :key="list.slug" :list="list" />
      </div>
    </section>

    <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">All submission platforms</h2>
    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">
      Loading platforms...
    </div>
    <div v-else-if="sites.length === 0" class="empty-state">
      <div class="icon">🔍</div>
      <h3>No platforms found</h3>
      <p>Try clearing a filter or searching a different name.</p>
      <button class="btn-secondary" type="button" @click="resetFilters">Clear filters</button>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
      <SubmissionSiteCard v-for="site in sites" :key="site.slug" :site="site" />
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <button class="btn-secondary !h-8 !px-3" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">← Prev</button>
      <button v-for="p in visiblePages" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
      <button class="btn-secondary !h-8 !px-3" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">Next →</button>
    </div>

    <div class="mt-10 rounded-lg p-5" :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
      <h2 class="font-sans font-bold text-[15px] mb-2" style="color: var(--color-text-primary)">About this data</h2>
      <p class="font-body text-[11px] leading-relaxed" style="color: var(--color-text-secondary)">
        {{ attribution }} Facts are a 2026-11-13 snapshot and are not independently verified; always check the live
        submission page before relying on pricing or link attributes. All explanatory text here is written by aifindr.org.
      </p>
      <div class="flex flex-wrap items-center gap-3 mt-3">
        <NuxtLink to="/backlink-sites/data" class="font-body text-[11px] no-underline" style="color: var(--color-text-link)">
          Download the open dataset →
        </NuxtLink>
        <NuxtLink to="/submit" class="font-body text-[11px] no-underline" style="color: var(--color-text-link)">
          Submit your tool to aifindr.org →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  EMPTY_SUBMISSION_FILTERS, FILTER_CANONICAL_MAP, SUBMISSION_ATTRIBUTION,
  type SubmissionFacets, type SubmissionFilterState, type SubmissionList,
  type SubmissionSite, type SubmissionSiteListResponse,
} from '~/types/submissionSite'

const route = useRoute()
const router = useRouter()
const { get } = useApi()
const attribution = SUBMISSION_ATTRIBUTION

const emptyFacets: SubmissionFacets = {
  pricing: {}, dofollow: {}, backlinkRequired: {}, approvalBucket: {},
  submitMethod: {}, categories: {}, total: 0, withSubmitUrl: 0,
}

const filters = ref<SubmissionFilterState>({ ...EMPTY_SUBMISSION_FILTERS })
for (const key of Object.keys(EMPTY_SUBMISSION_FILTERS) as (keyof SubmissionFilterState)[]) {
  const value = route.query[key]
  if (typeof value === 'string') filters.value[key] = value
}
const currentPage = ref(Math.max(1, Number(route.query.page) || 1))
const pageSize = 24

const debouncedQ = ref(filters.value.q)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(() => filters.value.q, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { debouncedQ.value = value }, 250)
})

watch([filters, currentPage], ([f, pg]) => {
  const query: Record<string, string> = {}
  for (const key of Object.keys(EMPTY_SUBMISSION_FILTERS) as (keyof SubmissionFilterState)[]) {
    if (f[key] && f[key] !== EMPTY_SUBMISSION_FILTERS[key]) query[key] = f[key]
  }
  if (pg > 1) query.page = String(pg)
  router.replace({ query }).catch(() => {})
}, { deep: true })

const apiQuery = computed(() => {
  const params = new URLSearchParams()
  for (const key of Object.keys(filters.value) as (keyof SubmissionFilterState)[]) {
    const value = key === 'q' ? debouncedQ.value : filters.value[key]
    if (value && value !== EMPTY_SUBMISSION_FILTERS[key]) params.set(key, value)
  }
  params.set('page', String(currentPage.value))
  params.set('pageSize', String(pageSize))
  return params.toString()
})

const { data: result, pending } = useAsyncData<SubmissionSiteListResponse>(
  () => `submission-sites-${apiQuery.value}`,
  () => get<SubmissionSiteListResponse>(`/api/submission-sites?${apiQuery.value}`),
  { watch: [apiQuery], default: () => ({ sites: [], total: 0, page: 1, pageSize, facets: emptyFacets }) },
)

const { data: listResult } = useAsyncData<{ lists: SubmissionList[] }>(
  'submission-lists-index',
  () => get<{ lists: SubmissionList[] }>('/api/submission-lists'),
  { default: () => ({ lists: [] }) },
)

const sites = computed<SubmissionSite[]>(() => result.value?.sites ?? [])
const total = computed(() => result.value?.total ?? 0)
const facets = computed(() => result.value?.facets ?? emptyFacets)
const lists = computed(() => listResult.value?.lists ?? [])
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goPage(p: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, p))
}
function resetFilters() {
  filters.value = { ...EMPTY_SUBMISSION_FILTERS }
  debouncedQ.value = ''
  currentPage.value = 1
}

/** 筛选组合命中已发布榜单时 canonical 指向榜单页；其余带参数组合不索引，避免重复/门页 */
const filterKey = computed(() => (Object.keys(filters.value) as (keyof SubmissionFilterState)[])
  .filter(key => !['sort', 'q'].includes(key) && filters.value[key])
  .map(key => `${key}=${filters.value[key]}`)
  .sort()
  .join('|'))
const canonicalPath = computed(() => {
  if (!filterKey.value && !filters.value.q && currentPage.value === 1) return '/backlink-sites'
  if (currentPage.value === 1 && !filters.value.q && FILTER_CANONICAL_MAP[filterKey.value]) {
    return FILTER_CANONICAL_MAP[filterKey.value]
  }
  return ''
})
const hasParams = computed(() => !!filterKey.value || !!filters.value.q || currentPage.value > 1)

usePageSeo({
  title: 'Where to Submit for a Backlink — Free Submission Site Directory',
  template: 'prefix',
  description: 'A free, open directory of 848 places to submit your product or website for a listing. Filter by cost, dofollow links, domain rating and approval speed.',
})
useHead(() => ({
  link: canonicalPath.value
    ? [{ rel: 'canonical', href: `https://aifindr.org${canonicalPath.value}` }]
    : [],
  meta: hasParams.value && !canonicalPath.value
    ? [{ name: 'robots', content: 'noindex, follow' }]
    : [],
}))
</script>
