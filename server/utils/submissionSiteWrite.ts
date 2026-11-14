/**
 * 外链提交平台 —— 后台写入共用层
 *
 * 新增 / 编辑 / 批量导入三条路径共用同一套字段归一化、字段完整性门禁、
 * 原创文案生成与榜单刷新，避免口径漂移。所有说明文案由本站生成。
 */
import type { CloudflareEnv } from './env'
import { invalidateSubmissionCaches, refreshList } from './submissionLists'
import { SUBMISSION_ATTRIBUTION } from '~/types/submissionSite'
import type {
  ApprovalBucket, SubmissionList, SubmissionMethod, SubmissionPricing, SubmissionSite,
} from '~/types/submissionSite'

const PRICING: SubmissionPricing[] = ['free', 'freemium', 'paid', 'optional', 'unknown']
const METHODS: SubmissionMethod[] = ['form', 'github_pr', 'awesome_list', 'sign_in', 'community_post', 'external', 'unknown']
const BUCKETS: ApprovalBucket[] = ['fast', 'week', 'month', 'slow', 'unknown']
const STATUSES = ['active', 'needs_info', 'hidden'] as const
export type SiteStatus = typeof STATUSES[number]

export interface SiteWriteInput {
  slug: string
  name: string
  site_url: string
  submit_url: string | null
  submit_method: SubmissionMethod
  domain_rating: number | null
  pricing: SubmissionPricing
  has_free_submission: number | null
  approval: string
  approval_bucket: ApprovalBucket
  dofollow_link: number | null
  backlink_required: number | null
  categories: string[]
  editorial: string | null
  status: SiteStatus
  indexed: number
  is_featured: number
  list_order: number
  data_source: 'snapshot' | 'user' | 'admin'
  verification_status: 'snapshot' | 'self_reported' | 'verified'
  source_url: string | null
  source_snapshot: string | null
}

function has(body: Record<string, unknown>, key: string) {
  return Object.hasOwn(body, key)
}

function asString(body: Record<string, unknown>, key: string, fallback: string, max = 500): string {
  return has(body, key) ? String(body[key] ?? '').trim().slice(0, max) : fallback
}

function asNullableString(body: Record<string, unknown>, key: string, fallback: string | null, max = 1000): string | null {
  if (!has(body, key)) return fallback
  const value = String(body[key] ?? '').trim().slice(0, max)
  return value || null
}

function asTriBool(body: Record<string, unknown>, key: string, fallback: number | null): number | null {
  if (!has(body, key)) return fallback
  const raw = body[key]
  if (raw === null || raw === '' || raw === undefined) return null
  const value = Number(raw)
  return value === 1 || value === 0 ? value : fallback
}

function asEnum<T extends string>(body: Record<string, unknown>, key: string, allowed: T[], fallback: T): T {
  if (!has(body, key)) return fallback
  const value = String(body[key] ?? '').trim() as T
  return allowed.includes(value) ? value : fallback
}

