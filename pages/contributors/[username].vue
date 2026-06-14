<template>
  <div>
    <NuxtLink to="/contributors" class="font-body text-[11px] mb-4 inline-flex items-center gap-1"
      style="color: var(--color-text-secondary)">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      All Contributors
    </NuxtLink>

    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="w-5 h-5 rounded-full border-2 animate-spin"
        :style="{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }" />
    </div>

    <div v-else-if="error" class="font-body text-[12px] py-8 text-center" style="color: var(--color-text-muted)">
      Contributor not found.
    </div>

    <template v-else-if="data">
      <div class="flex items-center gap-4 mb-8">
        <img v-if="data.avatar_url" :src="data.avatar_url" :alt="data.username"
          class="w-20 h-20 rounded-full object-cover"
          :style="{ border: '1px solid var(--color-border)' }" />
        <div v-else class="w-20 h-20 rounded-full flex items-center justify-center font-sans font-bold text-[22px]"
          :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
          {{ (data.username[0] || 'U').toUpperCase() }}
        </div>
        <div>
          <h1 class="font-sans font-bold text-[22px] tracking-tight" style="color: var(--color-text-primary)">
            {{ data.username }}</h1>
          <a v-if="data.website" :href="data.website" target="_blank" rel="dofollow"
            class="font-body text-[12px]" style="color: var(--color-text-link)">
            {{ data.website.replace(/^https?:\/\//, '') }}
          </a>
          <p class="font-body text-[12px] mt-1" style="color: var(--color-text-secondary)">
            {{ data.toolCount }} tools submitted
          </p>
        </div>
      </div>

      <!-- Pending Review Section -->
      <div v-if="data.pendingTools && data.pendingTools.length > 0" class="mb-8">
        <h2 class="font-sans font-bold text-[15px] mb-3" style="color: var(--color-text-secondary)">
          Under Review ({{ data.pendingTools.length }})
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
          <div v-for="tool in data.pendingTools" :key="tool.id"
            class="rounded-lg p-4 opacity-60"
            :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
            <div class="flex gap-3">
              <div class="w-9 h-9 rounded-[7px] flex items-center justify-center font-sans font-bold text-[11px] shrink-0"
                :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }">
                {{ (tool.name || '?')[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-sans font-semibold text-[13px] truncate" style="color: var(--color-text-primary)">
                  {{ tool.name }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="inline-flex items-center gap-1 h-[16px] px-[6px] rounded-full font-body text-[9px] font-medium uppercase tracking-[0.06em]"
                    :style="{ background: 'var(--color-featured-bg)', color: 'var(--color-featured-text)', border: '1px solid var(--color-featured-border)' }">
                    Pending Review
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Tools -->
      <h2 class="font-sans font-bold text-[15px] mb-4" style="color: var(--color-text-primary)">
        Submitted Tools
      </h2>
      <ToolGrid>
        <ToolCard v-for="tool in data.tools" :key="tool.id" :tool="tool" />
      </ToolGrid>

      <div v-if="data.tools.length === 0 && (!data.pendingTools || data.pendingTools.length === 0)"
        class="font-body text-[12px] py-8 text-center" style="color: var(--color-text-muted)">
        No tools submitted yet.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '~/types/tool'

interface ContributorData {
  username: string
  website: string | null
  avatar_url: string | null
  toolCount: number
  tools: Tool[]
  pendingTools: Tool[]
}

const route = useRoute()
const username = computed(() => route.params.username as string)
const { get } = useApi()

const { data, pending, error } = await useAsyncData(`contributor-${username.value}`, () =>
  get<ContributorData>(
    `/api/contributors/${encodeURIComponent(username.value)}`
  )
)

usePageSeo(() => ({
  title: `${username.value} – Contributor`,
  template: 'prefix',
  description: `AI tools submitted by ${username.value} on aifindr.org.`,
}))
</script>
