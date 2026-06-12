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
          {{ postTitle }}
        </h1>
        <span class="font-body text-[12px]" style="color: var(--color-text-muted)">
          {{ formatDate(post.published_at) }}
        </span>
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
const siteUrl = 'https://aifindr.org'

const post = ref<any>(null)
const loading = ref(true)
const error = ref(false)

const postTitle = computed(() =>
  post.value?.translations?.en?.title || ''
)
const content = computed(() =>
  post.value?.translations?.en?.content || ''
)
const coverImage = computed(() =>
  post.value?.translations?.en?.cover_image || ''
)

function formatDate(ts: number | string) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Canonical URL (known from route, no need to wait)
useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/blog/${slug.value}` }],
})

onMounted(async () => {
  try {
    post.value = await $fetch(`/api/blog/${slug.value}`)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

usePageSeo(() => ({
  title: postTitle.value || 'Blog Post',
  template: 'blog',
  description: post.value?.translations?.en?.meta_desc || '',
}))

// Article-level SEO: Schema + OG meta
watch(post, (val) => {
  if (!val) return
  const en = val.translations?.en || {}
  const title = en.title || ''
  const description = en.meta_desc || ''
  const cover = en.cover_image || ''
  const url = `${siteUrl}/blog/${val.slug}`
  const publishedAt = val.published_at ? new Date(val.published_at * 1000).toISOString() : ''
  const updatedAt = val.updated_at ? new Date(val.updated_at * 1000).toISOString() : ''

  useHead({
    meta: [
      { property: 'og:type', content: 'article' },
      ...(publishedAt ? [{ property: 'article:published_time', content: publishedAt }] : []),
      ...(updatedAt ? [{ property: 'article:modified_time', content: updatedAt }] : []),
      ...(cover ? [
        { property: 'og:image', content: cover },
        { name: 'twitter:image', content: cover },
      ] : []),
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          image: cover || undefined,
          datePublished: publishedAt || undefined,
          dateModified: updatedAt || undefined,
          author: { '@type': 'Organization', name: 'aifindr.org', url: siteUrl },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        }),
      },
    ],
  })
})
</script>
