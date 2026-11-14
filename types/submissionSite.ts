/**
 * 公共外链提交平台目录 —— 与 tools 表是两类实体。
 * 数据来自 01-list.json（列表视图）+ 02-details.jsonl（详情视图）的双源 join。
 */

export type SubmissionPricing = 'free' | 'freemium' | 'paid' | 'optional' | 'unknown'
export type SubmissionMethod =
  | 'form' | 'github_pr' | 'awesome_list' | 'sign_in'
  | 'community_post' | 'external' | 'unknown'
export type ApprovalBucket = 'fast' | 'week' | 'month' | 'slow' | 'unknown'
export type SubmissionSiteStatus = 'active' | 'needs_info' | 'hidden'
export type ListKind = 'rule' | 'curated' | 'hybrid'
export type ListDimension = 'pricing' | 'link' | 'authority' | 'speed' | 'topic' | 'alternatives'

export interface SubmissionSite {
  slug: string
  name: string
  site_url: string | null
  submit_url: string | null
  submit_method: SubmissionMethod
  domain_rating: number | null
  pricing: SubmissionPricing
  /** 1 有免费提交通道 / 0 无 / null 未核实，与 pricing 是两套口径 */
  has_free_submission: number | null
  approval: string
  approval_bucket: ApprovalBucket
  /** 1 / 0 / null */
  dofollow_link: number | null
  /** 1 / 0 / null；1 表示需要放对方徽章或回链 */
  backlink_required: number | null
  list_order: number
  is_featured: number
  /** 本站原创事实摘要，不复制来源页面文案 */
  summary: string | null
  fact_points: string
  editorial: string | null
  attribution: string | null
  source_url: string | null
  source_snapshot: string | null
  data_source: 'snapshot' | 'user' | 'admin'
  verification_status: 'snapshot' | 'self_reported' | 'verified'
  last_checked_at: string | null
  availability: 'unknown' | 'reachable' | 'unreachable'
  page_rank: number | null
  page_rank_checked_at: string | null
  status: SubmissionSiteStatus
  indexed: number
  click_count: number
  created_at: string
  updated_at: string | null
  /** 由 API 附加 */
  categories?: string[]
  lists?: string[]
}

export interface SubmissionSiteListResponse {
  sites: SubmissionSite[]
  total: number
  page: number
  pageSize: number
  facets: SubmissionFacets
}

export interface SubmissionFacets {
  pricing: Record<string, number>
  dofollow: Record<string, number>
  backlinkRequired: Record<string, number>
  approvalBucket: Record<string, number>
  submitMethod: Record<string, number>
  /** 动态分类计数：后台新增分类后自动出现在前台筛选器里 */
  categories: Record<string, number>
  total: number
  withSubmitUrl: number
}

/** 受限筛选 DSL：只允许白名单字段与操作，可静态校验、可翻译成参数化 SQL */
export type FilterField =
  | 'pricing' | 'has_free_submission' | 'dofollow_link' | 'backlink_required'
  | 'domain_rating' | 'approval_bucket' | 'submit_method' | 'categories'
  | 'is_featured' | 'list_order'

export type FilterOp = 'eq' | 'in' | 'gte' | 'lte' | 'contains'

export interface FilterCondition {
  field: FilterField
  op: FilterOp
  value: string | number | boolean | string[]
}

export interface FilterExpression {
  and?: FilterCondition[]
  or?: FilterCondition[]
}

export type SortField = FilterField | 'name'

export interface SortRule {
  field: SortField
  dir: 'asc' | 'desc'
}

export interface SubmissionList {
  slug: string
  title: string
  description: string | null
  dimension: ListDimension
  kind: ListKind
  filters: string | null
  sort: string | null
  limit_mode: 'all' | 'topN'
  limit_count: number
  min_items: number
  include_slugs: string | null
  exclude_slugs: string | null
  pinned_order: string | null
  intro: string | null
  methodology: string | null
  faq: string | null
  seo_title: string | null
  seo_description: string | null
  canonical_policy: string
  status: 'draft' | 'published' | 'archived'
  snapshot_id: string | null
  item_count: number
  created_at: string
  updated_at: string | null
  /** 由 API 附加 */
  sites?: SubmissionSite[]
}

export interface SubmissionListDetailResponse {
  list: SubmissionList
  sites: SubmissionSite[]
  total: number
}

export interface SubmissionFilterState {
  q: string
  pricing: string
  dofollow: string
  backlink: string
  free: string
  approval: string
  method: string
  category: string
  sort: string
}

export const EMPTY_SUBMISSION_FILTERS: SubmissionFilterState = {
  q: '', pricing: '', dofollow: '', backlink: '', free: '',
  approval: '', method: '', category: '', sort: 'dr',
}

/** 筛选组合 → 规范榜单 URL；未命中的组合在目录页设为 noindex */
/** key 由筛选参数按字母序拼接生成，见 pages/backlink-sites/index.vue */
export const FILTER_CANONICAL_MAP: Record<string, string> = {
  'dofollow=yes|pricing=free': '/submission-lists/free-dofollow',
  'approval=fast': '/submission-lists/fast-approval',
  'backlink=no|pricing=free': '/submission-lists/free-no-badge',
  'backlink=no': '/submission-lists/no-backlink-required',
  'dofollow=yes': '/submission-lists/dofollow-backlinks',
}

export interface SubmissionSiteReport {
  site_slug?: string
  kind: 'correction' | 'new_site' | 'takedown'
  payload?: Record<string, unknown>
  contact?: string
}

/** 快照署名：所有展示页与导出文件都必须带上 */
export const SUBMISSION_ATTRIBUTION =
  'Facts sourced from a public directory snapshot (2026-11-13). '
  + 'Domain rating is a third-party metric, not independently verified by aifindr.org. '
  + 'All editorial text on this page is written by aifindr.org.'

export const SUBMISSION_CATEGORIES: { slug: string; name: string; dimension: ListDimension }[] = [
  { slug: 'ai-tool-directories', name: 'AI Tool Directories', dimension: 'topic' },
  { slug: 'saas-directories', name: 'SaaS Directories', dimension: 'topic' },
  { slug: 'startup-directories', name: 'Startup & Launch Directories', dimension: 'topic' },
  { slug: 'mcp-directories', name: 'MCP Directories', dimension: 'topic' },
  { slug: 'developer-tool-directories', name: 'Developer Tool Directories', dimension: 'topic' },
  { slug: 'review-platforms', name: 'Review Platforms', dimension: 'topic' },
  { slug: 'general-directories', name: 'General Directories', dimension: 'topic' },
]

export const SUBMISSION_DIMENSION_LABELS: Record<ListDimension, string> = {
  pricing: 'By cost',
  link: 'By link type',
  authority: 'By domain rating',
  speed: 'By approval speed',
  topic: 'By product type',
  alternatives: 'Alternatives',
}

export const PRICING_LABELS: Record<SubmissionPricing, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  optional: 'Optional',
  unknown: 'Unknown',
}

export const METHOD_LABELS: Record<SubmissionMethod, string> = {
  form: 'Online form',
  github_pr: 'GitHub pull request',
  awesome_list: 'Awesome list',
  sign_in: 'Sign-in required',
  community_post: 'Community post',
  external: 'External page',
  unknown: 'Not stated',
}
