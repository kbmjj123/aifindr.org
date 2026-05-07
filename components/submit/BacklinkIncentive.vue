<template>
  <div class="incentive-card">
    <h3 class="font-sans font-bold text-[16px] mb-4" style="color: var(--color-text-primary)">
      🎁 What You Get
    </h3>

    <div class="space-y-4">
      <div class="flex items-center gap-3 pb-3"
        :style="{ borderBottom: '1px solid var(--color-border)' }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-text-muted)">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <div>
          <div class="font-body font-medium text-[12px]" style="color: var(--color-text-primary)">github.com</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">
            Backlink in Markdown file &middot; <span style="color: var(--color-verified-text)">DA 100</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pb-3"
        :style="{ borderBottom: '1px solid var(--color-border)' }">
        <div class="logo-icon !w-5 !h-5 !text-[9px]">A</div>
        <div>
          <div class="font-body font-medium text-[12px]" style="color: var(--color-text-primary)">aifindr.org</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">
            Dofollow link on tool detail page
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          style="color: var(--color-text-muted)">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <div>
          <div class="font-body font-medium text-[12px]" style="color: var(--color-text-primary)">/contributors/you</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">
            Dofollow link on your contributor page
          </div>
        </div>
      </div>
    </div>

    <p class="font-body text-[11px] mt-6 text-center" style="color: var(--color-text-muted)">
      Free forever. No account needed.
    </p>
  </div>
</template>
