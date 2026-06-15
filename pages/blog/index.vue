<template>
  <div>
    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Blog
    </h1>
    <p class="font-body text-[12px] mb-8" style="color: var(--color-text-muted)">
      Latest updates, tool reviews, and AI industry insights.
    </p>

    <!-- Loading -->
    <div v-if="loading" class="grid gap-3">
      <div v-for="i in 4" :key="i" class="skeleton h-[100px] rounded-lg"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="posts.length === 0" class="empty-state">
      <div class="text-[28px]">📝</div>
      <h3>No posts yet</h3>
      <p>Check back soon for new content.</p>
    </div>

    <!-- Post list -->
    <div v-else class="grid gap-3">
      <NuxtLink v-for="post in posts" :key="post.slug" :to="`/blog/${post.slug}`"
        class="block p-5 rounded-lg transition-colors"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
        @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'">
        <h2 class="font-sans font-semibold text-[15px] mb-1" style="color: var(--color-text-primary)">
          {{ post.title }}
        </h2>
        <p v-if="post.meta_desc" class="font-body text-[12px] mb-2 line-clamp-2" style="color: var(--color-text-secondary)">
          {{ post.meta_desc }}
        </p>
        <span class="font-body text-[10px]" style="color: var(--color-text-muted)">
          {{ formatDate(post.published_at || post.created_at) }}
        </span>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-center gap-3 mt-8">
      <button class="page-btn text-[11px]" :disabled="page <= 1" @click="page--; loadPosts()">‹ Prev</button>
      <span class="font-body text-[11px]" style="color: var(--color-text-muted)">
        Page {{ page }} of {{ totalPages }}
      </span>
      <button class="page-btn text-[11px]" :disabled="page >= totalPages" @click="page++; loadPosts()">Next ›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const pageSize = 10
const posts = ref<any[]>([])
const total = ref(0)
const loading = ref(true)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function formatDate(ts: number | string) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function loadPosts() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    const res = await $fetch(`/api/blog?${params}`)
    posts.value = (res as any).posts || []
    total.value = (res as any).total || 0
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

usePageSeo({
  title: 'Blog',
  template: 'blog',
  description: 'Latest updates, AI tool reviews, and industry insights from the aifindr.org team.',
})

onMounted(loadPosts)
</script>
