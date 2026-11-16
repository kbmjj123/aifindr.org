#!/usr/bin/env node
/**
 * 公共外链提交平台目录 —— 数据构建脚本（本地运行，不参与 Worker 打包）
 *
 * 输入（默认优先升级版 docs/res-v2，可用 --res=docs/res 回退）：
 *   01-list.json       列表视图：全集、顺序、精选段、免费提交口径、抓取日期
 *   02-details.jsonl   详情视图：事实字段、官网、提交入口、相关平台边、规范化字段
 *
 * 输出：
 *   schema/seed-submission-sites.sql       D1 导入文件
 *   public/data/submission-sites.json      开放下载（事实字段 + 本站原创摘要）
 *   reports/submission-sites-cleaning.json 清洗统计与脏值清单
 *
 * 合规口径：结构化事实直接使用；summary / fact_points / intro / methodology / faq
 * 由本脚本按本站模板原创生成。来源页面仍不复制：FAQ、lead、徽章 HTML、agent 推广段。
 * v2 内容板块（howToSubmit / requirements / gotchas / rejectionReasons，2026-11-16 批次
 * 经确认入库）逐条净化限长后入库与导出，页面与开放数据集均带 SubmitMap 署名；
 * platformWebsite / submitPageUrl 仍只进审计报告，不入库。
 *
 * 用法：
 *   node scripts/build-submission-sites.mjs                  # 优先 docs/res-v2
 *   node scripts/build-submission-sites.mjs --res=docs/res   # 显式使用旧快照
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// 干净 clone 上没有 v2 抓取物时自动回退到 docs/res；已提交的产物仍可运行站点。
const RES = (() => {
  const arg = process.argv.find(a => a.startsWith('--res='))
  if (arg) return resolve(ROOT, arg.slice('--res='.length))
  const upgraded = resolve(ROOT, 'docs/res-v2')
  return existsSync(resolve(upgraded, '02-details.jsonl')) ? upgraded : resolve(ROOT, 'docs/res')
})()
// 快照日期以输入文件自身为准，避免换了抓取批次还沿用旧的署名与 snapshot_id。
const SNAPSHOT = (() => {
  try {
    const meta = JSON.parse(readFileSync(resolve(RES, '01-list.json'), 'utf8'))
    const date = String(meta.scrapedAt || '').slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '2026-11-16'
  } catch { return '2026-11-16' }
})()
const SNAPSHOT_ID = `${SNAPSHOT.replace(/-/g, '')}-1`
const SOURCE_URL_BASE = 'https://submitmap.com/platform/'
const ATTRIBUTION =
  `Facts sourced from a public directory snapshot (${SNAPSHOT}). `
  + 'Domain rating is a third-party metric, not independently verified by aifindr.org. '
  + 'All editorial text on this page is written by aifindr.org. '
  + 'Submission steps, requirements, gotchas and rejection reasons are quoted from SubmitMap\'s platform page.'

const VALID_PRICING = new Set(['free', 'freemium', 'paid', 'optional'])
const APPROVAL_BUCKET = {
  'Instant': 'fast', 'Same day': 'fast', '1-2 days': 'fast',
  '3-5 days': 'week', 'About a week': 'week', '1-2 weeks': 'week',
  '2-4 weeks': 'month', '1-2 months': 'month',
  '2-3 months': 'slow', '3-6 months': 'slow', '6+ months': 'slow',
  'Not stated': 'unknown',
}
const METHOD_LABELS = {
  form: 'an online form', github_pr: 'a GitHub pull request', awesome_list: 'an awesome-list pull request',
  sign_in: 'a sign-in flow', community_post: 'a community post', external: 'an external submission page',
  unknown: 'an unconfirmed channel',
}
const PRICING_PHRASE = {
  free: 'Submitting a listing is free',
  freemium: 'The platform is freemium and has a free submission lane',
  paid: 'Listing requires payment',
  optional: 'Payment is optional',
  unknown: 'Pricing was not stated in the snapshot',
}

// ── helpers ────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(readFileSync(resolve(RES, file), 'utf8'))
}

function readJsonl(file) {
  return readFileSync(resolve(RES, file), 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
}

function sqlVal(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  return `'${String(value).replace(/'/g, "''")}'`
}

function insertStatement(table, columns, row, conflict = 'OR REPLACE') {
  const values = columns.map(col => sqlVal(row[col])).join(', ')
  return `INSERT ${conflict} INTO ${table} (${columns.join(', ')}) VALUES (${values});`
}

/**
 * 快照刷新不能覆盖后台的人工维护：
 * - submission_sites 用 UPSERT 而非 REPLACE，避免 ON DELETE CASCADE 清空物化成员/人工分类
 * - submission_lists 只更新快照版本与成员数，保留 status / kind / 策展位 / 文案 / 规则
 */
function upsertSiteStatement(columns, row) {
  const values = columns.map(col => sqlVal(row[col])).join(', ')
  const updates = columns
    .filter(col => !['slug', 'created_at', 'click_count', 'data_source', 'verification_status', 'page_rank', 'page_rank_checked_at'].includes(col))
    .map(col => `${col} = excluded.${col}`)
    .join(', ')
  // 后台编辑过的行 data_source 会变成 'admin'，重跑快照时不覆盖人工补全的字段
  return `INSERT INTO submission_sites (${columns.join(', ')}) VALUES (${values}) `
    + `ON CONFLICT(slug) DO UPDATE SET ${updates} `
    + `WHERE submission_sites.data_source = 'snapshot';`
}

