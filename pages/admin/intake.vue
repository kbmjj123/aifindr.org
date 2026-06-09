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
    </div>

    <!-- Step 1：粘贴 JSON -->
    <div class="p-5 rounded-xl space-y-3 mb-4"
      :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
      <p class="font-body text-[12px] font-medium" style="color: var(--color-text-primary)">
        Step 1 — Paste JSON
      </p>
      <textarea
        v-model="rawJson"
        rows="8"
        placeholder='{ "name": "...", "website": "...", ... }'
        class="w-full font-mono text-[11px] p-3 rounded-lg resize-none outline-none"
        :style="{
          background: 'var(--color-bg-input)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }"
      />
      <div class="flex items-center gap-3">
        <button
          class="btn-primary !h-[34px] !text-[12px] px-4"
          :disabled="!rawJson.trim() || parsing"
          @click="parseJson">
          {{ parsing ? 'Parsing...' : 'Parse & Fill' }}
        </button>
        <p v-if="parseError" class="font-body text-[11px]" style="color: var(--color-danger)">
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
        <div class="grid grid-cols-2 gap-x-6 gap-y-3">
          <div v-for="field in previewFields" :key="field.key">
            <p class="font-body text-[10px] mb-0.5" style="color: var(--color-text-muted)">
              {{ field.label }}
            </p>
            <p class="font-body text-[12px] truncate" style="color: var(--color-text-primary)">
              {{ field.value || '—' }}
            </p>
          </div>
        </div>

        <!-- 图片上传区 -->
        <div class="grid grid-cols-2 gap-4 pt-4 border-t"
          :style="{ borderColor: 'var(--color-border)' }">

          <!-- Logo -->
          <div class="space-y-2">
            <p class="font-body text-[11px] font-medium" style="color: var(--color-text-primary)">
              Logo (cover_image)
            </p>
            <div class="flex items-center gap-3">
              <img v-if="uploadedLogoUrl"
                :src="uploadedLogoUrl"
                class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                :style="{ border: '1px solid var(--color-border)' }" />
              <div v-else
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
                <span class="font-body text-[10px]" style="color: var(--color-text-muted)">—</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-mono text-[10px] truncate" style="color: var(--color-text-muted)">
                  {{ parsed.logo_url || '—' }}
                </p>
                <p v-if="uploadedLogoUrl"
                  class="font-mono text-[10px] truncate mt-0.5"
                  style="color: var(--color-success)">
                  ✓ Uploaded
                </p>
              </div>
            </div>
            <button
              class="btn-secondary !h-[28px] !text-[11px] px-3"
              :disabled="!parsed.logo_url || uploadingLogo"
              @click="uploadImage('logo')">
              {{ uploadingLogo ? 'Uploading...' : uploadedLogoUrl ? 'Re-upload' : 'Upload to R2' }}
            </button>
            <p v-if="logoError" class="font-body text-[11px]" style="color: var(--color-danger)">
              {{ logoError }}
            </p>
          </div>

          <!-- OG Image -->
          <div class="space-y-2">
            <p class="font-body text-[11px] font-medium" style="color: var(--color-text-primary)">
              OG Image (og_image)
            </p>
            <div class="flex items-center gap-3">
              <img v-if="uploadedOgUrl"
                :src="uploadedOgUrl"
                class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                :style="{ border: '1px solid var(--color-border)' }" />
              <div v-else
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
                <span class="font-body text-[10px]" style="color: var(--color-text-muted)">—</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-mono text-[10px] truncate" style="color: var(--color-text-muted)">
                  {{ parsed.og_image_url || '—' }}
                </p>
                <p v-if="uploadedOgUrl"
                  class="font-mono text-[10px] truncate mt-0.5"
                  style="color: var(--color-success)">
                  ✓ Uploaded
                </p>
              </div>
            </div>
            <button
              class="btn-secondary !h-[28px] !text-[11px] px-3"
              :disabled="!parsed.og_image_url || uploadingOg"
              @click="uploadImage('og_image')">
              {{ uploadingOg ? 'Uploading...' : uploadedOgUrl ? 'Re-upload' : 'Upload to R2' }}
            </button>
            <p v-if="ogError" class="font-body text-[11px]" style="color: var(--color-danger)">
              {{ ogError }}
            </p>
          </div>
        </div>

        <!-- 标签预览 -->
        <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
          <p class="font-body text-[11px] font-medium mb-2" style="color: var(--color-text-primary)">
            Tags
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="t in (parsed.tags || [])" :key="`${t.type}-${t.tag}`"
              class="font-body text-[10px] px-2 py-0.5 rounded-full"
              :style="{
                background: tagTypeColor(t.type).bg,
                color: tagTypeColor(t.type).text,
                border: `1px solid ${tagTypeColor(t.type).border}`,
              }">
              {{ t.type }}: {{ t.tag }}
            </span>
            <span v-if="!parsed.tags?.length"
              class="font-body text-[11px]"
              style="color: var(--color-text-muted)">
              No tags
            </span>
          </div>
        </div>

        <!-- Body 预览 -->
        <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
          <p class="font-body text-[11px] font-medium mb-2" style="color: var(--color-text-primary)">
            Body Preview
          </p>
          <div
            class="font-mono text-[11px] p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap"
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
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">
            Images:
          </span>
          <span class="font-body text-[11px]"
            :style="{ color: uploadedLogoUrl ? 'var(--color-success)' : 'var(--color-text-muted)' }">
            {{ uploadedLogoUrl ? '✓' : '○' }} Logo
          </span>
          <span class="font-body text-[11px]"
            :style="{ color: uploadedOgUrl ? 'var(--color-success)' : 'var(--color-text-muted)' }">
            {{ uploadedOgUrl ? '✓' : '○' }} OG Image
          </span>
          <span class="font-body text-[10px] ml-auto" style="color: var(--color-text-muted)">
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
          class="font-body text-[11px] text-center mt-2"
          style="color: var(--color-danger)">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess"
          class="font-body text-[11px] text-center mt-2"
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
})

