<template>
  <div class="max-w-[860px]">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink><span class="sep">/</span>
      <NuxtLink to="/backlink-sites">Submission Sites</NuxtLink><span class="sep">/</span>
      <span class="current">Data &amp; corrections</span>
    </nav>

    <h1 class="font-sans font-extrabold text-[26px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Submission-site data &amp; corrections
    </h1>
    <p class="font-body text-[13px] leading-relaxed mb-8" style="color: var(--color-text-secondary)">
      Facts come from a 2026-11-16 public directory snapshot and are not independently verified. All explanatory text
      is written by aifindr.org. If you spot a wrong fact, tell us and we will review it before changing the site.
    </p>

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
          facts are public information; the source site's own wording, badges, FAQ and page structure are not reproduced
          on this site.
        </p>
        <p>
          Snapshot date: <strong>2026-11-16</strong>. Domain rating is a third-party estimate and decays over time.
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
  ['accepts_product_types', 'JSON array of product types the platform accepts (2026-11-16 snapshot)'],
  ['approval_time', 'Typical approval time distilled from the snapshot FAQ (339 of 848 rows)'],
  ['submit_steps', 'JSON array of how-to-submit steps, quoted from SubmitMap with attribution'],
  ['submit_requirements', 'JSON array of form requirements, quoted from SubmitMap with attribution'],
  ['gotchas', 'JSON array of submission pitfalls, quoted from SubmitMap with attribution'],
  ['rejection_reasons', 'JSON array of rejection criteria, quoted from SubmitMap with attribution'],
  ['icon_url', 'Platform icon hosted on the source snapshot CDN'],
  ['screenshot_url', 'Platform homepage screenshot hosted on the source snapshot CDN'],
  ['og_image_url', 'Source page OG image (1200x630), kept for reference and later rewrites'],
  ['source_lead', 'One-line source meta description, quoted from SubmitMap with attribution'],
  ['what_you_get', 'Source "What you actually get" paragraph extracted from rawText'],
  ['you_need', 'JSON array of detailed eligibility points, quoted from SubmitMap with attribution'],
  ['eligibility', 'Source eligibility text including accepted product types'],
  ['faq', 'JSON array of source FAQ questions and answers, quoted with attribution'],
  ['rw_* / r2_*', 'Internal rewrite and R2 image mirror columns; used by the site only'],
  ['categories', 'Topic tags (multi-label); maintained in the admin dashboard'],
  ['summary', 'Original factual summary written by aifindr.org'],
  ['source_snapshot / verification_status', 'Snapshot date and how the row was verified'],
]

usePageSeo({
  title: 'Submission-Site Data Sources & Corrections',
  template: 'prefix',
  description: 'Where aifindr.org submission-site facts come from, what each field means, and how to report a correction or a missing platform.',
})
useHead({ link: [{ rel: 'canonical', href: 'https://aifindr.org/backlink-sites/data' }] })
</script>
