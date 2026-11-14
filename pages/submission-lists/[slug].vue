<template>
  <div v-if="list">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <NuxtLink to="/submission-lists">Submission lists</NuxtLink><span class="sep">/</span>
      <span class="current">{{ list.title }}</span>
    </nav>

    <h1 class="font-sans font-extrabold text-[26px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      {{ list.title }}
    </h1>
    <p class="font-body text-[13px] leading-relaxed mb-4" style="color: var(--color-text-secondary)">{{ list.intro }}</p>
    <div class="flex flex-wrap items-center gap-3 mb-8">
      <span class="badge badge-new">{{ total }} platforms</span>
      <a :href="`/api/submission-lists/${slug}/export?format=csv`" class="font-body text-[11px] no-underline"
        style="color: var(--color-text-link)">Download CSV ↗</a>
      <a :href="`/api/submission-lists/${slug}/export?format=json`" class="font-body text-[11px] no-underline"
        style="color: var(--color-text-link)">Download JSON ↗</a>
    </div>

    <div v-if="pending" class="text-center py-20 font-body text-[13px]" style="color: var(--color-text-muted)">Loading list...</div>
    <div v-else-if="sites.length === 0" class="empty-state">
      <div class="icon">🔍</div>
      <h3>No platforms in this list yet</h3>
      <NuxtLink to="/submission-lists" class="btn-secondary no-underline">Browse other lists</NuxtLink>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
      <SubmissionSiteCard v-for="site in sites" :key="site.slug" :site="site" />
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <button class="btn-secondary !h-8 !px-3" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">← Prev</button>
      <button v-for="p in visiblePages" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goPage(p)">{{ p }}</button>
      <button class="btn-secondary !h-8 !px-3" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">Next →</button>
    </div>

    <section class="mt-10 max-w-[760px]">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">How this list is built</h2>
      <p class="font-body text-[12px] leading-relaxed mb-6" style="color: var(--color-text-secondary)">{{ list.methodology }}</p>

      <template v-if="faq.length">
        <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">FAQ</h2>
        <div v-for="item in faq" :key="item.question" class="mb-4">
          <h3 class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">{{ item.question }}</h3>
          <p class="font-body text-[12px] leading-relaxed" style="color: var(--color-text-secondary)">{{ item.answer }}</p>
        </div>
      </template>
    </section>

    <div class="mt-8 font-body text-[11px]" style="color: var(--color-text-muted)">
      {{ attribution }}
      <div class="mt-2">
        <NuxtLink to="/backlink-sites" style="color: var(--color-text-link)">Browse all 848 platforms →</NuxtLink>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="icon">🔍</div>
    <h3>List not found</h3>
    <NuxtLink to="/submission-lists" class="btn-secondary no-underline">Browse lists</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import {
  SUBMISSION_ATTRIBUTION, type SubmissionList, type SubmissionListDetailResponse, type SubmissionSite,
} from '~/types/submissionSite'

const route = useRoute()
const router = useRouter()
const { get } = useApi()
const slug = computed(() => String(route.params.slug || ''))
const currentPage = ref(Math.max(1, Number(route.query.page) || 1))
const pageSize = 48
const attribution = SUBMISSION_ATTRIBUTION

watch(currentPage, (page) => {
  router.replace({ query: page > 1 ? { page: String(page) } : {} }).catch(() => {})
})

const apiQuery = computed(() => `page=${currentPage.value}&pageSize=${pageSize}`)
const { data, pending } = useAsyncData<SubmissionListDetailResponse | null>(
  () => `submission-list-${slug.value}-${apiQuery.value}`,
  () => get<SubmissionListDetailResponse>(`/api/submission-lists/${slug.value}?${apiQuery.value}`).catch(() => null),
  { watch: [apiQuery], default: () => null },
)

const list = computed<SubmissionList | null>(() => data.value?.list ?? null)
const sites = computed<SubmissionSite[]>(() => data.value?.sites ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
const faq = computed<{ question: string; answer: string }[]>(() => {
  try { return JSON.parse(list.value?.faq || '[]') } catch { return [] }
})

function goPage(p: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, p))
}

usePageSeo(() => ({
  // seo_title 已含站点后缀，这里用纯标题交给 prefix 模板统一拼接
  title: list.value?.title || 'Submission List',
  template: 'prefix',
  description: list.value?.seo_description || list.value?.description || 'A focused list of product submission platforms.',
}))
useHead(() => ({
  // 分页页自指 canonical，避免所有分页都被折叠到第 1 页
  link: [{
    rel: 'canonical',
    href: `https://aifindr.org/submission-lists/${slug.value}`
      + (currentPage.value > 1 ? `?page=${currentPage.value}` : ''),
  }],
}))
</script>
