<template>
  <div>
    <NuxtLink to="/blog" class="font-body text-[12px] mb-4 inline-block" style="color: var(--color-text-secondary)">
      &larr; Back to Blog
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="skeleton h-8 w-2/3 rounded-md"></div>
      <div class="skeleton h-4 w-1/3 rounded-md"></div>
      <div class="skeleton h-64 rounded-md mt-6"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <div class="text-[28px]">🔍</div>
      <h3>Post not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <NuxtLink to="/blog" class="btn-secondary mt-2">Browse all posts</NuxtLink>
    </div>

    <!-- Post content -->
    <article v-else-if="post">
      <header class="mb-8">
        <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
          {{ post.translations?.en?.title || post.translations?.zh?.title }}
        </h1>
        <div class="flex items-center gap-3">
          <span class="font-body text-[12px]" style="color: var(--color-text-muted)">
            {{ formatDate(post.published_at) }}
          </span>
          <span class="font-body text-[10px] px-2 py-0.5 rounded-full"
            :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }">
            {{ activeLocale === 'en' ? 'English' : '中文' }}
          </span>
        </div>
        <!-- Language switcher -->
        <div v-if="hasZh" class="flex gap-2 mt-3">
          <button v-for="l in availableLocales" :key="l"
            class="filter-tab h-6 text-[9px] px-2"
            :class="{ active: activeLocale === l }"
            @click="activeLocale = l">
            {{ l === 'en' ? 'English' : '中文' }}
          </button>
        </div>
      </header>

      <!-- Cover image -->
      <img v-if="coverImage" :src="coverImage" :alt="postTitle"
        class="w-full rounded-lg mb-8 object-cover"
        :style="{ border: '1px solid var(--color-border)', maxHeight: '400px' }" />

      <!-- Content -->
      <div v-if="content" class="markdown" v-html="content"></div>
      <div v-else class="font-body text-[13px]" style="color: var(--color-text-muted)">
        No content available for this language.
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const post = ref<any>(null)
const loading = ref(true)
const error = ref(false)
const activeLocale = ref('en')

const availableLocales = ref<string[]>([])

const hasZh = computed(() => availableLocales.value.includes('zh'))
const postTitle = computed(() =>
  post.value?.translations?.[activeLocale.value]?.title
  || post.value?.translations?.en?.title
  || ''
)
const content = computed(() =>
  post.value?.translations?.[activeLocale.value]?.content
  || ''
)
const coverImage = computed(() =>
  post.value?.translations?.[activeLocale.value]?.cover_image
  || ''
)

function formatDate(ts: number | string) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(async () => {
  try {
    const res = await $fetch(`/api/blog/${slug.value}`)
    post.value = res
    availableLocales.value = Object.keys((res as any).translations || {})
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

usePageSeo(() => ({
  title: postTitle.value || 'Blog Post',
  template: 'blog',
  description: post.value?.translations?.en?.meta_desc || 'Blog post on aifindr.org',
}))
</script>