// ── state ─────────────────────────────────────────────────────
const rawJson         = ref('')
const parsing         = ref(false)
const parseError      = ref('')
const parsed          = ref<any>(null)

const uploadingLogo   = ref(false)
const uploadingOg     = ref(false)
const uploadedLogoUrl = ref('')
const uploadedOgUrl   = ref('')
const logoError       = ref('')
const ogError         = ref('')

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
    uploadedOgUrl.value   = ''
    logoError.value       = ''
    ogError.value         = ''
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

// ── 标签颜色 ──────────────────────────────────────────────────
function tagTypeColor(type: string) {
  if (type === 'feature')  return { bg: 'var(--color-accent-dim)',  text: 'var(--color-accent)',  border: 'var(--color-accent-border)' }
  if (type === 'audience') return { bg: 'var(--color-warning-dim)', text: 'var(--color-warning)', border: 'var(--color-warning-border)' }
  return                          { bg: 'var(--color-success-dim)', text: 'var(--color-success)', border: 'var(--color-success-border)' }
}

// ── 上传图片到 R2 ──────────────────────────────────────────────
async function uploadImage(type: 'logo' | 'og_image') {
  if (!parsed.value) return
  const url  = type === 'logo' ? parsed.value.logo_url : parsed.value.og_image_url
  if (!url) return
  const slug = parsed.value.slug || parsed.value.name?.toLowerCase().replace(/\s+/g, '-')

  if (type === 'logo') { uploadingLogo.value = true; logoError.value = '' }
  else                 { uploadingOg.value   = true; ogError.value   = '' }

  try {
    const res = await post('/api/admin/upload-from-url', { url, type, slug })
    if (type === 'logo') uploadedLogoUrl.value = res.url
    else                 uploadedOgUrl.value   = res.url
  } catch (e: any) {
    const msg = e?.data?.message || e?.data?.statusMessage || 'Upload failed'
    if (type === 'logo') logoError.value = msg
    else                 ogError.value   = msg
  } finally {
    if (type === 'logo') uploadingLogo.value = false
    else                 uploadingOg.value   = false
  }
}

// ── 发布工具 ──────────────────────────────────────────────────
async function publish() {
  if (!parsed.value || submitting.value) return
  submitting.value  = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const { logo_url, og_image_url, ...rest } = parsed.value
    const payload = {
      ...rest,
      cover_image: uploadedLogoUrl.value || undefined,
      og_image:    uploadedOgUrl.value   || undefined,
    }
    const res = await post('/api/admin/tools', payload)
    submitSuccess.value = res.slug

    // 3秒后重置，准备下一条录入
    setTimeout(() => {
      rawJson.value       = ''
      parsed.value        = null
      uploadedLogoUrl.value = ''
      uploadedOgUrl.value   = ''
      submitSuccess.value   = ''
    }, 3000)
  } catch (e: any) {
    submitError.value = e?.data?.message || e?.data?.statusMessage || 'Publish failed'
  } finally {
    submitting.value = false
  }
}
</script>