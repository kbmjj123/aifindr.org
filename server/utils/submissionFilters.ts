/**
 * 外链提交平台目录 —— 共用筛选引擎
 *
 * 目录页、导出端点、榜单刷新都通过这里把「受限 DSL」翻译成参数化 SQL，
 * 保证同一维度在不同入口的结果一致。字段与操作全部白名单化，不接受任意 SQL。
 */
import type { FilterCondition, FilterExpression, SortRule } from '~/types/submissionSite'

const COLUMNS: Record<string, string> = {
  pricing: 's.pricing',
  has_free_submission: 's.has_free_submission',
  dofollow_link: 's.dofollow_link',
  backlink_required: 's.backlink_required',
  domain_rating: 's.domain_rating',
  approval_bucket: 's.approval_bucket',
  submit_method: 's.submit_method',
  is_featured: 's.is_featured',
  list_order: 's.list_order',
  categories: 'categories',
  name: 's.name',
}

const VALID_OPS = new Set(['eq', 'in', 'gte', 'lte', 'contains'])
const VALID_SORT_DIRS = new Set(['asc', 'desc'])
// categories 是 EXISTS 子查询用的虚拟字段，不是真实列，不能进 ORDER BY
const SORTABLE_FIELDS = new Set(Object.keys(COLUMNS).filter(key => key !== 'categories'))

export interface CompiledFilters {
  where: string
  params: unknown[]
}

function toBindValue(value: unknown): string | number | null {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value
  return String(value)
}

function validCondition(cond: FilterCondition): boolean {
  return !!cond
    && typeof cond.field === 'string'
    && Object.hasOwn(COLUMNS, cond.field)
    && VALID_OPS.has(cond.op)
    && cond.value !== undefined
    && cond.value !== null
}

/** 把 DSL 编译成 ` AND ...` 片段（首条始终为 status 过滤之后追加） */
export function compileFilters(expression: FilterExpression | null): CompiledFilters {
  const conditions = expression?.and || []
  const parts: string[] = []
  const params: unknown[] = []

  for (const cond of conditions) {
    if (!validCondition(cond)) continue

    if (cond.field === 'categories') {
      const values = (Array.isArray(cond.value) ? cond.value : [cond.value]).map(String)
      if (values.length === 0) continue
      parts.push(`EXISTS (SELECT 1 FROM site_categories sc WHERE sc.site_slug = s.slug AND sc.category_slug IN (${values.map(() => '?').join(',')}))`)
      params.push(...values)
      continue
    }

    const column = COLUMNS[cond.field]
    switch (cond.op) {
      case 'eq':
        parts.push(`${column} = ?`)
        params.push(toBindValue(cond.value))
        break
      case 'in': {
        const values = (Array.isArray(cond.value) ? cond.value : [cond.value])
          .map(toBindValue)
          .filter((v): v is string | number => v !== null)
        if (values.length === 0) break
        parts.push(`${column} IN (${values.map(() => '?').join(',')})`)
        params.push(...values)
        break
      }
      case 'gte':
        parts.push(`${column} >= ?`)
        params.push(Number(cond.value))
        break
      case 'lte':
        parts.push(`${column} <= ?`)
        params.push(Number(cond.value))
        break
      case 'contains':
        parts.push(`${column} LIKE ?`)
        params.push(`%${String(cond.value)}%`)
        break
    }
  }

  return { where: parts.length ? ` AND ${parts.join(' AND ')}` : '', params }
}

/** 校验后台新建/编辑榜单时提交的 DSL，字段与操作一律白名单 */
export function validateFilterExpression(value: unknown): { ok: boolean; reason?: string } {
  if (value === null || value === undefined || value === '') return { ok: true }
  if (typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'filters must be an object' }
  const expression = value as { and?: unknown; or?: unknown }
  if (expression.or !== undefined) return { ok: false, reason: 'or groups are not supported' }
  if (expression.and === undefined) return { ok: true }
  if (!Array.isArray(expression.and)) return { ok: false, reason: 'and must be an array' }
  if (expression.and.length > 12) return { ok: false, reason: 'too many conditions' }
  for (const item of expression.and) {
    if (!validCondition(item as FilterCondition)) {
      return { ok: false, reason: 'a condition uses an unknown field or operator' }
    }
    const cond = item as FilterCondition
    if (cond.field === 'categories' && !['eq', 'in', 'contains'].includes(cond.op)) {
      return { ok: false, reason: 'categories only supports eq / in / contains' }
    }
    if (Array.isArray(cond.value) && cond.value.length > 20) {
      return { ok: false, reason: 'too many values' }
    }
    if ((cond.op === 'gte' || cond.op === 'lte') && !Number.isFinite(Number(cond.value))) {
      return { ok: false, reason: 'range conditions need a numeric value' }
    }
    if (typeof cond.value === 'object' && cond.value !== null && !Array.isArray(cond.value)) {
      return { ok: false, reason: 'value must be a scalar or an array' }
    }
  }
  return { ok: true }
}

