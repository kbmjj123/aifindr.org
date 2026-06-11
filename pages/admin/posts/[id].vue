<template>
  <div>
    <!-- Top bar -->
    <div class="flex items-center gap-3 mb-5">
      <NuxtLink to="/admin/posts" class="btn-ghost h-7 text-[11px] px-2">&larr; Back</NuxtLink>
      <span class="font-sans font-semibold text-[15px] tracking-tight truncate" style="color: var(--color-text-primary)">
        {{ isNew ? 'New Post' : `Editing: ${currentTitle || 'Untitled'}` }}
      </span>
      <div class="ml-auto flex gap-2">
        <button class="btn-secondary h-7 text-[10px] px-3" :disabled="saving" @click="save('draft')">
          Save Draft
        </button>
        <button class="btn-primary h-7 text-[10px] px-3" :disabled="saving" @click="save('published')">
          {{ isNew ? 'Publish' : currentPost?.status === 'draft' ? 'Publish' : 'Update' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Main editor area -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Slug -->
        <div>
          <label class="font-body text-[10px] uppercase tracking-wider mb-1 block"
            style="color: var(--color-text-muted)">Slug</label>
          <input v-model="form.slug" type="text"
            class="input h-8 text-[12px]" placeholder="post-url-slug" />
        </div>

        <!-- Language tabs -->
        <div class="flex gap-1 mb-3">
          <button v-for="l in locales" :key="l"
            class="filter-tab h-7 text-[10px] px-3"
            :class="{ active: activeLocale === l }"
            @click="activeLocale = l">
            {{ l === 'en' ? 'English' : '中文' }}
          </button>
        </div>

        <!-- Title -->
        <div>
          <label class="font-body text-[10px] uppercase tracking-wider mb-1 block"
            style="color: var(--color-text-muted)">Title ({{ activeLocale }})</label>
          <input v-model="form.translations[activeLocale].title" type="text"
            class="input h-8 text-[12px]" placeholder="Post title" />
        </div>

        <!-- Meta description -->
        <div>
          <label class="font-body text-[10px] uppercase tracking-wider mb-1 block"
            style="color: var(--color-text-muted)">Meta Description ({{ activeLocale }})</label>
          <textarea v-model="form.translations[activeLocale].meta_desc" rows="2"
            class="input h-auto min-h-[40px] py-2 resize-none text-[12px]"
            placeholder="SEO description for search engines" maxlength="160"></textarea>
          <span class="font-body text-[9px]" style="color: var(--color-text-muted)">
            {{ (form.translations[activeLocale].meta_desc || '').length }}/160
          </span>
        </div>

        <!-- Cover image -->
        <div>
          <label class="font-body text-[10px] uppercase tracking-wider mb-1 block"
            style="color: var(--color-text-muted)">Cover Image ({{ activeLocale }})</label>
          <ImageUploadSlot v-model="form.translations[activeLocale].cover_image" aspect="screenshot" />
        </div>

        <!-- Tiptap content -->
        <div>
          <label class="font-body text-[10px] uppercase tracking-wider mb-1 block"
            style="color: var(--color-text-muted)">Content ({{ activeLocale }})</label>
          <TiptapEditor v-model="form.translations[activeLocale].content" />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Custom fields -->
        <div class="p-4 rounded-lg" :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
          <h3 class="font-sans font-semibold text-[12px] mb-3" style="color: var(--color-text-primary)">
            Custom Fields
          </h3>
          <div v-for="(cf, i) in form.custom_fields" :key="i" class="flex gap-2 mb-2">
            <input v-model="cf.key" type="text" placeholder="Key"
              class="input h-7 text-[10px] flex-[2]" />
            <input v-model="cf.value" type="text" placeholder="Value"
              class="input h-7 text-[10px] flex-[3]" />
            <button class="btn-ghost h-7 w-7 text-[10px] flex-shrink-0 flex items-center justify-center"
              @click="form.custom_fields.splice(i, 1)">✕</button>
          </div>
          <button class="btn-ghost h-7 text-[10px] px-3" @click="form.custom_fields.push({ key: '', value: '' })">
            + Add Field
          </button>
        </div>

        <!-- Status info -->
        <div v-if="currentPost" class="p-4 rounded-lg" :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
          <div class="font-body text-[9px] uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">Status</div>
          <div class="font-body text-[12px] mb-3" style="color: var(--color-text-primary)">{{ currentPost.status }}</div>

          <div class="font-body text-[9px] uppercase tracking-wider mb-1" style="color: var(--color-text-muted)">Created</div>
          <div class="font-body text-[12px] mb-3" style="color: var(--color-text-primary)">
            {{ currentPost.created_at ? new Date(currentPost.created_at * 1000).toLocaleDateString() : '-' }}
          </div>

          <button class="btn-ghost h-7 text-[10px] px-3" style="color: var(--color-danger)" @click="remove">
            Delete Post
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { get, post } = useApi()
const route = useRoute()
const isNew = computed(() => route.params.id === 'new')

const locales = ['en', 'zh'] as const
const activeLocale = ref<'en' | 'zh'>('en')

interface TranslationForm {
  title: string
  content: string
  cover_image: string
  meta_desc: string
}

interface PostForm {
  slug: string
  translations: { en: TranslationForm; zh: TranslationForm }
  custom_fields: { key: string; value: string }[]
}

const form = reactive<PostForm>({
  slug: '',
  translations: {
    en: { title: '', content: '', cover_image: '', meta_desc: '' },
    zh: { title: '', content: '', cover_image: '', meta_desc: '' },
  },
  custom_fields: [],
})

const currentT = computed(() =>
  form.translations[activeLocale.value] || form.translations.en
)

const currentPost = ref<any>(null)
const saving = ref(false)

const currentTitle = computed(() =>
  form.translations.en?.title || form.translations.zh?.title || ''
)

onMounted(async () => {
  if (!isNew.value) {
    const id = route.params.id
    try {
      currentPost.value = await get<any>(`/api/admin/posts/${id}`)
      form.slug = currentPost.value.slug
      for (const locale of locales) {
        if (currentPost.value.translations?.[locale]) {
          form.translations[locale] = { ...currentPost.value.translations[locale] }
        }
      }
      form.custom_fields = (currentPost.value.custom_fields || []).map((cf: any) => ({
        key: cf.key,
        value: cf.value,
      }))
    } catch {
      navigateTo('/admin/posts')
    }
  }
})

async function save(status: 'draft' | 'published') {
  saving.value = true
  try {
    const body = {
      slug: form.slug,
      status,
      translations: form.translations,
      custom_fields: form.custom_fields.filter(cf => cf.key.trim()),
    }

    if (isNew.value) {
      const res = await post<any>('/api/admin/posts', body)
      navigateTo(`/admin/posts/${res.id}`, { replace: true })
    } else {
      const token = localStorage.getItem('aifindr-token')
      await $fetch(`/api/admin/posts/${route.params.id}`, {
        method: 'PUT',
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      currentPost.value = { ...currentPost.value, status }
    }

    // Publish: clear blog cache
    if (status === 'published') {
      await $fetch(`/api/blog/${form.slug}`).catch(() => {})
    }
  } catch (e: any) {
    alert(e?.data?.statusMessage || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!confirm('Delete this post permanently?')) return
  const token = localStorage.getItem('aifindr-token')
  await $fetch(`/api/admin/posts/${route.params.id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  navigateTo('/admin/posts')
}
</script>
