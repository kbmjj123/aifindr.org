<template>
  <div class="p-6 rounded-xl"
    :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
    <LoginPrompt v-if="!isLoggedIn" message="Sign in with GitHub to submit your AI tool." />

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">

      <!-- Tool Name -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Tool Name <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.name" placeholder="e.g. Midjourney" @blur="checkDuplicate" />
        <div v-if="duplicateWarning" class="flex items-start gap-2 mt-2 p-3 rounded-lg"
          :style="{ background: 'var(--color-featured-bg)', border: '1px solid var(--color-featured-border)' }">
          <span class="text-base shrink-0 mt-0.5">⚠️</span>
          <div class="font-body text-[12px] leading-relaxed" style="color: var(--color-featured-text)">
            <strong>Already exists:</strong>
            <NuxtLink v-if="duplicateWarning.slug" :to="duplicateWarning.link"
              class="font-medium ml-1" style="color: var(--color-text-link); text-decoration: underline">
              {{ duplicateWarning.name }}
            </NuxtLink>
            <span v-else class="ml-1">{{ duplicateWarning.name }}</span>
            ({{ duplicateWarning.status }}).
            <button type="button" class="underline ml-1" style="color: var(--color-text-muted)"
              @click="duplicateWarning = null">Dismiss</button>
          </div>
        </div>
      </div>

      <!-- Website -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Website URL <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.website" placeholder="https://midjourney.com" />
      </div>

      <!-- Category -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Category <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseSelect v-model="form.category" :options="categoryOptions" />
      </div>

      <!-- Sub Category（联动 category） -->
      <div v-if="form.category && subCategoryOptions.length > 0">
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Sub Category <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseSelect v-model="form.subCategory" :options="subCategoryOptions" />
      </div>

      <!-- Pricing -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Pricing Type <span style="color: var(--color-danger)">*</span>
        </label>
        <div class="flex gap-2">
          <label v-for="p in pricingOptions" :key="p.value"
            class="flex-1 flex items-center justify-center gap-1.5 h-[34px] rounded-md text-[12px] font-body cursor-pointer"
            :style="{
              background: form.pricing === p.value ? 'var(--color-accent-dim)' : 'var(--color-bg-input)',
              border: '1px solid ' + (form.pricing === p.value ? 'var(--color-accent)' : 'var(--color-border)'),
              color: form.pricing === p.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }">
            <input type="radio" :value="p.value" v-model="form.pricing" class="sr-only" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Price Detail（freemium / paid 时显示） -->
      <div v-if="form.pricing !== 'free'">
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Pricing Detail
        </label>
        <BaseInput v-model="form.priceDetail" placeholder="e.g. Free 10 credits/day / Pro $12/month" />
      </div>

      <!-- Has Free Trial（paid 时显示） -->
      <div v-if="form.pricing === 'paid'">
        <label class="flex items-center gap-2 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
          <input type="checkbox" v-model="form.hasFreeTrial" class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
          Offers a free trial
        </label>
      </div>

      <!-- One-line Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          One-line Description <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.description" placeholder="Briefly describe your tool" maxlength="80" />
        <p class="font-body text-[11px] mt-1 text-right" style="color: var(--color-text-muted)">
          {{ form.description.length }}/80
        </p>
      </div>

      <!-- Detailed Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Detailed Description <span style="color: var(--color-danger)">*</span>
        </label>
        <MarkdownEditor v-model="form.detailDescription" />
      </div>

      <!-- Platforms -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Platforms
        </label>
        <div class="flex flex-wrap gap-3">
          <label v-for="p in platformOptions" :key="p.value"
            class="flex items-center gap-1.5 font-body text-[12px] cursor-pointer"
            style="color: var(--color-text-secondary)">
            <input type="checkbox" :value="p.value" v-model="form.platforms"
              class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Launched -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Launch Year
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </label>
        <BaseInput v-model="form.launched" placeholder="e.g. 2023" maxlength="4" />
      </div>

      <!-- Tags -->
      <div class="space-y-4">
        <p class="font-body text-[12px] font-medium" style="color: var(--color-text-primary)">Tags</p>

        <!-- Feature Tags -->
        <div>
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">Features</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in FEATURE_TAGS" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.featureTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.featureTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.featureTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
              }">
              <input type="checkbox" :value="t.value" v-model="form.featureTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>

        <!-- Audience Tags -->
        <div>
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">
            Audience <span style="color: var(--color-text-muted)">(up to 3)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in AUDIENCE_TAGS" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.audienceTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.audienceTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.audienceTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
                opacity: !form.audienceTags.includes(t.value) && form.audienceTags.length >= 3 ? '0.4' : '1',
                pointerEvents: !form.audienceTags.includes(t.value) && form.audienceTags.length >= 3 ? 'none' : 'auto',
              }">
              <input type="checkbox" :value="t.value" v-model="form.audienceTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>

        <!-- Use Case Tags（根据父分类动态加载） -->
        <div v-if="form.category && useCaseTagOptions.length > 0">
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">
            Use Cases <span style="color: var(--color-text-muted)">(up to 3)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in useCaseTagOptions" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.useCaseTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.useCaseTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.useCaseTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
                opacity: !form.useCaseTags.includes(t.value) && form.useCaseTags.length >= 3 ? '0.4' : '1',
                pointerEvents: !form.useCaseTags.includes(t.value) && form.useCaseTags.length >= 3 ? 'none' : 'auto',
              }">
              <input type="checkbox" :value="t.value" v-model="form.useCaseTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Contact Email -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Contact Email <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.submitterEmail" type="email" placeholder="you@example.com" />
        <p class="font-body text-[11px] mt-1" style="color: var(--color-text-muted)">
          Used only for submission status updates. Never shown publicly.
        </p>
      </div>

      <!-- Media -->
      <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <p class="font-body text-[12px] font-medium mb-4" style="color: var(--color-text-primary)">
          Media <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </p>

        <div class="mb-4">
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Tool Icon
          </label>
          <ImageUploadSlot v-model="form.coverImage" aspect="square" />
        </div>

        <div class="mb-4">
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Screenshots <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(up to 3)</span>
          </label>
          <div class="space-y-2">
            <ImageUploadSlot v-for="(_, i) in form.screenshots" :key="i"
              v-model="form.screenshots[i]" aspect="screenshot" />
          </div>
        </div>

        <div>
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Demo Video URL
          </label>
          <BaseInput v-model="form.demoVideo" placeholder="https://youtube.com/watch?v=..." />
        </div>
      </div>

      <!-- Submitter -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Your Website
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional — gets a dofollow backlink)</span>
        </label>
        <BaseInput v-model="form.submitterSite" placeholder="https://your-site.com" />
      </div>

      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          GitHub Username
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </label>
        <div v-if="user" class="flex items-center gap-2 p-2 rounded-md"
          :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
          <img v-if="user.avatar_url" :src="user.avatar_url" class="w-6 h-6 rounded-full" />
          <div class="flex-1 min-w-0">
            <p class="font-body text-[12px] truncate" style="color: var(--color-text-primary)">{{ user.username }}</p>
          </div>
          <span class="font-body text-[10px] px-1.5 py-0.5 rounded"
            :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }">GitHub</span>
        </div>
        <div v-else>
          <BaseInput v-model="form.submitterGithub" placeholder="your-github-username" />
        </div>
      </div>

      <!-- Turnstile -->
      <div v-if="!isDev" ref="turnstileEl" class="flex items-center justify-center min-h-[65px]"></div>
      <p v-if="turnstileError" class="font-body text-[11px] text-center" style="color: var(--color-danger)">
        {{ turnstileError }}
      </p>

      <button type="submit"
        class="btn-primary w-full flex items-center justify-center gap-2 !h-[40px] !text-[13px]"
        :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit for Review' }}
      </button>

      <p v-if="submitError" class="font-body text-[11px] text-center mt-2" style="color: var(--color-danger)">
        {{ submitError }}
      </p>
      <p v-else class="font-body text-[11px] text-center" style="color: var(--color-text-muted)">
        Submitted tools will be reviewed by our team before publishing.
      </p>

    </form>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'