function upsertListStatement(columns, row) {
  const values = columns.map(col => sqlVal(row[col])).join(', ')
  return `INSERT INTO submission_lists (${columns.join(', ')}) VALUES (${values}) `
    + `ON CONFLICT(slug) DO UPDATE SET snapshot_id = excluded.snapshot_id, `
    + `item_count = excluded.item_count, updated_at = excluded.updated_at;`
}

/** 内容板块逐条净化：压平控制字符、限长限条，作为带署名的引用内容入库 */
function textListOf(value, { maxItems = 8, maxLen = 600 } = {}) {
  if (!Array.isArray(value)) return []
  const out = []
  for (const item of value) {
    const text = String(item ?? '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!text) continue
    out.push(text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text)
    if (out.length >= maxItems) break
  }
  return out
}

/** 图标 / 截图只取与本平台 slug 匹配的图片，避免混入相似平台卡片的图 */
function platformImageUrl(detail, file) {
  const hit = (Array.isArray(detail.images) ? detail.images : [])
    .find(img => String(img?.src || '').includes(`/platforms/${detail.slug}/${file}`))
  const src = String(hit?.src || '')
  return /^https:\/\//.test(src) ? src : ''
}

/** 审批时长来自快照 FAQ 的提炼值（如 "1-2 days"），仅保留干净的短文本 */
function approvalTimeOf(detail) {
  const value = String(detail.approvalTimeFromFaq ?? '').trim()
  return value && value.length <= 60 ? value : ''
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function pathOf(url) {
  try { return new URL(url).pathname } catch { return '' }
}

function externalLinks(detail) {
  return (detail.links || [])
    .map(link => link?.href)
    .filter(href => typeof href === 'string' && href.startsWith('http'))
    .filter(href => !href.includes('submitmap.com') && !href.includes('ahrefs.com'))
}

function jsonldName(detail) {
  const items = detail.embedded?.jsonld_0?.itemListElement
  if (!Array.isArray(items) || items.length === 0) return ''
  return String(items[items.length - 1]?.name || '').trim()
}

function displayName(detail, listItem) {
  const fromH1 = String(detail.h1 || '').split(':')[0].trim()
  if (fromH1 && fromH1.length <= 80) return fromH1
  const fromLd = jsonldName(detail)
  if (fromLd && fromLd.length <= 80) return fromLd
  const fromCard = String(listItem.cardRaw || '').trim()
  if (fromCard && fromCard.length <= 80) return fromCard
  const fromListName = String(listItem.name || '').trim()
  if (fromListName && fromListName.length <= 80) return fromListName
  return listItem.slug
}

/** v2 的 specNormalized.* 已把 Yes/No、大小写、数值解析好，优先用它消掉规格表脏值 */
function cleanDomainRating(raw, normalized) {
  const value = String(raw ?? '').trim()
  if (/^\d{1,3}$/.test(value) && Number(value) <= 100) return Number(value)
  if (normalized === null || normalized === undefined || normalized === '') return null
  const fallback = Number(normalized)
  return Number.isFinite(fallback) && fallback >= 0 && fallback <= 100 ? Math.round(fallback) : null
}

function cleanBoolean(raw, normalized) {
  if (typeof normalized === 'boolean') return normalized ? 1 : 0
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'yes') return 1
  if (value === 'no') return 0
  return null
}

function cleanPricing(raw, normalized) {
  const value = String(normalized ?? raw ?? '').trim().toLowerCase()
  return VALID_PRICING.has(value) ? value : 'unknown'
}

/** v2 新增的结构化事实：该平台接受什么类型的产品（非编辑文案，可直接入库） */
const PRODUCT_TYPE_ALIASES = new Map([
  ['saa', 'SaaS products'],          // 抓取截断
  ['dev tools', 'Developer tools'],  // 同义缩写
  ['open source', 'Open source projects'],
])

function productTypesOf(detail) {
  const raw = Array.isArray(detail.acceptsProductTypes) ? detail.acceptsProductTypes : []
  const result = []
  for (const item of raw) {
    const value = String(item ?? '').trim()
    if (!value || value.length > 40) continue
    const canonical = PRODUCT_TYPE_ALIASES.get(value.toLowerCase()) || value
    if (!result.includes(canonical)) result.push(canonical)
  }
  return result
}

/** 只用于审计报告：v2 的 platformWebsite 是对象，含少量明显错链，不自动覆盖 site_url */
function platformWebsiteUrl(detail) {
  const value = detail.platformWebsite
  if (!value || typeof value !== 'object') return null
  const url = String(value.url ?? '').trim()
  return /^https?:\/\//.test(url) ? url : null
}

function cleanApproval(raw) {
  const value = String(raw ?? '').trim()
  return Object.hasOwn(APPROVAL_BUCKET, value) ? value : 'Not stated'
}

function submitMethodOf(url) {
  if (!url) return 'unknown'
  const host = hostnameOf(url)
  const path = pathOf(url)
  if (/login|signin|sign-up|signup|register/i.test(path)) return 'sign_in'
  if (host === 'github.com') return /awesome/i.test(path) ? 'awesome_list' : 'github_pr'
  if (/dev\.to|news\.ycombinator\.com|reddit\.com|indiehackers\.com|hashnode\.com/.test(host)) return 'community_post'
  if (/submit|\/new|add-new|add_new|\/post|\/add\b/i.test(path)) return 'form'
  return 'external'
}

/** 列表口径优先（"这次提交要不要钱"），缺失时由详情口径（"平台整体定价"）推导 */
function freeSubmissionOf(listPricing, pricing) {
  const listValue = String(listPricing ?? '').trim().toLowerCase()
  if (listValue === 'free' || listValue === 'freemium') return 1
  if (listValue === 'paid') return 0
  if (pricing === 'paid') return 0
  if (pricing === 'unknown') return null
  return 1
}

// ── 主题分类：规则初判，人工复核时改 source='manual' ──────────────────

const CATEGORY_RULES = [
  { slug: 'mcp-directories', re: /\bmcp\b|model context protocol/i, confidence: 0.95 },
  { slug: 'saas-directories', re: /\bsaas\b/i, confidence: 0.9 },
  { slug: 'startup-directories', re: /\bstartups?\b|\blaunch(es)?\b|\bbeta(list)?\b/i, confidence: 0.85 },
  { slug: 'developer-tool-directories', re: /\bdevelopers?\b|\bdev\b|open[- ]source|\bgithub\b|\bapi\b/i, confidence: 0.8 },
  { slug: 'review-platforms', re: /\breviews?\b|\bratings?\b|trustpilot|\bg2\b|alternativeto/i, confidence: 0.8 },
  { slug: 'ai-tool-directories', re: /\bAI\b|AIGC|\bA\.I\.|artificial intelligence|\bagent(s)?\b/i, confidence: 0.7 },
]

function categoriesOf(text, slug) {
  const hits = CATEGORY_RULES
    .filter(rule => rule.re.test(text))
    .map(rule => ({ category_slug: rule.slug, confidence: rule.confidence }))
  if (hits.length === 0) {
    hits.push({ category_slug: 'general-directories', confidence: 0.4 })
  }
  return hits.map(hit => ({ ...hit, site_slug: slug, source: 'rule', parent_slug: null }))
}

// ── 本站原创说明文案 ────────────────────────────────────────────────

/** 本站原创文案里引用结构化事实用，不复制来源页面表达 */
function productTypeList(site) {
  try {
    const parsed = JSON.parse(site.accepts_product_types || '[]')
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string' && v) : []
  } catch { return [] }
}

function factPointsOf(site) {
  const points = []
  if (site.domain_rating !== null) points.push(`Domain rating ${site.domain_rating}`)
  points.push(`Platform pricing: ${site.pricing}`)
  points.push(site.has_free_submission === 1 ? 'A free submission lane is available' : 'No free submission lane confirmed')
  if (site.dofollow_link !== null) points.push(site.dofollow_link ? 'Dofollow links' : 'Nofollow links')
  points.push(`Approval: ${site.approval}`)
  if (site.backlink_required !== null) {
    points.push(site.backlink_required ? 'A backlink or badge is required' : 'No backlink or badge required')
  }
  points.push(`Submission channel: ${site.submit_method}`)
  if (site.approval_time) points.push(`Typical approval time: ${site.approval_time}`)
  const types = productTypeList(site)
  if (types.length) points.push(`Product types listed: ${types.join(', ')}`)
  return points
}

function summaryOf(site) {
  const parts = [`${site.name} is a platform where you can submit a product or website for a listing.`]
  if (site.domain_rating !== null) parts.push(`Its domain rating is ${site.domain_rating}.`)
  parts.push(`${PRICING_PHRASE[site.pricing]}.`)
  if (site.approval_time) parts.push(`The typical review time is recorded as ${site.approval_time}.`)
  const types = productTypeList(site)
  if (types.length) {
    const shown = types.slice(0, 3)
    const phrase = shown.length > 1
      ? `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`
      : shown[0]
    parts.push(`It is recorded as accepting ${phrase}${types.length > 3 ? ', among other categories' : ''}.`)
  }
  if (site.dofollow_link !== null) {
    parts.push(`Listed links are ${site.dofollow_link ? 'dofollow' : 'nofollow'}.`)
  }
  parts.push(`Approval is recorded as "${site.approval}".`)
  if (site.backlink_required !== null) {
    parts.push(site.backlink_required
      ? 'The platform asks for a backlink or badge in return.'
      : 'The platform does not ask for a backlink or badge.')
  }
  if (site.submit_method !== 'unknown') {
    parts.push(`Submissions go through ${METHOD_LABELS[site.submit_method]}.`)
  }
  return parts.join(' ')
}

// ── 榜单定义 ────────────────────────────────────────────────────────

const DESC_SORT = [
  { field: 'domain_rating', dir: 'desc' },
  { field: 'list_order', dir: 'asc' },
  { field: 'slug', dir: 'asc' },
]
// 快审榜已按 approval_bucket 过滤，成员同档，按权威度排序即可
const SPEED_SORT = [
  { field: 'domain_rating', dir: 'desc' },
  { field: 'list_order', dir: 'asc' },
  { field: 'slug', dir: 'asc' },
]

const LIST_DEFS = [
  {
    slug: 'free-dofollow', title: 'Free Dofollow Submission Sites', dimension: 'pricing', kind: 'rule',
    description: 'Platforms with a free submission lane that also pass a followed link.',
    filters: { and: [
      { field: 'pricing', op: 'eq', value: 'free' },
      { field: 'dofollow_link', op: 'eq', value: 1 },
    ] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'the snapshot marks the platform as free and records a dofollow link',
    angle: 'These are the first stops worth trying when the budget is zero and link equity matters.',
  },
  {
    slug: 'fast-approval', title: 'Fast Approval Submission Sites', dimension: 'speed', kind: 'rule',
    description: 'Platforms that publish a listing within roughly 48 hours.',
    filters: { and: [{ field: 'approval_bucket', op: 'eq', value: 'fast' }] },
    sort: SPEED_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'the recorded approval time is instant, same day, or one to two days',
    angle: 'Useful when a launch is already running and you cannot wait weeks for a listing to appear.',
  },
  {
    slug: 'high-domain-rating', title: 'High Domain Rating Submission Sites', dimension: 'authority', kind: 'rule',
    description: 'Submission platforms with a domain rating of 50 or above.',
    filters: { and: [{ field: 'domain_rating', op: 'gte', value: 50 }] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'the recorded domain rating is at least 50',
    angle: 'Domain rating is a third-party estimate, not a guarantee of referral traffic or link value.',
  },
  {
    slug: 'free-no-badge', title: 'Free Submission Sites Without a Badge Requirement', dimension: 'pricing', kind: 'rule',
    description: 'Free platforms that do not ask you to place their badge or a return link.',
    filters: { and: [
      { field: 'pricing', op: 'eq', value: 'free' },
      { field: 'backlink_required', op: 'eq', value: 0 },
    ] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'submission is free and the platform does not require a backlink or badge',
    angle: 'No reciprocal link means nothing has to be added to your own homepage before submitting.',
  },
  {
    slug: 'high-authority-dofollow', title: 'High Authority Dofollow Submission Sites', dimension: 'authority', kind: 'rule',
    description: 'Dofollow platforms with a domain rating of 60 or above.',
    filters: { and: [
      { field: 'dofollow_link', op: 'eq', value: 1 },
      { field: 'domain_rating', op: 'gte', value: 60 },
    ] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'links are dofollow and the recorded domain rating is at least 60',
    angle: 'The shortlist for link equity, at the cost of stricter review and longer queues.',
  },
  {
    slug: 'no-backlink-required', title: 'Submission Sites With No Backlink Required', dimension: 'link', kind: 'rule',
    description: 'Platforms that do not ask for a reciprocal link or badge.',
    filters: { and: [{ field: 'backlink_required', op: 'eq', value: 0 }] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'no backlink or badge is required',
    angle: 'Reciprocal links are not inherently bad, but an unconditional listing is simpler to plan around.',
  },
  {
    slug: 'dofollow-backlinks', title: 'Dofollow Backlink Submission Sites', dimension: 'link', kind: 'rule',
    description: 'Every platform in the snapshot whose listing links are recorded as dofollow.',
    filters: { and: [{ field: 'dofollow_link', op: 'eq', value: 1 }] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'the listing link is recorded as dofollow',
    angle: 'Link attributes can change without notice, so verify on the live page before you rely on them.',
  },
  {
    slug: 'ai-tool-directories', title: 'AI Tool Directories', dimension: 'topic', kind: 'rule',
    description: 'Directories and launch boards oriented toward AI products.',
    filters: { and: [{ field: 'categories', op: 'contains', value: 'ai-tool-directories' }] },
    sort: DESC_SORT, limit_mode: 'topN', limit_count: 50,
    ruleText: 'the platform is tagged as an AI tool directory',
    angle: 'Topic tags are inferred from public names and descriptions, then reviewed over time.',
  },
  {
    slug: 'saas-directories', title: 'SaaS Directories', dimension: 'topic', kind: 'rule',
    description: 'Directories that list SaaS products alongside their competitors.',
    filters: { and: [{ field: 'categories', op: 'contains', value: 'saas-directories' }] },
    sort: DESC_SORT, limit_mode: 'topN', limit_count: 50,
    ruleText: 'the platform is tagged as a SaaS directory',
    angle: 'Comparison pages make these useful beyond the link itself.',
  },
  {
    slug: 'startup-directories', title: 'Startup & Launch Directories', dimension: 'topic', kind: 'rule',
    description: 'Boards built for new products, launches, and pre-launch audiences.',
    filters: { and: [{ field: 'categories', op: 'contains', value: 'startup-directories' }] },
    sort: DESC_SORT, limit_mode: 'topN', limit_count: 50,
    ruleText: 'the platform is tagged as a startup or launch directory',
    angle: 'Many of these reward timing more than domain authority.',
  },
  {
    slug: 'mcp-directories', title: 'MCP Server Directories', dimension: 'topic', kind: 'rule',
    description: 'Registries and lists that accept MCP servers.',
    filters: { and: [{ field: 'categories', op: 'contains', value: 'mcp-directories' }] },
    sort: DESC_SORT, limit_mode: 'topN', limit_count: 50,
    ruleText: 'the platform is tagged as an MCP directory',
    angle: 'Several of these accept a repository rather than a form, so a public repo is usually required.',
  },
  {
    slug: 'developer-tool-directories', title: 'Developer Tool Directories', dimension: 'topic', kind: 'rule',
    description: 'Places that list developer tools, open source projects, and libraries.',
    filters: { and: [{ field: 'categories', op: 'contains', value: 'developer-tool-directories' }] },
    sort: DESC_SORT, limit_mode: 'topN', limit_count: 50,
    ruleText: 'the platform is tagged as a developer tool directory',
    angle: 'Expect a public repository and a clear one-line description of what the tool does.',
  },
  {
    slug: 'mcp-server-submission-sites', title: 'Submission Sites That Accept MCP Servers',
    dimension: 'topic', kind: 'rule',
    description: 'Platforms recorded as accepting MCP servers and Model Context Protocol projects.',
    filters: { and: [{ field: 'accepts_product_types', op: 'contains', value: 'MCP servers' }] },
    sort: DESC_SORT, limit_mode: 'all', limit_count: 0,
    ruleText: 'the platform is recorded as accepting MCP servers as a product type',
    angle: 'Product types are factual tags from the snapshot; check the live submission page for the current scope.',
  },
]

function editorialOf(def) {
  return {
    intro: `${def.description} ${def.angle} This list is generated from the ${SNAPSHOT} snapshot of the aifindr.org submission directory.`,
    methodology: `A platform is included when ${def.ruleText}. `
      + `Members are ordered by the list's sort rule, with the snapshot order and slug as tiebreakers so results stay stable between refreshes. `
      + `Domain rating is a third-party metric captured on ${SNAPSHOT}; it is not measured by aifindr.org. `
      + `Where a field was not stated in the snapshot, the platform is excluded rather than guessed.`,
    faq: [
      {
        question: `How is the ${def.title} list built?`,
        answer: `We include platforms where ${def.ruleText}, then order them by the published sort rule. The list is recalculated whenever the underlying snapshot is refreshed.`,
      },
      {
        question: 'How current is this data?',
        answer: `The facts come from a public directory snapshot taken on ${SNAPSHOT}. Approval times, pricing and link attributes can change; check the live submission page before you rely on them.`,
      },
      {
        question: 'Can I suggest a missing platform or report a mistake?',
        answer: 'Yes. Use the report link on any platform detail page. Corrections are reviewed before they change the public dataset.',
      },
    ],
  }
}

// ── 受限 DSL 求值（与服务端 resolveList 逻辑一致） ─────────────────────

function fieldValue(site, field, categoriesBySlug) {
  if (field === 'categories') return categoriesBySlug.get(site.slug) || []
  return site[field]
}

function matchCondition(site, cond, categoriesBySlug) {
  const actual = fieldValue(site, cond.field, categoriesBySlug)
  switch (cond.op) {
    case 'eq':
      if (Array.isArray(actual)) return actual.includes(String(cond.value))
      return actual === cond.value
    case 'in': {
      const allowed = Array.isArray(cond.value) ? cond.value.map(String) : [String(cond.value)]
      if (Array.isArray(actual)) return actual.some(v => allowed.includes(String(v)))
      return allowed.includes(String(actual))
    }
    case 'contains':
      return Array.isArray(actual) ? actual.includes(String(cond.value)) : String(actual ?? '').includes(String(cond.value))
    case 'gte':
      return typeof actual === 'number' && actual >= Number(cond.value)
    case 'lte':
      return typeof actual === 'number' && actual <= Number(cond.value)
    default:
      return false
  }
}

function resolveList(def, sites, categoriesBySlug) {
  const conditions = def.filters?.and || []
  // 纯策展榜（无筛选规则）只取 include_slugs，避免把全量站点塞进精选短榜
  const base = conditions.length
    ? sites.filter(site => site.status === 'active' && conditions.every(cond => matchCondition(site, cond, categoriesBySlug)))
    : []
  let members = base

  const sortRules = def.sort || DESC_SORT
  members.sort((a, b) => {
    for (const rule of sortRules) {
      const av = fieldValue(a, rule.field, categoriesBySlug)
      const bv = fieldValue(b, rule.field, categoriesBySlug)
      if (av === bv) continue
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'en')
      if (cmp !== 0) return rule.dir === 'desc' ? -cmp : cmp
    }
    return String(a.slug).localeCompare(String(b.slug), 'en')
  })

  const excluded = new Set(def.exclude_slugs || [])
  const included = new Set(def.include_slugs || [])
  const pinned = def.pinned_order || []
  if (excluded.size || included.size) {
    members = members.filter(site => !excluded.has(site.slug))
    if (included.size) {
      const bySlug = new Map(sites.map(site => [site.slug, site]))
      for (const slug of [...included].reverse()) {
        if (!members.some(site => site.slug === slug) && bySlug.has(slug)) {
          members.unshift(bySlug.get(slug))
        }
      }
    }
  }
  if (pinned.length) {
    const pinnedSet = new Set(pinned)
    members = [
      ...pinned.map(slug => members.find(site => site.slug === slug)).filter(Boolean),
      ...members.filter(site => !pinnedSet.has(site.slug)),
    ]
  }
  if (def.limit_mode === 'topN' && def.limit_count > 0) {
    members = members.slice(0, def.limit_count)
  }
  return members
}

// ── 主流程 ──────────────────────────────────────────────────────────

const listFile = readJson('01-list.json')
const detailRows = readJsonl('02-details.jsonl')
const details = new Map(detailRows.map(row => [row.slug, row]))
const listItems = listFile.items
const allSlugs = new Set(listItems.map(item => item.slug))

const issues = {
  missingDetail: [], badDomainRating: [], badPricing: [], badApproval: [],
  missingSiteUrl: [], missingSubmitUrl: [], dirtySpecSubmitPage: [],
  // v2 审计项：官网候选不一致（不自动覆盖）、提交入口推断候选（不入库）
  siteUrlMismatch: [], unusableSubmitCandidate: [],
}
const stats = {
  productTypesCovered: 0,
  productTypeCounts: {},
  submitPageResolution: {},
}

const sites = []
const categoryRows = []
const relationRows = []
const relationKeys = new Set()
const categoriesBySlug = new Map()

for (let index = 0; index < listItems.length; index++) {
  const item = listItems[index]
  const detail = details.get(item.slug)
  if (!detail) {
    issues.missingDetail.push(item.slug)
    continue
  }

  const spec = detail.spec || {}
  const norm = detail.specNormalized || {}
  const drRaw = spec.domainRating
  const dr = cleanDomainRating(drRaw, norm.domainRatingNum)
  if (dr === null) issues.badDomainRating.push({ slug: item.slug, raw: String(drRaw ?? '') })

  const pricing = cleanPricing(spec.pricing, norm.pricingTier)
  if (pricing === 'unknown') issues.badPricing.push({ slug: item.slug, raw: String(spec.pricing ?? '') })

  const approval = cleanApproval(spec.approval)
  if (!Object.hasOwn(APPROVAL_BUCKET, String(spec.approval ?? '').trim())) {
    issues.badApproval.push({ slug: item.slug, raw: String(spec.approval ?? '') })
  }

  // 官网与提交入口仍以详情 links 的前两条外链为准；v2 的 submitPageUrl 是
  // 「相对路径 + 官网域名」的机械拼接，47 条缺失候选几乎全是 /pack、/.、/is
  // 之类的正文碎片，不能作为提交入口。这里只记录差异供人工复核。
  const ext = externalLinks(detail)
  const siteUrl = ext[0] || null
  const submitUrl = ext[1] || null
  if (!siteUrl) issues.missingSiteUrl.push(item.slug)
  if (!submitUrl) issues.missingSubmitUrl.push(item.slug)
  if (/\s/.test(String(spec.submitPage ?? ''))) issues.dirtySpecSubmitPage.push(item.slug)

  const v2SiteUrl = platformWebsiteUrl(detail)
  if (v2SiteUrl && siteUrl && hostnameOf(v2SiteUrl) !== hostnameOf(siteUrl)) {
    issues.siteUrlMismatch.push({ slug: item.slug, current: siteUrl, candidate: v2SiteUrl })
  }
  const resolution = String(detail.submitPageResolution || 'unresolved')
  stats.submitPageResolution[resolution] = (stats.submitPageResolution[resolution] || 0) + 1
  if (!submitUrl && detail.submitPageUrl) {
    issues.unusableSubmitCandidate.push({ slug: item.slug, candidate: String(detail.submitPageUrl) })
  }

  const productTypes = productTypesOf(detail)
  if (productTypes.length) stats.productTypesCovered++
  for (const type of productTypes) {
    stats.productTypeCounts[type] = (stats.productTypeCounts[type] || 0) + 1
  }

  const text = [
    displayName(detail, item),
    item.cardRaw || '',
    detail.h1 || '',
    detail.meta?.description || '',
    hostnameOf(siteUrl || ''),
  ].join(' ')

  const site = {
    slug: item.slug,
    name: displayName(detail, item),
    site_url: siteUrl,
    submit_url: submitUrl,
    submit_method: submitMethodOf(submitUrl),
    domain_rating: dr,
    pricing,
    has_free_submission: freeSubmissionOf(item.listPricing, pricing),
    approval,
    approval_bucket: APPROVAL_BUCKET[approval],
    dofollow_link: cleanBoolean(spec.dofollowLink, norm.dofollowLinkBool),
    backlink_required: cleanBoolean(spec.backlinkRequired, norm.backlinkRequiredBool),
    accepts_product_types: JSON.stringify(productTypes),
    approval_time: approvalTimeOf(detail),
    submit_steps: JSON.stringify(textListOf(detail.howToSubmit)),
    submit_requirements: JSON.stringify(textListOf(detail.requirements, { maxItems: 12, maxLen: 200 })),
    gotchas: JSON.stringify(textListOf(detail.gotchasList, { maxItems: 6 })),
    rejection_reasons: JSON.stringify(textListOf(detail.rejectionReasons, { maxItems: 6, maxLen: 400 })),
    icon_url: platformImageUrl(detail, 'icon.png'),
    screenshot_url: platformImageUrl(detail, 'shot.webp'),
    list_order: index,
    is_featured: index < 25 ? 1 : 0,
    summary: '',
    fact_points: '[]',
    editorial: null,
    attribution: ATTRIBUTION,
    source_url: item.url || `${SOURCE_URL_BASE}${item.slug}/`,
    source_snapshot: SNAPSHOT,
    data_source: 'snapshot',
    verification_status: 'snapshot',
    last_checked_at: null,
    page_rank: null,
    page_rank_checked_at: null,
    status: 'active',
    // 首期只索引有提交入口且 DR≥50 的条目，避免 848 个薄页
    indexed: submitUrl && dr !== null && dr >= 50 ? 1 : 0,
    click_count: 0,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updated_at: null,
  }
  site.fact_points = JSON.stringify(factPointsOf(site))
  site.summary = summaryOf(site)
  sites.push(site)

  const cats = categoriesOf(text, item.slug)
  categoryRows.push(...cats)
  categoriesBySlug.set(item.slug, cats.map(c => c.category_slug))

  // 相关平台边：仅取带 "N shared" 标记的推荐，作为未来 alternatives 榜的候选
  for (const link of detail.links || []) {
    const href = String(link?.href || '')
    if (!href.includes('/platform/') || !href.includes('submitmap.com')) continue
    const target = href.split('/').filter(Boolean).pop()
    const shared = /(\d+)\s+shared/.exec(String(link?.text || ''))
    if (!target || !allSlugs.has(target) || target === item.slug || !shared) continue
    const key = `${item.slug}|${target}|similar`
    if (relationKeys.has(key)) continue
    relationKeys.add(key)
    relationRows.push({
      site_slug: item.slug,
      related_slug: target,
      relation_type: 'similar',
      weight: Math.min(6, Number(shared[1])),
      confirmed: 0,
    })
  }
}

// ── Alternatives 榜：基于相似关系候选，策展型 ──────────────────────────
// 快照里 4911 条 similar 边（weight = 共同标签数）。每个基准平台取 weight>=2 的候选，
// 作为 "X alternatives" 策展榜的成员；基准自身从成员中排除。维度归为 alternatives。
const ALT_BASES = {
  'product-hunt': 'Product Hunt',
  'betalist': 'BetaList',
  'appsumo': 'AppSumo',
  'startup-stash': 'Startup Stash',
  'fazier': 'Fazier',
  'toolify': 'Toolify',
  'the-toolify': 'The Toolify',
}
const byBase = new Map()
for (const r of relationRows) {
  if (!byBase.has(r.site_slug)) byBase.set(r.site_slug, [])
  byBase.get(r.site_slug).push({ slug: r.related_slug, weight: r.weight })
}
for (const [base, label] of Object.entries(ALT_BASES)) {
  const candidates = (byBase.get(base) || [])
    .filter(c => c.weight >= 2)
    .sort((a, b) => b.weight - a.weight)
    .map(c => c.slug)
  if (!candidates.length) continue
  LIST_DEFS.push({
    slug: `${base}-alternatives`,
    title: `${label} Alternatives`,
    description: `Submission platforms similar to ${label}, drawn from co-occurrence in the ${SNAPSHOT} snapshot.`,
    dimension: 'alternatives',
    kind: 'curated',
    filters: null,
    sort: DESC_SORT,
    limit_mode: 'all', limit_count: 0, min_items: 3,
    ruleText: `the platform is a similar or alternative to ${label} in the snapshot`,
    angle: `If you already use ${label}, these are the next places worth submitting to.`,
    include_slugs: candidates,
    exclude_slugs: [base],
    pinned_order: [],
  })
}

// 榜单定义 + 物化成员
const lists = []
const listItemRows = []
for (const def of LIST_DEFS) {
  const editorial = editorialOf(def)
  const members = resolveList(def, sites, categoriesBySlug)
  if (members.length < (def.min_items ?? 10)) {
    console.warn(`[skip] ${def.slug}: only ${members.length} members (< ${def.min_items})`)
    continue
  }
  lists.push({
    slug: def.slug,
    title: def.title,
    description: def.description,
    dimension: def.dimension,
    kind: def.kind,
    filters: JSON.stringify(def.filters),
    sort: JSON.stringify(def.sort),
    limit_mode: def.limit_mode,
    limit_count: def.limit_count,
    min_items: def.min_items ?? 10,
    include_slugs: JSON.stringify(def.include_slugs || []),
    exclude_slugs: JSON.stringify(def.exclude_slugs || []),
    pinned_order: JSON.stringify(def.pinned_order || []),
    intro: editorial.intro,
    methodology: editorial.methodology,
    faq: JSON.stringify(editorial.faq),
    seo_title: `${def.title} (2026)`,
    seo_description: `${def.description} ${members.length} platforms, ordered by the published criteria. Free, open data from aifindr.org.`,
    canonical_policy: 'self',
    status: 'published',
    snapshot_id: SNAPSHOT_ID,
    item_count: members.length,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updated_at: null,
  })
  members.forEach((site, position) => {
    listItemRows.push({
      snapshot_id: SNAPSHOT_ID,
      list_slug: def.slug,
      site_slug: site.slug,
      position: position + 1,
      pinned: 0,
      note: null,
    })
  })
}

// ── 输出 1：D1 seed ─────────────────────────────────────────────────

const SITE_COLUMNS = [
  'slug', 'name', 'site_url', 'submit_url', 'submit_method', 'domain_rating', 'pricing',
  'has_free_submission', 'approval', 'approval_time', 'approval_bucket', 'dofollow_link',
  'backlink_required',
  'accepts_product_types', 'submit_steps', 'submit_requirements', 'gotchas', 'rejection_reasons',
  'list_order', 'is_featured', 'summary', 'fact_points', 'editorial', 'attribution',
  'source_url', 'source_snapshot', 'icon_url', 'screenshot_url',
  'data_source', 'verification_status', 'last_checked_at',
  'page_rank', 'page_rank_checked_at',
  'status', 'indexed', 'click_count', 'created_at', 'updated_at',
]
const CATEGORY_COLUMNS = ['site_slug', 'category_slug', 'parent_slug', 'confidence', 'source']
const RELATION_COLUMNS = ['site_slug', 'related_slug', 'relation_type', 'weight', 'confirmed']
const LIST_COLUMNS = [
  'slug', 'title', 'description', 'dimension', 'kind', 'filters', 'sort', 'limit_mode',
  'limit_count', 'min_items', 'include_slugs', 'exclude_slugs', 'pinned_order', 'intro',
  'methodology', 'faq', 'seo_title', 'seo_description', 'canonical_policy', 'status',
  'snapshot_id', 'item_count', 'created_at', 'updated_at',
]
const ITEM_COLUMNS = ['snapshot_id', 'list_slug', 'site_slug', 'position', 'pinned', 'note']

const sql = [
  `-- Generated by scripts/build-submission-sites.mjs — snapshot ${SNAPSHOT} (${SNAPSHOT_ID})`,
  '-- Import with: wrangler d1 execute aifindr-db --remote --file=./schema/seed-submission-sites.sql',
  '-- Safe to re-run: admin-added sites, manual category tags, confirmed relations, list curation',
  '-- (status / kind / filters / sort / pinned_order / include / exclude / intro / FAQ / SEO) are preserved.',
  '-- After re-running, trigger "Refresh all lists" in /admin/submission-lists once to restore pinned positions.',
  '',
  // 快照版本会变：清掉所有非策展成员，避免旧 snapshot_id 的成员行残留；
  // 再把人工 pinned 行迁到新版本，否则策展位会与榜单定义失联。
  'DELETE FROM submission_list_items WHERE pinned = 0;',
  `UPDATE OR IGNORE submission_list_items SET snapshot_id = '${SNAPSHOT_ID}' WHERE snapshot_id <> '${SNAPSHOT_ID}';`,
  '',
]
for (const row of sites) sql.push(upsertSiteStatement(SITE_COLUMNS, row))
// 只清规则标签，管理员的 manual 标签保留
sql.push('', `DELETE FROM site_categories WHERE source = 'rule' AND site_slug IN (SELECT slug FROM submission_sites WHERE source_snapshot = '${SNAPSHOT}');`, '')
for (const row of categoryRows) sql.push(insertStatement('site_categories', CATEGORY_COLUMNS, row, 'OR IGNORE'))
// 只清未确认的候选关系
sql.push('', `DELETE FROM site_relations WHERE confirmed = 0 AND site_slug IN (SELECT slug FROM submission_sites WHERE source_snapshot = '${SNAPSHOT}');`, '')
for (const row of relationRows) sql.push(insertStatement('site_relations', RELATION_COLUMNS, row, 'OR IGNORE'))
sql.push('')
for (const row of lists) sql.push(upsertListStatement(LIST_COLUMNS, row))
sql.push('')
for (const row of listItemRows) sql.push(insertStatement('submission_list_items', ITEM_COLUMNS, row, 'OR IGNORE'))
sql.push('')

mkdirSync(resolve(ROOT, 'schema'), { recursive: true })
writeFileSync(resolve(ROOT, 'schema/seed-submission-sites.sql'), sql.join('\n'), 'utf8')

// ── 输出 2：开放下载（只含事实字段与本站原创摘要） ─────────────────────

const publicFields = [
  'slug', 'name', 'site_url', 'submit_url', 'submit_method', 'domain_rating', 'pricing',
  'has_free_submission', 'approval', 'approval_time', 'approval_bucket', 'dofollow_link',
  'backlink_required',
  'accepts_product_types', 'submit_steps', 'submit_requirements', 'gotchas', 'rejection_reasons',
  'icon_url', 'screenshot_url',
  'summary', 'source_url', 'source_snapshot', 'verification_status',
]
const openData = {
  license: 'CC0-1.0 applies to aifindr.org\'s compilation and generated summaries. Submission steps, '
    + 'requirements, gotchas and rejection reasons are quoted from SubmitMap\'s platform pages — '
    + 'keep their attribution when redistributing.',
  attribution: ATTRIBUTION,
  snapshot: SNAPSHOT,
  snapshotId: SNAPSHOT_ID,
  total: sites.length,
  fields: publicFields,
  sites: sites.map(site => {
    const row = {}
    for (const field of publicFields) row[field] = site[field]
    row.categories = categoriesBySlug.get(site.slug) || []
    return row
  }),
  lists: lists.map(list => ({
    slug: list.slug, title: list.title, dimension: list.dimension,
    itemCount: list.item_count, filters: JSON.parse(list.filters),
  })),
}
mkdirSync(resolve(ROOT, 'public/data'), { recursive: true })
writeFileSync(
  resolve(ROOT, 'public/data/submission-sites.json'),
  JSON.stringify(openData, null, 2),
  'utf8',
)

// ── 输出 3：清洗报告 ────────────────────────────────────────────────

const report = {
  snapshot: SNAPSHOT,
  snapshotId: SNAPSHOT_ID,
  sourceDir: relative(ROOT, RES),
  sourceFiles: ['01-list.json', '02-details.jsonl'],
  totals: {
    listItems: listItems.length,
    detailRows: detailRows.length,
    joined: sites.length,
    categories: categoryRows.length,
    relations: relationRows.length,
    lists: lists.length,
    listMemberships: listItemRows.length,
    indexed: sites.filter(s => s.indexed).length,
    featured: sites.filter(s => s.is_featured).length,
    productTypesCovered: stats.productTypesCovered,
  },
  productTypes: Object.fromEntries(
    Object.entries(stats.productTypeCounts).sort((a, b) => b[1] - a[1]),
  ),
  contentCoverage: {
    submitSteps: sites.filter(s => s.submit_steps !== '[]').length,
    submitRequirements: sites.filter(s => s.submit_requirements !== '[]').length,
    gotchas: sites.filter(s => s.gotchas !== '[]').length,
    rejectionReasons: sites.filter(s => s.rejection_reasons !== '[]').length,
    approvalTime: sites.filter(s => s.approval_time).length,
    icons: sites.filter(s => s.icon_url).length,
    screenshots: sites.filter(s => s.screenshot_url).length,
  },
  submitPageResolution: stats.submitPageResolution,
  issues: {
    ...issues,
    counts: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])),
  },
  listSizes: Object.fromEntries(lists.map(list => [list.slug, list.item_count])),
  note: 'platforms.json / platforms.csv are lossy exports and are intentionally not used as inputs. '
    + 'Quoted content (howToSubmit / requirements / gotchas / rejectionReasons) is sanitized and imported '
    + 'with SubmitMap attribution; FAQ / lead / badge HTML / agent pitch are never imported; '
    + 'inferred submitPageUrl / platformWebsite stay audit-only.',
}
mkdirSync(resolve(ROOT, 'reports'), { recursive: true })
writeFileSync(
  resolve(ROOT, 'reports/submission-sites-cleaning.json'),
  JSON.stringify(report, null, 2),
  'utf8',
)

console.log(`[ok] source ${report.sourceDir}, snapshot ${SNAPSHOT} (${SNAPSHOT_ID})`)
console.log(`[ok] ${sites.length} sites, ${categoryRows.length} categories, ${relationRows.length} relations`)
console.log(`[ok] product types on ${stats.productTypesCovered}/${sites.length} sites (${Object.keys(stats.productTypeCounts).length} distinct)`)
console.log(`[ok] ${lists.length} lists, ${listItemRows.length} memberships`)
console.log('[ok] list sizes:', report.listSizes)
