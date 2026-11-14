<template>
  <div class="max-w-[860px]">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <NuxtLink to="/backlink-sites">Submission sites</NuxtLink><span class="sep">/</span>
      <span class="current">Open data</span>
    </nav>

    <h1 class="font-sans font-extrabold text-[26px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Open submission-site dataset
    </h1>
    <p class="font-body text-[13px] leading-relaxed mb-8" style="color: var(--color-text-secondary)">
      The directory is free to use, download and build on. No account, no API key, no rate limit beyond normal
      caching. If you spot a wrong fact, tell us and we will review it before changing the public data.
    </p>

    <section class="mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Downloads</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a v-for="item in downloads" :key="item.href" :href="item.href" :download="item.download || undefined"
          target="_blank" rel="noopener noreferrer" class="tool-card no-underline">
          <div class="font-sans font-semibold text-[13px]" style="color: var(--color-text-primary)">{{ item.title }}</div>
          <div class="font-body text-[11px] mt-1" style="color: var(--color-text-secondary)">{{ item.note }}</div>
        </a>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Public API</h2>
      <div class="rounded-lg p-4 font-body text-[11px] leading-relaxed overflow-x-auto"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        <div v-for="line in endpoints" :key="line" class="whitespace-pre-wrap" style="color: var(--color-accent)">{{ line }}</div>
      </div>
      <p class="font-body text-[11px] mt-2" style="color: var(--color-text-muted)">
        Filters: q, pricing, dofollow, backlink, free, approval, method, category, drMin, drMax, sort, page, pageSize.
        All list and export endpoints are read-only and public.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Field dictionary</h2>
      <div class="rounded-lg overflow-hidden" :style="{ border: '1px solid var(--color-border)' }">
        <table class="w-full font-body text-[11px]">
          <thead :style="{ background: 'var(--color-bg-elevated)', color: var_muted }">
            <tr><th class="text-left p-2">Field</th><th class="text-left p-2">Meaning</th></tr>
          </thead>
          <tbody>
            <tr v-for="field in fields" :key="field[0]" :style="{ borderTop: '1px solid var(--color-border)' }">
              <td class="p-2" style="color: var(--color-accent)">{{ field[0] }}</td>
              <td class="p-2" style="color: var(--color-text-secondary)">{{ field[1] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Provenance &amp; licence</h2>
      <div class="rounded-lg p-4 font-body text-[11px] leading-relaxed space-y-2"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: var_secondary }">
        <p>{{ attribution }}</p>
        <p>
          CC0-1.0 applies to aifindr.org's compilation, topic tags, list definitions and editorial text. The underlying
          facts are public information; the source site's own wording, badges, FAQ and page structure are not included
          in this dataset.
        </p>
        <p>
          Snapshot date: <strong>2026-11-13</strong>. Domain rating is a third-party estimate and decays over time.
          Every entry records its verification status so user-submitted platforms can be told apart from snapshot rows.
        </p>
        <p>
          Platform owners who want an entry corrected or removed can use the form below; requests are reviewed before
          publication.
        </p>
      </div>
    </section>

    <section id="report" class="mb-8 scroll-mt-20">
      <h2 class="font-sans font-bold text-[16px] mb-3" style="color: var(--color-text-primary)">Report a correction or a missing platform</h2>
      <SubmissionReportForm />
    </section>
  </div>
</template>

<script setup lang="ts">
import { SUBMISSION_ATTRIBUTION } from '~/types/submissionSite'

const attribution = SUBMISSION_ATTRIBUTION
const var_muted = 'var(--color-text-muted)'
const var_secondary = 'var(--color-text-secondary)'

const downloads = [
  { href: '/data/submission-sites.json', title: 'Full dataset (JSON)', note: '848 sites + 12 list definitions', download: 'aifindr-submission-sites.json' },
  { href: '/api/submission-sites/export?format=csv', title: 'Full dataset (CSV)', note: 'Filtered live export from D1', download: '' },
  { href: '/api/submission-sites/export?format=json', title: 'Live JSON export', note: 'Same filters as the directory', download: '' },
]

const endpoints = [
  'GET /api/submission-sites?q=&pricing=&dofollow=&sort=dr&page=1&pageSize=24',
  'GET /api/submission-sites/{slug}',
  'GET /api/submission-sites/export?format=json|csv',
  'GET /api/submission-lists',
  'GET /api/submission-lists/{slug}',
  'GET /api/submission-lists/{slug}/export?format=json|csv',
]

const fields: [string, string][] = [
  ['slug / name', 'Stable identifier and display name'],
  ['site_url', 'Platform homepage'],
  ['submit_url', 'Direct submission page when the snapshot recorded one'],
  ['submit_method', 'form / github_pr / awesome_list / sign_in / community_post / external'],
  ['domain_rating', 'Third-party domain rating; null when not stated'],
  ['pricing', 'Overall platform pricing (free / freemium / paid / optional / unknown)'],
  ['has_free_submission', 'Whether a free submission lane exists — a separate question from pricing'],
  ['approval / approval_bucket', 'Recorded review time and its normalised bucket'],
  ['dofollow_link', 'Whether the listing link was recorded as dofollow'],
  ['backlink_required', 'Whether the platform asks for a badge or return link'],
  ['categories', 'Topic tags (multi-label); maintained in the admin dashboard'],
  ['summary', 'Original factual summary written by aifindr.org'],
  ['source_snapshot / verification_status', 'Snapshot date and how the row was verified'],
]

usePageSeo({
  title: 'Open Submission-Site Dataset — Free JSON & CSV Download',
  template: 'prefix',
  description: 'Download the free open dataset of 848 product submission platforms, with a public API, field dictionary, provenance and a correction form.',
})
useHead({ link: [{ rel: 'canonical', href: 'https://aifindr.org/backlink-sites/data' }] })
</script>