import { SUBCATEGORIES, FEATURE_TAGS, AUDIENCE_TAGS, USE_CASE_TAGS } from '~/types/category'

const { post, get } = useApi()
const { user, isLoggedIn } = useAuth()

// ── form state ────────────────────────────────────────────────
const form = reactive({
  name:             '',
  website:          '',
  category:         '',
  subCategory:      '',
  pricing:          'free' as 'free' | 'freemium' | 'paid',
  priceDetail:      '',
  hasFreeTrial:     false,
  description:      '',
  detailDescription:'',
  platforms:        [] as string[],
  launched:         '',
  featureTags:      [] as string[],
  audienceTags:     [] as string[],
  useCaseTags:      [] as string[],
  submitterEmail:   '',
  coverImage:       '',
  screenshots:      ['', '', ''],
  demoVideo:        '',
  submitterSite:    '',
  submitterGithub:  '',
})

// ── duplicate check ──────────────────────────────────────────
const duplicateWarning = ref<{ name: string; slug: string; link: string; status: string } | null>(null)
let checkTimeout: ReturnType<typeof setTimeout> | null = null

async function checkDuplicate() {
  const name = form.name.trim()
  if (!name || name.length < 2) return
  try {
    const res = await get<{ exists: boolean; tool?: { name: string; slug: string; category: string; status: string } }>(
      `/api/tools/check-name?name=${encodeURIComponent(name)}`
    )
    if (res.exists && res.tool) {
      duplicateWarning.value = {
        name: res.tool.name,
        slug: res.tool.slug,
        link: `/tools/${res.tool.category}/${res.tool.slug}?preview=1`,
        status: res.tool.status,
      }
    }
  } catch {
    // silent — non-blocking check
  }
}

