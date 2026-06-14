<template>
  <div class="admin-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]"
          :style="{ color: 'var(--color-text-primary)' }">
          Admin Panel
        </h1>
        <p class="font-body text-[12px] mt-1"
          :style="{ color: 'var(--color-text-muted)' }">
          Publish tools directly from SOP output
        </p>
      </div>
    </div>

    <!-- Nav Tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <NuxtLink to="/admin"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Review Submissions
      </NuxtLink>
      <NuxtLink to="/admin/intake"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }">
        Tool Intake
      </NuxtLink>
      <NuxtLink to="/admin/users"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Users
      </NuxtLink>
    </div>

    <!-- Step 1：粘贴 JSON -->
    <div class="p-5 rounded-xl space-y-3 mb-4"
      :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
      <p class="font-body text-[12px] font-medium" style="color: var(--color-text-primary)">
        Step 1 — Paste JSON
      </p>
      <textarea
        v-model="rawJson"
        rows="12"
        placeholder='{ "name": "...", "website": "...", ... }'
        class="w-full font-mono text-[13px] p-3 rounded-lg resize-none outline-none"
        :style="{
          background: 'var(--color-bg-input)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }"
      />
      <div class="flex items-center gap-3">
        <button
          class="btn-primary !h-[44px] !text-[12px] px-4"
          :disabled="!rawJson.trim() || parsing"
          @click="parseJson">
          {{ parsing ? 'Parsing...' : 'Parse & Fill' }}
        </button>
        <p v-if="parseError" class="font-body text-[13px]" style="color: var(--color-danger)">
          {{ parseError }}
        </p>
      </div>
    </div>

    <!-- Step 2：预览 + 图片上传 -->
    <template v-if="parsed">
      <div class="p-5 rounded-xl space-y-5 mb-4"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
        <p class="font-body text-[12px] font-medium" style="color: var(--color-text-primary)">
          Step 2 — Preview & Upload Images
        </p>

        <!-- 基础字段预览 -->
        <div class="grid grid-cols-1 gap-x-6 gap-y-3">
          <div v-for="field in previewFields" :key="field.key">
            <p class="font-body text-[12px] mb-0.5" style="color: var(--color-text-muted)">
              {{ field.label }}
            </p>
            <p class="font-body text-[12px] truncate" style="color: var(--color-text-primary)">
              {{ field.value || '—' }}
            </p>
          </div>
        </div>

        <!-- 图片上传区 -->
        <div class="pt-4 border-t space-y-4"
          :style="{ borderColor: 'var(--color-border)' }">
          <div>
            <p class="font-body text-[13px] font-medium mb-2" style="color: var(--color-text-primary)">
              Logo
            </p>
            <ImageUploadSlot v-model="uploadedLogoUrl" aspect="square" />
          </div>
          <div>
            <p class="font-body text-[13px] font-medium mb-2" style="color: var(--color-text-primary)">
              Screenshots <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(up to 3)</span>
            </p>
            <div class="flex flex-wrap gap-3">
              <ImageUploadSlot v-for="i in 3" :key="i" v-model="uploadedScreenshots[i - 1]" aspect="screenshot" />
            </div>
          </div>
        </div>

        <!-- 标签预览 -->
        <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
          <p class="font-body text-[13px] font-medium mb-2" style="color: var(--color-text-primary)">
            Tags
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="t in (parsed.tags || [])" :key="`${t.type}-${t.tag}`"
              class="font-body text-[12px] px-2 py-0.5 rounded-full"
              :style="{
                background: tagTypeColor(t.type).bg,
                color: tagTypeColor(t.type).text,
                border: `1px solid ${tagTypeColor(t.type).border}`,
              }">
              {{ t.type }}: {{ t.tag }}
            </span>
            <span v-if="!parsed.tags?.length"
              class="font-body text-[13px]"
              style="color: var(--color-text-muted)">
              No tags
            </span>
          </div>
        </div>

        <!-- Body 预览 -->
        <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
          <p class="font-body text-[13px] font-medium mb-2" style="color: var(--color-text-primary)">
            Body Preview
          </p>
          <div
            class="font-mono text-[13px] p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap"
            :style="{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }">
            {{ parsed.body || '—' }}
          </div>
        </div>
      </div>

      <!-- Step 3：发布 -->
      <div class="p-5 rounded-xl"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
        <p class="font-body text-[12px] font-medium mb-3" style="color: var(--color-text-primary)">
          Step 3 — Publish
        </p>

        <!-- 图片上传状态提示 -->
        <div class="flex items-center gap-4 p-3 rounded-lg mb-4"
          :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
          <span class="font-body text-[13px]" style="color: var(--color-text-muted)">
            Images:
          </span>
          <span class="font-body text-[13px]"
            :style="{ color: uploadedLogoUrl ? 'var(--color-success)' : 'var(--color-text-muted)' }">
            {{ uploadedLogoUrl ? '✓' : '○' }} Logo
          </span>
          <span class="font-body text-[13px]"
            :style="{ color: screenshotCount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }">
            {{ screenshotCount > 0 ? '✓' : '○' }} {{ screenshotCount }}/3 Screenshots
          </span>
          <span class="font-body text-[12px] ml-auto" style="color: var(--color-text-muted)">
            Images are optional — tool will publish without them
          </span>
        </div>

        <button
          class="btn-primary w-full !h-[40px] !text-[13px]"
          :disabled="submitting"
          @click="publish">
          {{ submitting ? 'Publishing...' : 'Publish Tool' }}
        </button>

        <p v-if="submitError"
          class="font-body text-[13px] text-center mt-2"
          style="color: var(--color-danger)">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess"
          class="font-body text-[13px] text-center mt-2"
          style="color: var(--color-success)">
          ✓ Published! Slug: <span class="font-mono">{{ submitSuccess }}</span>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { post } = useApi()

