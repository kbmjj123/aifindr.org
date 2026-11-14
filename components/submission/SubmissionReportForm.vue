<template>
  <form class="rounded-lg p-5 flex flex-col gap-3" :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
    @submit.prevent="submit">
    <div>
      <label class="detail-sidebar-label" for="report-kind">What would you like to report?</label>
      <select id="report-kind" v-model="kind" class="select">
        <option value="correction">A correction to an existing entry</option>
        <option value="new_site">A platform missing from the directory</option>
        <option value="takedown">Remove or hide an entry</option>
      </select>
    </div>

    <div>
      <label class="detail-sidebar-label" for="report-slug">Platform slug {{ kind === 'new_site' ? '(optional)' : '*' }}</label>
      <input id="report-slug" v-model="siteSlug" class="input" placeholder="e.g. product-hunt" />
    </div>

    <div>
      <label class="detail-sidebar-label" for="report-detail">
        {{ kind === 'new_site' ? 'Name, website, submission URL, pricing...' : 'What should change?' }}
      </label>
      <textarea id="report-detail" v-model="detail" class="textarea !h-[100px]" required />
    </div>

    <div>
      <label class="detail-sidebar-label" for="report-contact">Contact (optional)</label>
      <input id="report-contact" v-model="contact" class="input" placeholder="Email or GitHub handle" />
    </div>

    <div v-if="!isDev" ref="turnstileEl" class="flex items-center justify-center min-h-[65px]"></div>
    <p v-if="error" class="font-body text-[11px]" style="color: var(--color-danger)">{{ error }}</p>
    <p v-if="success" class="font-body text-[11px]" style="color: var(--color-success)">{{ success }}</p>

    <button class="btn-primary self-start" type="submit" :disabled="submitting">
      {{ submitting ? 'Sending...' : 'Send report' }}
    </button>
    <p class="font-body text-[10px]" style="color: var(--color-text-muted)">
      Reports are reviewed before anything changes in the public dataset.
    </p>
  </form>
</template>

<script setup lang="ts">
import type { SubmissionSiteReport } from '~/types/submissionSite'

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (element: HTMLElement) => void
  reset: (widgetId?: string) => void
}

const { post } = useApi()
const isDev = import.meta.dev
const kind = ref<SubmissionSiteReport['kind']>('correction')
const siteSlug = ref('')
const detail = ref('')
const contact = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

const turnstileEl = ref<HTMLElement>()
const widgetId = ref<string>()
const cfToken = ref('')
let checkTimer: ReturnType<typeof setInterval> | undefined

function getTurnstile(): TurnstileApi | undefined {
  if (import.meta.server) return undefined
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile
}

onMounted(() => {
  if (isDev) return
  if (!document.querySelector('script[data-turnstile]')) {
    const script = document.createElement('script')
    // 使用 explicit render，无需 onload 回调
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.dataset.turnstile = '1'
    document.head.appendChild(script)
  }
  checkTimer = setInterval(() => {
    const ts = getTurnstile()
    if (ts && turnstileEl.value) {
      if (checkTimer) clearInterval(checkTimer)
      widgetId.value = ts.render(turnstileEl.value, {
        sitekey: '0x4AAAAAADLaTYMVN6qFivFT',
        callback: (token: string) => { cfToken.value = token; error.value = '' },
        'expired-callback': () => { cfToken.value = '' },
        'error-callback': () => { error.value = 'CAPTCHA failed to load. Please reload the page.' },
      })
    }
  }, 200)
})

onUnmounted(() => {
  if (checkTimer) clearInterval(checkTimer)
  const ts = getTurnstile()
  if (ts && turnstileEl.value) ts.remove(turnstileEl.value)
})

async function submit() {
  error.value = ''
  success.value = ''
  if (!detail.value.trim()) {
    error.value = 'Please describe the change.'
    return
  }
  if (kind.value !== 'new_site' && !siteSlug.value.trim()) {
    error.value = 'Please enter the platform slug.'
    return
  }
  submitting.value = true
  try {
    await post('/api/submission-sites/suggest', {
      kind: kind.value,
      site_slug: siteSlug.value.trim(),
      contact: contact.value.trim(),
      turnstileToken: cfToken.value,
      payload: {
        detail: detail.value.trim(),
        submitted_via: 'public-report-form',
      },
    })
    success.value = 'Thanks — your report is queued for review.'
    detail.value = ''
    siteSlug.value = ''
    const ts = getTurnstile()
    if (ts && widgetId.value) ts.reset(widgetId.value)
    cfToken.value = ''
  } catch (e) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Could not send the report. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