function asInt(body: Record<string, unknown>, key: string, fallback: number | null, min = 0, max = 1000000): number | null {
  if (!has(body, key)) return fallback
  const raw = body[key]
  if (raw === null || raw === '' || raw === undefined) return null
  const value = Math.floor(Number(raw))
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

/** 从现有行 + 请求体归一化；编辑时未提供的字段保持不变 */
export function normalizeSiteInput(
  body: Record<string, unknown>,
  base?: Partial<SiteWriteInput>,
): SiteWriteInput {
  const pricing = asEnum<SubmissionPricing>(body, 'pricing', PRICING, base?.pricing ?? 'unknown')
  const explicitFree = asTriBool(body, 'has_free_submission', base?.has_free_submission ?? null)
  const derivedFree = pricing === 'paid' ? 0 : pricing === 'unknown' ? null : 1
  const categories = has(body, 'categories') && Array.isArray(body.categories)
    ? body.categories.map(String).filter(v => /^[a-z0-9-]{1,60}$/.test(v)).slice(0, 12)
    : (base?.categories ?? [])

  return {
    slug: asString(body, 'slug', base?.slug ?? '', 120),
    name: asString(body, 'name', base?.name ?? '', 160),
    site_url: asString(body, 'site_url', base?.site_url ?? '', 500),
    submit_url: asNullableString(body, 'submit_url', base?.submit_url ?? null),
    submit_method: asEnum<SubmissionMethod>(body, 'submit_method', METHODS, base?.submit_method ?? 'unknown'),
    domain_rating: asInt(body, 'domain_rating', base?.domain_rating ?? null, 0, 100),
    pricing,
    has_free_submission: explicitFree !== null ? explicitFree : derivedFree,
    approval: asString(body, 'approval', base?.approval ?? 'Not stated', 80) || 'Not stated',
    approval_bucket: asEnum<ApprovalBucket>(body, 'approval_bucket', BUCKETS, base?.approval_bucket ?? 'unknown'),
    dofollow_link: asTriBool(body, 'dofollow_link', base?.dofollow_link ?? null),
    backlink_required: asTriBool(body, 'backlink_required', base?.backlink_required ?? null),
    categories,
    editorial: asNullableString(body, 'editorial', base?.editorial ?? null, 4000),
    status: asEnum<SiteStatus>(body, 'status', [...STATUSES], base?.status ?? 'needs_info'),
    indexed: asInt(body, 'indexed', base?.indexed ?? 0, 0, 1) ?? 0,
    is_featured: asInt(body, 'is_featured', base?.is_featured ?? 0, 0, 1) ?? 0,
    list_order: asInt(body, 'list_order', base?.list_order ?? 999999, 0) ?? 999999,
    data_source: asEnum(body, 'data_source', ['snapshot', 'user', 'admin'] as const, base?.data_source ?? 'admin'),
    verification_status: asEnum(body, 'verification_status', ['snapshot', 'self_reported', 'verified'] as const, base?.verification_status ?? 'verified'),
    source_url: asNullableString(body, 'source_url', base?.source_url ?? null),
    source_snapshot: asNullableString(body, 'source_snapshot', base?.source_snapshot ?? null, 20),
  }
}

/** 字段完整性门禁：缺任一必填事实的站点不参与榜单，也不进 sitemap */
export function siteIsComplete(row: SiteWriteInput): boolean {
  return row.pricing !== 'unknown'
    && row.domain_rating !== null
    && row.dofollow_link !== null
    && row.backlink_required !== null
    && row.approval_bucket !== 'unknown'
    && !!row.submit_url
    && row.categories.length > 0
    && row.status !== 'hidden'
}

export function buildSummary(row: SiteWriteInput): string {
  const parts = [`${row.name} is a platform where you can submit a product or website for a listing.`]
  if (row.domain_rating !== null) parts.push(`Its domain rating is ${row.domain_rating}.`)
  const phrase: Record<SubmissionPricing, string> = {
    free: 'Submitting a listing is free',
    freemium: 'The platform is freemium and has a free submission lane',
    paid: 'Listing requires payment',
    optional: 'Payment is optional',
    unknown: 'Pricing was not stated in the snapshot',
  }
  parts.push(`${phrase[row.pricing]}.`)
  if (row.dofollow_link !== null) {
    parts.push(`Listed links are ${row.dofollow_link ? 'dofollow' : 'nofollow'}.`)
  }
  parts.push(`Approval is recorded as "${row.approval}".`)
  if (row.backlink_required !== null) {
    parts.push(row.backlink_required
      ? 'The platform asks for a backlink or badge in return.'
      : 'The platform does not ask for a backlink or badge.')
  }
  if (row.submit_method !== 'unknown') parts.push(`Submissions go through ${row.submit_method.replace(/_/g, ' ')}.`)
  return parts.join(' ')
}

export function buildFactPoints(row: SiteWriteInput): string[] {
  const points: string[] = []
  if (row.domain_rating !== null) points.push(`Domain rating ${row.domain_rating}`)
  points.push(`Platform pricing: ${row.pricing}`)
  points.push(row.has_free_submission === 1 ? 'A free submission lane is available' : 'No free submission lane confirmed')
  if (row.dofollow_link !== null) points.push(row.dofollow_link ? 'Dofollow links' : 'Nofollow links')
  points.push(`Approval: ${row.approval}`)
  if (row.backlink_required !== null) {
    points.push(row.backlink_required ? 'A backlink or badge is required' : 'No backlink or badge required')
  }
  points.push(`Submission channel: ${row.submit_method}`)
  return points
}

/** 分类为覆盖式写入，管理员的复核结果优先于 ETL 规则标签 */
export async function writeSiteCategories(env: CloudflareEnv, slug: string, categories: string[]) {
  await env.DB.prepare('DELETE FROM site_categories WHERE site_slug = ?').bind(slug).run()
  for (const category of categories) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO site_categories (site_slug, category_slug, confidence, source) VALUES (?, ?, ?, ?)'
    ).bind(slug, category, 1, 'manual').run()
  }
}

