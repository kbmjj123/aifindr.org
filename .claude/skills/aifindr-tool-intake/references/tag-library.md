# 标签词表

> 用途：本 skill 产出的是 `data/tool-pages/*.md` 内容文档，正文模板**不含** `tags` 字段。
> 本表供"后台对照录入"时给管理员参考——若管理员需要在后台补 `tags`，按此词表选择，
> 保证与 D1 的 `tool_tags.type ∈ {use_case, audience, feature}` 口径一致。

## use_case（按分类的预置值，与 SKILL.md 分类表一致，不可自创）

- **image**: image-generation / image-upscaling / background-removal / logo-branding / illustration
- **writing**: ai-writing / essay-longform / copywriting / blog-seo / paraphrasing / email-writing / product-description
- **video**: video-generation / video-editing / video-enhancement / avatar-talking-head / subtitles-captions / animation
- **audio**: music-generation / text-to-speech / voice-cloning / transcription / audio-enhancement
- **code**: ai-coding-assistants / code-generation / code-review / sql-database / testing / documentation / code-explanation / utilities
- **productivity**: meeting-notes / pdf-document / workflow-automation / calendar-scheduling / task-management / inbox-email / time-tracking
- **marketing**: seo-tools / social-media / ad-copy / landing-pages / content-repurposing / competitor-analysis / youtube-video-seo
- **data**: data-analysis / charts-visualization / spreadsheets / dashboards-bi / reports
- **education**: homework-tutoring / math / flashcards-quizzes / summarization / study-planning / language-learning / course-creation
- **business**: business-planning / legal-contracts / finance-invoicing / pitch-presentations / hr-recruiting / customer-support / crm-sales
- **research**: ai-search-engines / academic-research / paper-summarization / citation-references / fact-checking / knowledge-base / web-scraping / academic-writing
- **other**: ai-directory / open-source-tools / ai-for-students / ai-for-small-business / ai-for-freelancers / ai-for-creators

## audience（1-3 个，选最匹配角色）

`marketer` · `designer` · `developer` · `writer` · `student` · `researcher` · `entrepreneur` · `founder` · `freelancer` · `small-business-owner` · `content-creator` · `educator` · `analyst` · `product-manager` · `non-technical`

## feature（按工具实际特性，不限数量；小写连字符）

`no-signup` · `free-tier` · `open-source` · `api-access` · `browser-based` · `offline` · `batch-processing` · `real-time` · `custom-models` · `watermark-free` · `gdpr-compliant` · `multi-language` · `mobile-app` · `desktop-app` · `chrome-extension` · `self-hosted` · `credit-system` · `commercial-use`

## 约束

- 一个工具只填一个 `use_case`（选最匹配的主场景）
- `audience` 1-3 个，`feature` 不限数量
- 词表之外的标签不要自创；确有必要时在内容文档中注明，由管理员决定
