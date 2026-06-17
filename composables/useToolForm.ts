import { CATEGORIES } from '~/types/tool'
import { SUBCATEGORIES, FEATURE_TAGS, AUDIENCE_TAGS, USE_CASE_TAGS } from '~/types/category'

export interface ToolFormState {
  name:             string
  website:          string
  category:         string
  subCategory:      string
  pricing:          'free' | 'freemium' | 'paid'
  priceDetail:      string
  priceTiers:       PriceTierItem[]
  hasFreeTrial:     boolean
  shortDescription: string
  description:      string      // one-line → meta_description
  detailDescription: string    // markdown body
  platforms:        string[]
  launched:         string
  featureTags:      string[]
  audienceTags:     string[]
  useCaseTags:      string[]
  submitterEmail:   string
  coverImage:       string     // logo URL
  screenshots:      string[]   // 3 slots
  demoVideo:        string
  submitterSite:    string
  submitterGithub:  string
}

export interface PriceTierItem {
  name: string
  price: number
  period: string
  featuresStr: string
}

/** Tool data from API (SELECT *) — used to populate form */
export interface ApiToolData {
  id: number
  name: string
  slug: string
  website: string
  category: string
  sub_category: string | null
  pricing: 'free' | 'freemium' | 'paid'
  price_starting: number | null
  price_detail: string | null
  price_tiers: string | null
  has_free_trial: number | null
  platforms: string | null
  launched: string | null
  meta_description: string | null
  short_description: string | null
  body: string | null
  faq: string | null
  logo: string | null
  screenshots: string | null
  featured: number | null
  verified: number | null
  editor_pick: number | null
  status: string
  submitter_site: string | null
  submitter_github: string | null
  submitter_id: number | null
  data_source: string | null
  submitted_at: string
  last_verified: string | null
  updated_at: string | null
  tags?: { type: string; tag: string }[]
}

function defaultForm(): ToolFormState {
  return {
    name:             '',
    website:          '',
    category:         '',
    subCategory:      '',
    pricing:          'free',
    priceDetail:      '',
    priceTiers:       [],
    hasFreeTrial:     false,
    shortDescription: '',
    description:      '',
    detailDescription: '',
    platforms:        [],
    launched:         '',
    featureTags:      [],
    audienceTags:     [],
    useCaseTags:      [],
    submitterEmail:   '',
    coverImage:       '',
    screenshots:      ['', '', ''],
    demoVideo:        '',
    submitterSite:    '',
    submitterGithub:  '',
  }
}