export async function loadSiteCategories(env: CloudflareEnv, slug: string): Promise<string[]> {
  const { results } = await env.DB.prepare(
    'SELECT category_slug FROM site_categories WHERE site_slug = ? ORDER BY category_slug'
  ).bind(slug).all<{ category_slug: string }>()
  return (results || []).map(row => row.category_slug)
}

/** 把 D1 行转成写入层的 base（编辑时保留未提交字段） */
export function siteRowToInput(row: SubmissionSite, categories: string[]): SiteWriteInput {
  return {
    slug: row.slug,
    name: row.name,
    site_url: row.site_url || '',
    submit_url: row.submit_url,
    submit_method: row.submit_method,
    domain_rating: row.domain_rating,
    pricing: row.pricing,
    has_free_submission: row.has_free_submission,
    approval: row.approval,
    approval_bucket: row.approval_bucket,
    dofollow_link: row.dofollow_link,
    backlink_required: row.backlink_required,
    categories,
    editorial: row.editorial,
    status: row.status,
    indexed: row.indexed,
    is_featured: row.is_featured,
    list_order: row.list_order,
    data_source: row.data_source,
    verification_status: row.verification_status,
    source_url: row.source_url,
    source_snapshot: row.source_snapshot,
  }
}

/** 写入主表（新增或更新），状态由门禁自动校正 */
export async function persistSite(env: CloudflareEnv, row: SiteWriteInput, isNew: boolean) {
  const complete = siteIsComplete(row)
  const status: SiteStatus = row.status === 'hidden' ? 'hidden' : (complete ? 'active' : 'needs_info')
  const indexed = complete && row.indexed === 1 && row.domain_rating !== null && row.domain_rating >= 50 ? 1 : 0
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const summary = buildSummary(row)
  const factPoints = JSON.stringify(buildFactPoints(row))

  if (isNew) {
    await env.DB.prepare(`
      INSERT INTO submission_sites (
        slug, name, site_url, submit_url, submit_method, domain_rating, pricing,
        has_free_submission, approval, approval_bucket, dofollow_link, backlink_required,
        list_order, is_featured, summary, fact_points, editorial, attribution,
        source_url, source_snapshot, data_source, verification_status, status,
        indexed, click_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      row.slug, row.name, row.site_url, row.submit_url, row.submit_method, row.domain_rating, row.pricing,
      row.has_free_submission, row.approval, row.approval_bucket, row.dofollow_link, row.backlink_required,
      row.list_order, row.is_featured, summary, factPoints, row.editorial, SUBMISSION_ATTRIBUTION,
      row.source_url, row.source_snapshot || now.slice(0, 10), row.data_source, row.verification_status,
      status, indexed, 0, now, now,
    ).run()
  } else {
    await env.DB.prepare(`
      UPDATE submission_sites SET
        name = ?, site_url = ?, submit_url = ?, submit_method = ?, domain_rating = ?, pricing = ?,
        has_free_submission = ?, approval = ?, approval_bucket = ?, dofollow_link = ?, backlink_required = ?,
        list_order = ?, is_featured = ?, summary = ?, fact_points = ?, editorial = ?,
        source_url = ?, source_snapshot = ?, data_source = 'admin', verification_status = 'verified',
        status = ?, indexed = ?, updated_at = ?
      WHERE slug = ?
    `).bind(
      row.name, row.site_url, row.submit_url, row.submit_method, row.domain_rating, row.pricing,
      row.has_free_submission, row.approval, row.approval_bucket, row.dofollow_link, row.backlink_required,
      row.list_order, row.is_featured, summary, factPoints, row.editorial,
      row.source_url, row.source_snapshot,
      status, indexed, now, row.slug,
    ).run()
  }

  await writeSiteCategories(env, row.slug, row.categories)
  return { status, indexed, complete }
}

/** 重算所有规则型/混合型榜单，使新增或补齐的站点自动累加 */
export async function refreshRuleLists(env: CloudflareEnv) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM submission_lists WHERE kind IN ('rule','hybrid') AND status != 'archived'"
  ).all<SubmissionList>()
  const refreshed = []
  for (const list of results || []) {
    refreshed.push(await refreshList(env, list, list.snapshot_id || 'manual'))
  }
  await invalidateSubmissionCaches(env)
  return refreshed
}
