<template>
  <div class="p-6 rounded-xl"
    :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
    <form class="space-y-5" @submit.prevent="handleSubmit">

      <!-- Tool Name -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Tool Name <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.name" placeholder="e.g. Midjourney" />
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
            <label v-for="t in featureTagOptions" :key="t.value"
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
            <label v-for="t in audienceTagOptions" :key="t.value"
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

const { post } = useApi()
const { user } = useAuth()

// ── 标签库（与后端 VALID_TAGS 保持一致） ─────────────────────
const featureTagOptions = [
  { value: 'free-tier',      label: 'Free Tier' },
  { value: 'no-signup',      label: 'No Signup' },
  { value: 'open-source',    label: 'Open Source' },
  { value: 'api-available',  label: 'API Available' },
  { value: 'browser-based',  label: 'Browser Based' },
  { value: 'offline-local',  label: 'Offline / Local' },
  { value: 'freemium',       label: 'Freemium' },
]

const audienceTagOptions = [
  { value: 'developer',       label: 'Developer' },
  { value: 'designer',        label: 'Designer' },
  { value: 'marketer',        label: 'Marketer' },
  { value: 'student',         label: 'Student' },
  { value: 'content-creator', label: 'Content Creator' },
  { value: 'small-business',  label: 'Small Business' },
  { value: 'freelancer',      label: 'Freelancer' },
  { value: 'researcher',      label: 'Researcher' },
]

// use_case 按父分类预置，category 变化时动态加载
const useCaseMap: Record<string, { value: string; label: string }[]> = {
  image: [
    { value: 'image-generation',   label: 'Image Generation' },
    { value: 'image-upscaling',    label: 'Image Upscaling' },
    { value: 'background-removal', label: 'Background Removal' },
    { value: 'logo-design',        label: 'Logo Design' },
    { value: 'illustration',       label: 'Illustration' },
  ],
  writing: [
    { value: 'copywriting',          label: 'Copywriting' },
    { value: 'blog-writing',         label: 'Blog Writing' },
    { value: 'email-writing',        label: 'Email Writing' },
    { value: 'paraphrasing',         label: 'Paraphrasing' },
    { value: 'seo-content',          label: 'SEO Content' },
    { value: 'product-description',  label: 'Product Description' },
  ],
  video: [
    { value: 'video-generation',   label: 'Video Generation' },
    { value: 'video-editing',      label: 'Video Editing' },
    { value: 'subtitles-captions', label: 'Subtitles & Captions' },
    { value: 'avatar-video',       label: 'Avatar Video' },
    { value: 'animation',          label: 'Animation' },
  ],
  audio: [
    { value: 'music-generation',   label: 'Music Generation' },
    { value: 'text-to-speech',     label: 'Text to Speech' },
    { value: 'voice-cloning',      label: 'Voice Cloning' },
    { value: 'transcription',      label: 'Transcription' },
    { value: 'audio-enhancement',  label: 'Audio Enhancement' },
  ],
  code: [
    { value: 'code-completion', label: 'Code Completion' },
    { value: 'code-review',     label: 'Code Review' },
    { value: 'sql-generation',  label: 'SQL Generation' },
    { value: 'test-generation', label: 'Test Generation' },
    { value: 'documentation',   label: 'Documentation' },
  ],
  productivity: [
    { value: 'meeting-notes',        label: 'Meeting Notes' },
    { value: 'pdf-summarization',    label: 'PDF Summarization' },
    { value: 'workflow-automation',  label: 'Workflow Automation' },
    { value: 'scheduling',           label: 'Scheduling' },
    { value: 'task-management',      label: 'Task Management' },
  ],
  marketing: [
    { value: 'seo-optimization',   label: 'SEO Optimization' },
    { value: 'social-media',       label: 'Social Media' },
    { value: 'ad-copy',            label: 'Ad Copy' },
    { value: 'landing-page',       label: 'Landing Page' },
    { value: 'competitor-analysis',label: 'Competitor Analysis' },
  ],
  data: [
    { value: 'data-analysis',      label: 'Data Analysis' },
    { value: 'chart-visualization', label: 'Chart Visualization' },
    { value: 'spreadsheet',        label: 'Spreadsheet' },
    { value: 'dashboard',          label: 'Dashboard' },
    { value: 'report-generation',  label: 'Report Generation' },
  ],
  education: [
    { value: 'homework-help',      label: 'Homework Help' },
    { value: 'math-solving',       label: 'Math Solving' },
    { value: 'flashcards',         label: 'Flashcards' },
    { value: 'language-learning',  label: 'Language Learning' },
    { value: 'course-creation',    label: 'Course Creation' },
  ],
  business: [
    { value: 'business-planning', label: 'Business Planning' },
    { value: 'contract-review',   label: 'Contract Review' },
    { value: 'invoicing',         label: 'Invoicing' },
    { value: 'pitch-deck',        label: 'Pitch Deck' },
    { value: 'recruiting',        label: 'Recruiting' },
    { value: 'customer-support',  label: 'Customer Support' },
  ],
  research: [
    { value: 'academic-research',    label: 'Academic Research' },
    { value: 'paper-summarization',  label: 'Paper Summarization' },
    { value: 'citation',             label: 'Citation' },
    { value: 'fact-checking',        label: 'Fact Checking' },
    { value: 'web-scraping',         label: 'Web Scraping' },
  ],
  other: [
    { value: 'local-llm',        label: 'Local LLM' },
    { value: 'rag',              label: 'RAG' },
    { value: 'ai-directory',     label: 'AI Directory' },
    { value: 'open-source-tool', label: 'Open Source Tool' },
  ],
}