/** 校验排序规则；与 compileSort 使用同一份字段白名单 */
export function validateSortRules(value: unknown): { ok: boolean; reason?: string } {
  if (value === null || value === undefined || value === '') return { ok: true }
  if (!Array.isArray(value) || value.length > 6) return { ok: false, reason: 'sort must be an array of up to 6 rules' }
  for (const rule of value) {
    if (!rule || typeof rule !== 'object') return { ok: false, reason: 'invalid sort rule' }
    const typed = rule as SortRule
    if (!SORTABLE_FIELDS.has(typed.field) || !VALID_SORT_DIRS.has(typed.dir)) {
      return { ok: false, reason: 'sort uses an unknown field or direction' }
    }
  }
  return { ok: true }
}

/** 排序：NULL 永远排最后；approval_bucket 用业务顺序而非字母序；末尾固定 tiebreaker */
export function compileSort(rules: SortRule[] | null): string {
  const parts: string[] = []
  for (const rule of rules || []) {
    if (!SORTABLE_FIELDS.has(rule.field) || !VALID_SORT_DIRS.has(rule.dir)) continue
    const column = COLUMNS[rule.field]
    if (rule.field === 'approval_bucket') {
      parts.push("CASE s.approval_bucket WHEN 'fast' THEN 1 WHEN 'week' THEN 2 WHEN 'month' THEN 3 WHEN 'slow' THEN 4 ELSE 5 END ASC")
      continue
    }
    parts.push(`CASE WHEN ${column} IS NULL THEN 1 ELSE 0 END ASC`)
    parts.push(`${column} ${rule.dir === 'desc' ? 'DESC' : 'ASC'}`)
  }
  parts.push('s.list_order ASC', 's.slug ASC')
  return parts.join(', ')
}

export interface ParsedSiteQuery {
  expression: FilterExpression
  search: string
  sort: SortRule[]
  page: number
  pageSize: number
}

const SORT_PRESETS: Record<string, SortRule[]> = {
  dr: [{ field: 'domain_rating', dir: 'desc' }],
  fast: [{ field: 'approval_bucket', dir: 'asc' }, { field: 'domain_rating', dir: 'desc' }],
  name: [{ field: 'name', dir: 'asc' }],
  featured: [{ field: 'is_featured', dir: 'desc' }, { field: 'domain_rating', dir: 'desc' }],
  default: [{ field: 'domain_rating', dir: 'desc' }],
}

/** URL query → DSL。所有值都做白名单/数值边界处理，避免注入与离谱查询 */
export function parseSiteQuery(query: Record<string, unknown>): ParsedSiteQuery {
  const text = (key: string) => (typeof query[key] === 'string' ? String(query[key]).trim() : '')
  const conditions: FilterCondition[] = []

  const pricing = text('pricing').split(',').filter(v => ['free', 'freemium', 'paid', 'optional'].includes(v))
  if (pricing.length) {
    conditions.push(pricing.length === 1
      ? { field: 'pricing', op: 'eq', value: pricing[0] }
      : { field: 'pricing', op: 'in', value: pricing })
  }

  const dofollow = text('dofollow')
  if (dofollow === 'yes' || dofollow === 'no') {
    conditions.push({ field: 'dofollow_link', op: 'eq', value: dofollow === 'yes' ? 1 : 0 })
  }

  const backlink = text('backlink')
  if (backlink === 'yes' || backlink === 'no') {
    conditions.push({ field: 'backlink_required', op: 'eq', value: backlink === 'yes' ? 1 : 0 })
  }

  const free = text('free')
  if (free === 'yes') conditions.push({ field: 'has_free_submission', op: 'eq', value: 1 })

  const approval = text('approval')
  if (['fast', 'week', 'month', 'slow', 'unknown'].includes(approval)) {
    conditions.push({ field: 'approval_bucket', op: 'eq', value: approval })
  }

  const method = text('method')
  if (['form', 'github_pr', 'awesome_list', 'sign_in', 'community_post', 'external'].includes(method)) {
    conditions.push({ field: 'submit_method', op: 'eq', value: method })
  }

  const category = text('category')
  if (/^[a-z0-9-]{1,60}$/.test(category)) {
    conditions.push({ field: 'categories', op: 'contains', value: category })
  }

  const drMin = Number(text('drMin'))
  if (Number.isFinite(drMin) && drMin > 0) {
    conditions.push({ field: 'domain_rating', op: 'gte', value: Math.min(100, Math.floor(drMin)) })
  }
  const drMax = Number(text('drMax'))
  if (Number.isFinite(drMax) && drMax > 0 && drMax < 100) {
    conditions.push({ field: 'domain_rating', op: 'lte', value: Math.floor(drMax) })
  }

  const page = Math.max(1, Math.min(10000, Math.floor(Number(text('page')) || 1)))
  const pageSize = Math.max(1, Math.min(100, Math.floor(Number(text('pageSize')) || 24)))

  return {
    expression: { and: conditions },
    search: text('q').slice(0, 120),
    sort: SORT_PRESETS[text('sort')] || SORT_PRESETS.default,
    page,
    pageSize,
  }
}

/** 搜索条件（单独拼，因为作用于三列的 OR） */
export function compileSearch(search: string): CompiledFilters {
  if (!search) return { where: '', params: [] }
  return {
    where: ' AND (s.name LIKE ? OR s.site_url LIKE ? OR s.slug LIKE ?)',
    params: [`%${search}%`, `%${search}%`, `%${search}%`],
  }
}

export function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
