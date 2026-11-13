# aifindr.org — Discover AI Tools

<div align="center">

[![Live Site](https://img.shields.io/badge/Live%20Site-aifindr.org-a3e635?style=flat-square)](https://aifindr.org)
[![Built with Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square)](https://nuxt.com)
[![Deployed on Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F6821F?style=flat-square)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-60a5fa?style=flat-square)](./LICENSE)

**Open-source AI tools directory. Submit your tool, get free dofollow backlinks.**

[Browse Tools](https://aifindr.org/tools) · [Submit a Tool](https://aifindr.org/submit) · [Contributors](https://aifindr.org/contributors) · [Blog](https://aifindr.org/blog) · [Docs](https://kbmjj123.github.io/aifindr.org)

</div>

---

## What is aifindr.org?

A community-driven, open-source directory of AI tools across 12 categories. Tools are submitted through the online form, reviewed in the admin dashboard, and published to the directory. The site also runs a blog/CMS, contributor profiles, email notifications and scheduled maintenance jobs.

## Free Backlinks for Contributors

Approved submissions earn permanent **dofollow** backlinks:

| Source | URL | Notes |
|--------|-----|-------|
| GitHub repository | `github.com/kbmjj123/aifindr.org/...` | Tied to the tool content file in the repo |
| Tool detail page | `aifindr.org/tools/[category]/[slug]` | "Submitted by" link (`submitter_site`) |
| Contributor profile | `aifindr.org/contributors/[username]` | Personal website link |

> The online form is the supported submission path. The legacy GitHub PR flow (and the repository-file backlink it produces) is being reworked — see [Known gaps](#known-gaps).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3, TypeScript, Nitro) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` + CSS variables (dark theme) |
| SEO | `@nuxtjs/seo` (sitemap, robots, runtime OG images) |
| Database | Cloudflare D1 (`aifindr-db`) |
| Cache / Media | Cloudflare KV (`CACHE`) / R2 (`CDN`, served from `https://cdn.aifindr.org`) |
| Runtime & deploy | A single Cloudflare Worker (`nitro preset: cloudflare_module`), custom domains `aifindr.org` + `www` |
| Auth | GitHub OAuth + JWT |
| Package manager | pnpm 10 |

**Architecture:** pages and the ~45 `/api/*` Nitro endpoints ship in the same Worker (`.output/server/index.mjs` + `.output/public`). Most pages are server-rendered on the edge; only `/admin/**` and `/blog*` run with `ssr: false`. Tool data and Markdown bodies live in D1, not in Markdown files.

## Getting Started

### Prerequisites

- Node.js (a recent LTS) with pnpm 10 enabled
- A Cloudflare account if you need D1/KV/R2 bindings (Wrangler can emulate them locally)

```bash
git clone https://github.com/kbmjj123/aifindr.org.git
cd aifindr.org
pnpm install
pnpm dev            # http://localhost:3000
```

`wrangler.toml` supplies the D1/KV/R2 bindings; in local dev Nitro emulates them through Wrangler. Local secrets go into `.dev.vars` / `.dev.vars.local` (git-ignored). `.env.example` only lists the `R2_*` variables used by the image migration script.

### Configuration

Public values live in `wrangler.toml` under `[vars]`:

| Variable | Purpose |
|----------|---------|
| `API_BASE` | Public site/API base URL |
| `R2_PUBLIC_URL` | Public CDN base (`https://cdn.aifindr.org`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `ADMIN_GITHUB_IDS` | Comma-separated GitHub IDs allowed into `/admin` |

Secrets are set with `wrangler secret put <NAME>`: `TURNSTILE_SECRET`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`, `GITHUB_WEBHOOK_SECRET`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `SITE_URL`. The authoritative list is the `CloudflareEnv` interface in `server/utils/env.ts`.

### Database

```bash
wrangler d1 execute aifindr-db --remote --file=./schema/init.sql
```

`schema/init.sql` defines 9 tables: `tools`, `tool_tags`, `users`, `email_logs`, `generated_articles`, `published_links`, `posts`, `post_translations`, `custom_fields`. `schema/reset.sql` is for resetting a local/dev database.

### Build & Deploy

```bash
pnpm build
wrangler deploy
```

Four cron triggers are declared in `wrangler.toml` and dispatched by `server/plugins/scheduled.ts` (daily ops, link checker, monthly report, newsletter).

## Project Structure

```
aifindr.org/
├── pages/                 # Home, tools (list/category/subcategory/tags/detail),
│                          # submit, contributors, blog, admin, settings, privacy, terms
├── components/            # layout, tool, category, search, submit, ui, admin, og
├── composables/           # useApi, useAuth, useTools, usePageSeo, ...
├── layouts/admin.vue
├── server/
│   ├── routes/api/        # ~45 Nitro endpoints
│   ├── middleware/        # API logger
│   ├── plugins/           # cron dispatcher
│   └── utils/             # env, auth, jwt, email, cron, seo, logger
├── schema/                # init.sql, reset.sql (D1)
├── types/                 # tool.ts, category.ts
├── assets/css/            # main.css, markdown.css
├── data/                  # exchange links, submit template
├── docs/                  # email notification system + design notes (GitHub Pages)
├── public/                # favicon, manifest, ads.txt
├── api-spec.yaml          # OpenAPI reference (endpoint list may lag behind code)
├── nuxt.config.ts
├── wrangler.toml          # Worker name, assets, custom domains, bindings, crons
└── CLAUDE.md              # Project guide (CODEBUDDY.md is a symlink to it)
```

## Submitting a Tool

Use the [online form](https://aifindr.org/submit). Provide the tool name, website, category, pricing, a short description and optional details; the submission enters `pending` status and is reviewed in `/admin` before publication.

Guidelines: short, factual descriptions; no promotional superlatives; the tool must be publicly accessible and actively maintained; one tool per submission.

> The older "create a Markdown file under `content/tools/` and open a PR" path is **not currently active** — that directory and its sync script no longer exist in this repo.

## Categories

| Category | Slug | Description |
|----------|------|-------------|
| Image & Design | `image` | Image generation, editing, upscaling |
| Writing & Content | `writing` | Copywriting, blogging, text generation |
| Video & Animation | `video` | Video generation, editing, subtitles |
| Audio & Music | `audio` | Music generation, voice, transcription |
| Code & Developer | `code` | Coding assistance, review, documentation |
| Productivity | `productivity` | Task management, automation, summarization |
| Marketing & SEO | `marketing` | SEO, social media, ads, email marketing |
| Data & Analytics | `data` | Data analysis, visualization, BI |
| Education & Learning | `education` | Tutoring, language learning, courses |
| Business & Finance | `business` | Finance, legal, HR, CRM |
| Research & Search | `research` | Research, fact-checking, discovery |
| Other | `other` | Everything else |

## Data & API

All data access goes through Nitro handlers in `server/routes/api/`, using `getEnv(event).DB`. Front-end code calls them through `composables/useApi.ts` (SSR uses `useRequestFetch` in-process to avoid Worker self-fetch; CSR uses `$fetch` with a Bearer token).

Endpoint groups: tools & search, submit & upload, stats/click/view, auth, admin (review, tools, posts, users, broadcast), blog & contributors, sitemap, cron, webhooks (GitHub / Lemon Squeezy). See `api-spec.yaml` for a request/response reference, and the source files for the authoritative signatures.

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Authoritative project guide for AI assistants |
| `CODEBUDDY.md` | Symlink to `CLAUDE.md` (CodeBuddy reads the same file) |
| `.claude/rules/` | Tech stack, design system, product/data scope, SEO, deployment, pricing tiers, PRDs |
| `api-spec.yaml` | OpenAPI 3.0 reference |
| `docs/` | GitHub Pages developer docs + historical design notes |

`.claude/rules/PRD.md` and `.claude/rules/nuxt-cms-prd.md` are historical product proposals — their architecture sections describe an earlier Nuxt 3 / Cloudflare Pages design and should not be used as implementation guidance.

## Known gaps

- `pnpm run sync-d1` targets a script (`scripts/sync-to-d1.js`) that no longer exists; do not run it.
- `.github/workflows/sync-to-d1.yml` watches `content/tools/**` and is currently a no-op.
- The repository-file backlink and GitHub PR submission flow still reference `content/tools/*.md`; the tool detail page and contributor profile backlinks are unaffected.

## Contributing

Bug fixes, new features and UI improvements are welcome. For larger changes, open an issue first. Please follow `.claude/rules/tech-stack.md` and `.claude/rules/design-system.md` (CSS variables, dark theme, responsive, typed props).

## Free Backlink Exchange

Add a footer link to aifindr.org on your site to unlock extra visibility:

```html
<a href="https://aifindr.org" target="_blank" rel="dofollow">Discover AI Tools on aifindr.org</a>
```

## License

MIT with the Commons Clause License Condition v1.0 — see [LICENSE](./LICENSE). You may not sell this software as a hosted service.