export function useToolForm() {
  const form = reactive<ToolFormState>(defaultForm())

  // ── computed options ──────────────────────────────────────

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

  const pricingOptions: { value: string; label: string }[] = [
    { value: 'free',     label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid',     label: 'Paid' },
  ]

  const periodOptions: { value: string; label: string }[] = [
    { value: '',          label: '—' },
    { value: 'month',     label: '/mo' },
    { value: 'year',      label: '/yr' },
    { value: 'one-time',  label: 'one-time' },
  ]

  const platformOptions: { value: string; label: string }[] = [
    { value: 'web',     label: 'Web' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile',  label: 'Mobile' },
    { value: 'api',     label: 'API' },
  ]

  // ── helpers ───────────────────────────────────────────────

  function addTier() {
    form.priceTiers.push({ name: '', price: 0, period: 'month', featuresStr: '' })
  }

  function serializeTiers(tiers: PriceTierItem[]): string | undefined {
    const valid = tiers.filter(t => t.name.trim())
    if (!valid.length) return undefined
    return JSON.stringify(valid.map(t => {
      const tier: Record<string, unknown> = {
        name: t.name.trim(),
        price: Number(t.price) || 0,
        period: t.period || null,
        features: t.featuresStr ? t.featuresStr.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      const price = tier.price as number
      if (price === 0 && !tier.period) tier.type = 'free'
      else if (tier.period === 'one-time') tier.type = 'subscription'
      else if (tier.period) tier.type = 'subscription'
      else tier.type = 'credits'
      return tier
    }))
  }

  /** Parse price_tiers JSON string back into form fields */
  function deserializeTiers(json: string | null): PriceTierItem[] {
    if (!json) return []
    try {
      const arr = JSON.parse(json)
      if (!Array.isArray(arr)) return []
      return arr.map((t: Record<string, unknown>) => ({
        name: String(t.name || ''),
        price: Number(t.price) || 0,
        period: String(t.period || 'month'),
        featuresStr: Array.isArray(t.features) ? t.features.join(', ') : '',
      }))
    } catch { return [] }
  }

  /** Parse comma-separated platforms string into array */
  function parsePlatforms(val: string | null | string[]): string[] {
    if (!val) return []
    if (Array.isArray(val)) return val
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }

  /** Parse screenshots JSON string into array of 3 slots */
  function parseScreenshots(val: string | null): string[] {
    if (!val) return ['', '', '']
    try {
      const arr = JSON.parse(val)
      if (!Array.isArray(arr)) return ['', '', '']
      const slots: string[] = ['', '', '']
      arr.forEach((url: string, i: number) => { if (i < 3) slots[i] = url })
      return slots
    } catch { return ['', '', ''] }
  }

  // ── load from existing tool ───────────────────────────────

  function loadFromTool(tool: ApiToolData) {
    form.name              = tool.name || ''
    form.website           = tool.website || ''
    form.category          = tool.category || ''
    form.subCategory       = tool.sub_category || ''
    form.pricing           = (tool.pricing as 'free' | 'freemium' | 'paid') || 'free'
    form.priceDetail       = tool.price_detail || ''
    form.priceTiers        = deserializeTiers(tool.price_tiers)
    form.hasFreeTrial      = tool.has_free_trial === 1
    form.shortDescription  = tool.short_description || ''
    form.description       = tool.meta_description || ''
    form.detailDescription = tool.body || ''
    form.platforms         = parsePlatforms(tool.platforms)
    form.launched          = tool.launched || ''
    form.coverImage        = tool.logo || ''
    form.screenshots       = parseScreenshots(tool.screenshots)
    form.submitterSite     = tool.submitter_site || ''
    form.submitterGithub   = tool.submitter_github || ''

    // tags
    form.featureTags  = []
    form.audienceTags = []
    form.useCaseTags  = []
    if (Array.isArray(tool.tags)) {
      for (const t of tool.tags) {
        if (t.type === 'feature')  form.featureTags.push(t.tag)
        if (t.type === 'audience') form.audienceTags.push(t.tag)
        if (t.type === 'use_case') form.useCaseTags.push(t.tag)
      }
    }
  }

  /** Reset to empty form */
  function resetForm() {
    Object.assign(form, defaultForm())
  }

  // ── serialize to submit API payload ──────────────────────

  function toSubmitPayload() {
    const screenshotUrls = form.screenshots.filter(Boolean)

    const tags = [
      ...form.featureTags.map(t  => ({ type: 'feature',  tag: t })),
      ...form.audienceTags.map(t => ({ type: 'audience', tag: t })),
      ...form.useCaseTags.map(t  => ({ type: 'use_case', tag: t })),
    ]

    return {
      name:             form.name,
      website:          form.website,
      category:         form.category,
      sub_category:     form.subCategory || undefined,
      pricing:          form.pricing,
      price_detail:     form.priceDetail || undefined,
      price_tiers:      serializeTiers(form.priceTiers),
      has_free_trial:   form.hasFreeTrial ? 1 : 0,
      short_description: form.shortDescription || undefined,
      description:      form.description,
      detailDescription: form.detailDescription,
      platforms:        form.platforms,
      launched:         form.launched || undefined,
      tags,
      submitter_site:   form.submitterSite   || undefined,
      submitter_github: form.submitterGithub || undefined,
      submitter_email:  form.submitterEmail  || undefined,
      logo:             form.coverImage      || undefined,
      screenshot_urls:  screenshotUrls.length > 0 ? screenshotUrls.join(',') : undefined,
      demo_video_url:   form.demoVideo       || undefined,
    }
  }

  /** Serialize to admin update API payload (PUT /api/admin/tools/:id) */
  function toAdminPayload(adminFields?: {
    featured?: boolean
    verified?: boolean
    editor_pick?: boolean
    status?: string
  }) {
    const screenshotUrls = form.screenshots.filter(Boolean)
    const screenshots = screenshotUrls.length > 0 ? JSON.stringify(screenshotUrls) : null
    const priceTiers = serializeTiers(form.priceTiers)
    const tags = [
      ...form.featureTags.map(t  => ({ type: 'feature',  tag: t })),
      ...form.audienceTags.map(t => ({ type: 'audience', tag: t })),
      ...form.useCaseTags.map(t  => ({ type: 'use_case', tag: t })),
    ]

    return {
      name:              form.name,
      website:           form.website,
      category:          form.category,
      sub_category:      form.subCategory || null,
      pricing:           form.pricing,
      price_detail:      form.priceDetail || null,
      price_tiers:       priceTiers || null,
      has_free_trial:    form.hasFreeTrial ? 1 : 0,
      short_description: form.shortDescription || null,
      meta_description:  form.description || null,
      body:              form.detailDescription || null,
      platforms:         form.platforms.join(',') || null,
      launched:          form.launched || null,
      tags,
      logo:              form.coverImage || null,
      screenshots,
      submitter_site:    form.submitterSite   || null,
      submitter_github:  form.submitterGithub || null,
      // admin-only overrides
      ...(adminFields?.featured    !== undefined ? { featured:    adminFields.featured    ? 1 : 0 } : {}),
      ...(adminFields?.verified    !== undefined ? { verified:    adminFields.verified    ? 1 : 0 } : {}),
      ...(adminFields?.editor_pick !== undefined ? { editor_pick: adminFields.editor_pick ? 1 : 0 } : {}),
      ...(adminFields?.status      !== undefined ? { status:      adminFields.status } : {}),
    }
  }

  // ── watchers ─────────────────────────────────────────────

  watch(() => form.category, () => {
    form.subCategory = ''
    form.useCaseTags = []
  })

  watch(() => form.pricing, (val) => {
    if (val === 'free') {
      form.priceDetail  = ''
      form.priceTiers   = []
      form.hasFreeTrial = false
    }
  })

  return {
    // state
    form,
    // constants
    FEATURE_TAGS,
    AUDIENCE_TAGS,
    // computed options
    categoryOptions,
    subCategoryOptions,
    useCaseTagOptions,
    pricingOptions,
    periodOptions,
    platformOptions,
    // helpers
    addTier,
    serializeTiers,
    deserializeTiers,
    loadFromTool,
    resetForm,
    toSubmitPayload,
    toAdminPayload,
  }
}
