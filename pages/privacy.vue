<template>
  <div class="max-w-[720px] mx-auto">
    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Privacy Policy
    </h1>
    <p class="font-body text-[13px] mb-8" style="color: var(--color-text-secondary)">
      Last updated: June 11, 2026
    </p>

    <div class="markdown space-y-6">
      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Information We Collect
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          We collect minimal information necessary to operate the directory and process tool submissions:
        </p>
        <ul class="font-body text-[13px] leading-relaxed space-y-2 mt-3" style="color: var(--color-text-primary)">
          <li><strong>Submission data:</strong> Tool name, website URL, description, and media links you provide when submitting a tool.</li>
          <li><strong>Submitter information:</strong> Your website URL and GitHub username (if provided) — used for backlink attribution and displayed publicly on the tool detail page.</li>
          <li><strong>GitHub OAuth data:</strong> If you sign in, we access your GitHub username, avatar, and public email solely for identity purposes.</li>
          <li><strong>Usage data:</strong> Anonymous page views and click counts used for trending sort and site analytics. No personal identification.</li>
        </ul>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          How We Use Your Information
        </h2>
        <ul class="font-body text-[13px] leading-relaxed space-y-2" style="color: var(--color-text-primary)">
          <li>Display your submitted tool in the directory with proper attribution.</li>
          <li>Generate dofollow backlinks on your tool's detail page and contributor page (if applicable).</li>
          <li>Improve site functionality and user experience through aggregated analytics.</li>
          <li>Communicate with you regarding your submission status if you provide contact information.</li>
        </ul>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Data Storage &amp; Security
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          Data is stored on Cloudflare D1 (database) and Cloudflare R2 (media files), both protected by Cloudflare's enterprise-grade security infrastructure. We retain your data for as long as your tool listing remains active. You may request removal at any time by opening a GitHub issue.
        </p>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Third-Party Services
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          We use the following third-party services:
        </p>
        <ul class="font-body text-[13px] leading-relaxed space-y-2 mt-3" style="color: var(--color-text-primary)">
          <li><strong>Cloudflare</strong> (Pages, D1, R2, Workers, Turnstile) — hosting, database, CDN, and spam protection.</li>
          <li><strong>GitHub</strong> — repository hosting, OAuth authentication, and PR-based submissions.</li>
          <li><strong>Anthropic API</strong> — AI-powered content generation (v1.2+ feature).</li>
        </ul>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Cookies
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          We use a minimal cookie to store your theme preference (dark/light mode). No tracking cookies, no analytics cookies, no advertising cookies. Cloudflare Turnstile may set a necessary cookie for bot detection.
        </p>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Your Rights
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          You have the right to access, correct, or delete your data. Since aifindr.org is open source, you can also inspect exactly what data we store by reviewing the codebase on GitHub. To exercise these rights, open an issue on our GitHub repository or contact us through the repository.
        </p>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Changes to This Policy
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          We may update this privacy policy from time to time. Changes will be reflected on this page with an updated "Last updated" date. Significant changes may be announced via our GitHub repository.
        </p>
      </section>

      <div class="h-px" :style="{ background: 'var(--color-border)' }"></div>

      <section>
        <h2 class="font-sans font-bold text-[18px] tracking-tight mb-3" style="color: var(--color-text-primary)">
          Contact
        </h2>
        <p class="font-body text-[13px] leading-relaxed" style="color: var(--color-text-primary)">
          This is an open-source project. For privacy-related inquiries, please open an issue on our
          <a href="https://github.com/kbmjj123/aifindr.org" target="_blank" rel="noopener noreferrer"
            style="color: var(--color-text-link)">GitHub repository</a>.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
usePageSeo({
  title: 'Privacy Policy',
  template: 'prefix',
  description: 'aifindr.org privacy policy — learn what data we collect, how we use it, and your rights as a user of this open-source AI tool directory.',
})
</script>
