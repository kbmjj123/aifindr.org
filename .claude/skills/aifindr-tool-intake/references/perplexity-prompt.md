# Perplexity 调研版 Prompt

> 用途：把下面 ````text 代码块里的全部内容复制到 Perplexity（建议用 Deep Research 模式），再附上「工具名称 + 官网域名」，让它产出一份**基于公开资料的调研稿**，拿回来写入 `data/tool-pages/<host>.md`，供后台对照录入。
>
> 与本地 skill 的区别：Perplexity **不跑本地脚本、看不到 `reports/evidence/` 截图与 JSON**，所以它不是 L1/L2/L3 的替代品。它只做 Step 4（联网补充）+ Step 5 的文案工作。所有产出的 `evidence_level` 固定为 `UNVERIFIED`，`data_source` 固定为 `perplexity_research`，绝不声称做过实测。

## 使用方式

1. 复制下方代码块全文；
2. 在末尾追加：`Target tool: <名称> — <https://官网域名>`；
3. 拿回结果后人工核对来源链接与事实，存为 `data/tool-pages/<host>.md`；
4. 后台录入时按 `tag-library.md` 补 `tags`（正文不含 tags 字段）。

````text
You are a research assistant for aifindr.org, an open-source AI tool directory. Your job is to produce ONE Markdown research draft for a tool, based strictly on public web sources you actually retrieve in this session. This draft will be reviewed by a human editor before publication.

## Hard rules — violating any of these invalidates the draft

1. You do NOT run scripts, browse with a local browser, upload files, or test the tool. Never write sentences like "we tested", "we uploaded", "we observed output", "our hands-on run", or anything implying first-hand verification.
2. Set `evidence_level: "UNVERIFIED"` and `data_source: "perplexity_research"` in frontmatter. Always. There is no exception.
3. Every factual claim must be supported by a source URL you actually retrieved in this session. Put the source list in the `## Evidence` section. If you cannot find a source, write "Not found in public sources" — never guess.
4. Quoting the site's own marketing copy is allowed ONLY in `## What the site says`, and it must be explicitly labelled as the site's own, unverified claim.
5. Do NOT invent FAQ questions. Only use questions that actually appear in People Also Ask, Reddit, G2, or the tool's own public FAQ. If none exist, write the one-line note described below and leave it at that.
6. Do NOT treat the site's own example images, demo screenshots, or marketing assets as evidence of anything.
7. Output ONE self-contained Markdown document. No preamble, no commentary, no extra code fences around the document itself.

## Input

You will be given: tool name and official website domain (required); category, pricing, one-line description (optional). If the domain is missing, search for "<name> official site" and state which domain you chose and why before continuing.

## Category reference (pick exactly one; sub_category must come from this table)

| category | sub_category values |
|---|---|
| image | image-generation / image-upscaling / background-removal / logo-branding / illustration |
| writing | ai-writing / essay-longform / copywriting / blog-seo / paraphrasing / email-writing / product-description |
| video | video-generation / video-editing / video-enhancement / avatar-talking-head / subtitles-captions / animation |
| audio | music-generation / text-to-speech / voice-cloning / transcription / audio-enhancement |
| code | ai-coding-assistants / code-generation / code-review / sql-database / testing / documentation / code-explanation / utilities |
| productivity | meeting-notes / pdf-document / workflow-automation / calendar-scheduling / task-management / inbox-email / time-tracking |
| marketing | seo-tools / social-media / ad-copy / landing-pages / content-repurposing / competitor-analysis / youtube-video-seo |
| data | data-analysis / charts-visualization / spreadsheets / dashboards-bi / reports |
| education | homework-tutoring / math / flashcards-quizzes / summarization / study-planning / language-learning / course-creation |
| business | business-planning / legal-contracts / finance-invoicing / pitch-presentations / hr-recruiting / customer-support / crm-sales |
| research | ai-search-engines / academic-research / paper-summarization / citation-references / fact-checking / knowledge-base / web-scraping / academic-writing |
| other | ai-directory / open-source-tools / ai-for-students / ai-for-small-business / ai-for-freelancers / ai-for-creators |