// ── computed options ──────────────────────────────────────────
const categoryOptions = computed(() => [
  { value: '', label: 'Select a category...', disabled: true },
  ...CATEGORIES.map(c => ({ value: c.slug, label: `${c.emoji} ${c.name}` })),
])

const subCategoryOptions = computed(() => {
  if (!form.category) return []
  return [
    { value: '', label: 'Select a sub-category...', disabled: true },
    ...(SUBCATEGORIES[form.category] || []),
  ]
})

const useCaseTagOptions = computed(() => USE_CASE_TAGS[form.category] || [])

const pricingOptions = [
  { value: 'free',     label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid',     label: 'Paid' },
]

const platformOptions = [
  { value: 'web',     label: 'Web' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile',  label: 'Mobile' },
  { value: 'api',     label: 'API' },
]

// ── watchers ──────────────────────────────────────────────────
// category 变化时，重置子分类和 use_case 标签
watch(() => form.category, () => {
  form.subCategory = ''
  form.useCaseTags = []
})

// pricing 变化时，重置相关字段
watch(() => form.pricing, (val) => {
  if (val === 'free') {
    form.priceDetail  = ''
    form.hasFreeTrial = false
  }
})

// 预填登录用户信息
watch(user, (u) => {
  if (!u) return
  if (u.contact_email)  form.submitterEmail  = u.contact_email
  else if (u.email)     form.submitterEmail  = u.email
  if (u.username)       form.submitterGithub = u.username
}, { immediate: true })

// ── Turnstile ─────────────────────────────────────────────────
const isDev              = import.meta.dev
const submitting         = ref(false)
const submitError        = ref('')
const turnstileEl        = ref<HTMLDivElement>()
const cfToken            = ref('')
const turnstileError     = ref('')
const turnstileWidgetId  = ref<string | undefined>()

onMounted(() => {
  if (isDev) {
    cfToken.value = '1x00000000000000000000'
    return
  }
  const script    = document.createElement('script')
  script.src      = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
  script.async    = true
  script.defer    = true
  document.head.appendChild(script)

  const check = setInterval(() => {
    const ts = (window as any).turnstile
    if (ts && turnstileEl.value) {
      clearInterval(check)
      turnstileWidgetId.value = ts.render(turnstileEl.value, {
        sitekey:           '0x4AAAAAADLaTYMVN6qFivFT',
        callback:          (token: string) => { cfToken.value = token; turnstileError.value = '' },
        'expired-callback':() => { cfToken.value = ''; turnstileError.value = 'CAPTCHA expired, please verify again.' },
        'error-callback':  () => { cfToken.value = ''; turnstileError.value = 'CAPTCHA verification error.' },
      })
    }
  }, 200)
})

onUnmounted(() => {
  const ts = (window as any).turnstile
  if (ts && turnstileEl.value) ts.remove(turnstileEl.value)
})

// ── submit ────────────────────────────────────────────────────
async function handleSubmit() {
  if (submitting.value) return
  submitError.value = ''

  if (!form.submitterEmail.trim()) {
    submitError.value = 'Contact Email is required'
    return
  }

  submitting.value = true

  try {
    const screenshotUrls = form.screenshots.filter(Boolean)

    const tags = [
      ...form.featureTags.map(t  => ({ type: 'feature',  tag: t })),
      ...form.audienceTags.map(t => ({ type: 'audience', tag: t })),
      ...form.useCaseTags.map(t  => ({ type: 'use_case', tag: t })),
    ]

    const res = await post<{ success: boolean; slug: string; category: string }>('/api/submit', {
      name:             form.name,
      website:          form.website,
      category:         form.category,
      sub_category:     form.subCategory || undefined,
      pricing:          form.pricing,
      price_detail:     form.priceDetail || undefined,
      has_free_trial:   form.hasFreeTrial ? 1 : 0,
      description:      form.description,
      detailDescription:form.detailDescription,
      platforms:        form.platforms,
      launched:         form.launched || undefined,
      tags,
      submitter_site:   form.submitterSite   || undefined,
      submitter_github: form.submitterGithub || undefined,
      submitter_email:  form.submitterEmail  || undefined,
      cover_image:      form.coverImage      || undefined,
      screenshot_urls:  screenshotUrls.length > 0 ? screenshotUrls.join(',') : undefined,
      demo_video_url:   form.demoVideo       || undefined,
      turnstileToken:   cfToken.value,
    })

    if (res?.slug && res?.category) {
      navigateTo(`/tools/${res.category}/${res.slug}?preview=1`)
    } else {
      navigateTo('/submit?success=1')
    }
  } catch (e: any) {
    submitError.value = e?.data?.error || 'Submission failed. Please try again.'
    if (!isDev) {
      const ts = (window as any).turnstile
      if (ts && turnstileWidgetId.value) ts.reset(turnstileWidgetId.value)
      cfToken.value = ''
    }
  } finally {
    submitting.value = false
  }
}
</script>