usePageSeo({
  title: 'Tool Intake — Admin',
  template: 'prefix',
  description: 'Admin tool intake page for publishing tools directly.',
  noOg: true,
})

// ── state ─────────────────────────────────────────────────────
const rawJson         = ref('')
const parsing         = ref(false)
const parseError      = ref('')
const parsed          = ref<any>(null)

const uploadedLogoUrl = ref('')
const uploadedScreenshots = reactive<string[]>(['', '', ''])

const submitting      = ref(false)
const submitError     = ref('')
const submitSuccess   = ref('')

// ── 解析 JSON ─────────────────────────────────────────────────
function parseJson() {
  parseError.value = ''
  parsing.value    = true
  try {
    const data    = JSON.parse(rawJson.value.trim())
    const required = ['name', 'website', 'category', 'pricing']
    const missing  = required.filter(f => !data[f])
    if (missing.length > 0) {
      parseError.value = `Missing required fields: ${missing.join(', ')}`
      return
    }
    parsed.value          = data
    uploadedLogoUrl.value = ''
    uploadedScreenshots.fill('')
    submitError.value     = ''
    submitSuccess.value   = ''
  } catch {
    parseError.value = 'Invalid JSON format'
  } finally {
    parsing.value = false
  }
}

// ── 基础字段预览 ──────────────────────────────────────────────
const previewFields = computed(() => {
  if (!parsed.value) return []
  const p = parsed.value
  return [
    { key: 'name',           label: 'Name',           value: p.name },
    { key: 'slug',           label: 'Slug',           value: p.slug },
    { key: 'website',        label: 'Website',        value: p.website },
    { key: 'category',       label: 'Category',       value: p.category },
    { key: 'sub_category',   label: 'Sub Category',   value: p.sub_category },
    { key: 'pricing',        label: 'Pricing',        value: p.pricing },
    { key: 'price_detail',   label: 'Price Detail',   value: p.price_detail },
    { key: 'has_free_trial', label: 'Free Trial',     value: p.has_free_trial ? 'Yes' : 'No' },
    { key: 'platforms',      label: 'Platforms',      value: Array.isArray(p.platforms) ? p.platforms.join(', ') : p.platforms },
    { key: 'launched',       label: 'Launched',       value: p.launched },
    { key: 'meta_description', label: 'Meta Description', value: p.meta_description },
  ]
})

// ── 截图计数 ─────────────────────────────────────────────────
const screenshotCount = computed(() => uploadedScreenshots.filter(Boolean).length)

// ── 标签颜色 ──────────────────────────────────────────────────
function tagTypeColor(type: string) {
  if (type === 'feature')  return { bg: 'var(--color-accent-dim)',  text: 'var(--color-accent)',  border: 'var(--color-accent-border)' }
  if (type === 'audience') return { bg: 'var(--color-warning-dim)', text: 'var(--color-warning)', border: 'var(--color-warning-border)' }
  return                          { bg: 'var(--color-success-dim)', text: 'var(--color-success)', border: 'var(--color-success-border)' }
}

// ── 发布工具 ──────────────────────────────────────────────────
async function publish() {
  if (!parsed.value || submitting.value) return
  submitting.value  = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const jsonSs = Array.isArray(parsed.value.screenshots) ? parsed.value.screenshots : []
    const uploadedSs = uploadedScreenshots.filter(Boolean)
    const allScreenshots = [...jsonSs, ...uploadedSs].slice(0, 3)

    const payload = {
      ...parsed.value,
      logo:       uploadedLogoUrl.value || undefined,
      screenshots: allScreenshots.length > 0 ? allScreenshots : undefined,
    }
    delete payload.screenshots_url

    const res = await post('/api/admin/tools', payload)
    submitSuccess.value = res.slug

    // 3秒后重置，准备下一条录入
    setTimeout(() => {
      rawJson.value       = ''
      parsed.value        = null
      uploadedLogoUrl.value = ''
      uploadedScreenshots.fill('')
      submitSuccess.value   = ''
    }, 3000)
  } catch (e: any) {
    submitError.value = e?.data?.message || e?.data?.statusMessage || 'Publish failed'
  } finally {
    submitting.value = false
  }
}
</script>