// ── 子分类映射（与后端 VALID_SUB_CATEGORIES 保持一致） ────────
const subCategoryMap: Record<string, { value: string; label: string }[]> = {
  image: [
    { value: 'image-generation',  label: 'Image Generation' },
    { value: 'image-upscaling',   label: 'Image Upscaling & Enhancement' },
    { value: 'background-removal',label: 'Background Removal' },
    { value: 'logo-branding',     label: 'Logo & Branding' },
    { value: 'illustration',      label: 'Illustration & Art' },
  ],
  writing: [
    { value: 'ai-writing',          label: 'AI Writing' },
    { value: 'essay-longform',      label: 'Essay & Long-form' },
    { value: 'copywriting',         label: 'Copywriting' },
    { value: 'blog-seo',            label: 'Blog & SEO Writing' },
    { value: 'paraphrasing',        label: 'Paraphrasing' },
    { value: 'email-writing',       label: 'Email Writing' },
    { value: 'product-description', label: 'Product Description' },
  ],
  video: [
    { value: 'video-generation',    label: 'Video Generation' },
    { value: 'video-editing',       label: 'Video Editing' },
    { value: 'video-enhancement',   label: 'Video Enhancement' },
    { value: 'avatar-talking-head', label: 'Avatar & Talking Head' },
    { value: 'subtitles-captions',  label: 'Subtitles & Captions' },
    { value: 'animation',           label: 'Animation' },
  ],
  audio: [
    { value: 'music-generation',  label: 'Music Generation' },
    { value: 'text-to-speech',    label: 'Text to Speech' },
    { value: 'voice-cloning',     label: 'Voice Cloning' },
    { value: 'transcription',     label: 'Transcription' },
    { value: 'audio-enhancement', label: 'Audio Enhancement' },
  ],
  code: [
    { value: 'ai-coding-assistants', label: 'AI Coding Assistants' },
    { value: 'code-generation',      label: 'Code Generation' },
    { value: 'code-review',          label: 'Code Review' },
    { value: 'sql-database',         label: 'SQL & Database' },
    { value: 'testing',              label: 'Testing' },
    { value: 'documentation',        label: 'Documentation' },
    { value: 'code-explanation',     label: 'Code Explanation' },
    { value: 'utilities',            label: 'Utilities' },
  ],
  productivity: [
    { value: 'meeting-notes',       label: 'Meeting Notes' },
    { value: 'pdf-document',        label: 'PDF & Document' },
    { value: 'workflow-automation', label: 'Workflow Automation' },
    { value: 'calendar-scheduling', label: 'Calendar & Scheduling' },
    { value: 'task-management',     label: 'Task Management' },
    { value: 'inbox-email',         label: 'Inbox & Email' },
    { value: 'time-tracking',       label: 'Time Tracking' },
  ],
  marketing: [
    { value: 'seo-tools',           label: 'SEO Tools' },
    { value: 'social-media',        label: 'Social Media' },
    { value: 'ad-copy',             label: 'Ad Copy' },
    { value: 'landing-pages',       label: 'Landing Pages' },
    { value: 'content-repurposing', label: 'Content Repurposing' },
    { value: 'competitor-analysis', label: 'Competitor Analysis' },
    { value: 'youtube-video-seo',   label: 'YouTube & Video SEO' },
  ],
  data: [
    { value: 'data-analysis',      label: 'Data Analysis' },
    { value: 'charts-visualization',label: 'Charts & Visualization' },
    { value: 'spreadsheets',        label: 'Spreadsheets' },
    { value: 'dashboards-bi',       label: 'Dashboards & BI' },
    { value: 'reports',             label: 'Reports' },
  ],
  education: [
    { value: 'homework-tutoring', label: 'Homework & Tutoring' },
    { value: 'math',              label: 'Math' },
    { value: 'flashcards-quizzes',label: 'Flashcards & Quizzes' },
    { value: 'summarization',     label: 'Summarization' },
    { value: 'study-planning',    label: 'Study Planning' },
    { value: 'language-learning', label: 'Language Learning' },
    { value: 'course-creation',   label: 'Course Creation' },
  ],
  business: [
    { value: 'business-planning',   label: 'Business Planning' },
    { value: 'legal-contracts',     label: 'Legal & Contracts' },
    { value: 'finance-invoicing',   label: 'Finance & Invoicing' },
    { value: 'pitch-presentations', label: 'Pitch & Presentations' },
    { value: 'hr-recruiting',       label: 'HR & Recruiting' },
    { value: 'customer-support',    label: 'Customer Support' },
    { value: 'crm-sales',           label: 'CRM & Sales' },
  ],
  research: [
    { value: 'ai-search-engines',   label: 'AI Search Engines' },
    { value: 'academic-research',   label: 'Academic Research' },
    { value: 'paper-summarization', label: 'Paper Summarization' },
    { value: 'citation-references', label: 'Citation & References' },
    { value: 'fact-checking',       label: 'Fact Checking' },
    { value: 'knowledge-base',      label: 'Knowledge Base' },
    { value: 'web-scraping',        label: 'Web Scraping' },
    { value: 'academic-writing',    label: 'Academic Writing' },
  ],
  other: [
    { value: 'ai-directory',        label: 'AI Directory' },
    { value: 'open-source-tools',   label: 'Open Source Tools' },
    { value: 'ai-for-students',     label: 'AI for Students' },
    { value: 'ai-for-small-business',label: 'AI for Small Business' },
    { value: 'ai-for-freelancers',  label: 'AI for Freelancers' },
    { value: 'ai-for-creators',     label: 'AI for Creators' },
  ],
}

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

// ── computed options ──────────────────────────────────────────
const categoryOptions = computed(() => [
  { value: '', label: 'Select a category...', disabled: true },
  ...CATEGORIES.map(c => ({ value: c.slug, label: `${c.emoji} ${c.name}` })),
])

const subCategoryOptions = computed(() => {
  if (!form.category) return []
  return [
    { value: '', label: 'Select a sub-category...', disabled: true },
    ...(subCategoryMap[form.category] || []),
  ]
})

const useCaseTagOptions = computed(() => useCaseMap[form.category] || [])

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

    await post('/api/submit', {
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

    navigateTo('/submit?success=1')
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