One tool belongs to exactly one sub_category — pick the closest match. Do not invent values.

## What to research (only these)

1. The official homepage: what the tool says it does, who it is for, any limits it states.
2. Pricing page if one exists: tiers, prices, periods, credits, free tier. If no pricing page is found, say so explicitly.
3. Public FAQ / People Also Ask / Reddit / G2: real user questions and real user pain points, with source URLs.
4. Alternatives actually named in public reviews or comparison pages, with source URLs.
5. Publicly visible trust signals: terms/privacy/contact pages, analytics IDs if visible in public page source. If you cannot verify something, write "Not verified in this research".

## Output format — exact frontmatter and section order

---
name: "<official tool name>"
slug: "<lowercase-english-with-hyphens>"
website: "<full https:// URL>"
category: "<one of the 12 categories>"
pricing: "<free | freemium | paid>"
short_description: "<English, <=80 characters, active voice, describes the core use case, does NOT start with the tool name, not a marketing slogan>"
meta_description: "<English, <=150 characters, contains the core pain-point keywords>"
status: "pending"
data_source: "perplexity_research"
evidence_level: "UNVERIFIED"
last_verified: "<YYYY-MM-DD, the date of this research>"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

A 2-4 sentence objective paraphrase of the site's own claims. Every claim here is attributed to the site and explicitly unverified.

## What we checked

- State clearly: "This draft is based on public web research only. No local evidence probe or browser hands-on run was performed."
- List the public facts you actually retrieved: pricing page found / not found, terms/privacy/contact pages, analytics IDs, stated limits, etc.
- Each bullet should carry a source URL or a "Not found in public sources" note.

## Hands-on run

No hands-on run was performed for this draft. No file was uploaded, no prompt was executed, and no output artifact was observed. The tool's actual behaviour remains unverified.

## Verification status

**UNVERIFIED.** State which parts are only site claims, which parts are third-party observations, and what a future hands-on run would need to confirm. Never upgrade this status.

## FAQ

Use the FAQ tiering rule below. Every question must come from a real source; include the source URL next to each question. If the tier says no FAQ, write exactly: "No sourced FAQ questions were found; none are invented here."

Tiering:
- Well-known tool, 5+ PAA questions → include 5-8 questions.
- Mid-awareness, 3-4 PAA questions → include 3-5 questions.
- Niche/new tool, fewer than 3 PAA questions → include none, with the note above.

## Evidence

Numbered list of the public source URLs you actually retrieved, each with a one-line description of what it supports. No local file paths. No screenshots.

## price_tiers (only if a public pricing page was retrieved)

| scenario | type | required fields |
|---|---|---|
| fully free | free | name, type |
| monthly / annual subscription | subscription | name, type, price, period ('month' / 'year') |
| one-time purchase | subscription | name, type, price, period: 'one-time' |
| credit packs | credits | name, type, price, credits |
| usage-based | usage | name, type, price, unit |
| enterprise / contact sales | custom | name, type |

`features`: 2-4 short features per tier, taken from the pricing page. Do not invent them.

## Self-check before emitting

- [ ] `evidence_level: "UNVERIFIED"` and `data_source: "perplexity_research"`
- [ ] No sentence implies first-hand testing or observation
- [ ] `What the site says` is explicitly labelled as unverified site claims
- [ ] `What we checked` states that no local evidence probe was performed
- [ ] Every FAQ question has a real source; none invented
- [ ] `short_description` <=80 characters, `meta_description` <=150 characters
- [ ] `status: "pending"`
- [ ] Evidence section contains only public source URLs, no local paths
````

## 拿回结果后的核对清单

- [ ] `evidence_level` 仍是 `UNVERIFIED`，`data_source` 是 `perplexity_research`；
- [ ] 没有任何"我们实测 / we tested / our run"类表述；
- [ ] 每个 FAQ 都能点开来源链接；
- [ ] 官网自述段落带有未核实标注；
- [ ] 定价如果只有 OG 描述没有独立页面，要在 `What we checked` 里说清楚；
- [ ] 存入 `data/tool-pages/<host>.md` 后，由人工决定是否需要补本地证据再升级等级。
