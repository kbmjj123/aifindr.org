/**
 * 榜单刷新引擎：规则型榜单按定义从 D1 重算成员，写物化表 + changelog，
 * 并失效相关 KV 缓存。策展位（pinned_order / include / exclude）在重算后叠加，
 * 因此快照刷新不会冲掉人工选品。
 */
import type { CloudflareEnv } from './env'
import { compileFilters, compileSort } from './submissionFilters'
import type { FilterExpression, SortRule, SubmissionList } from '~/types/submissionSite'

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export interface RefreshResult {
  slug: string
  before: number
  after: number
  joined: number
  left: number
}

/** 分块执行，避免单次 D1 batch 语句过多 */
async function runInChunks(env: CloudflareEnv, statements: D1PreparedStatement[]) {
  for (let i = 0; i < statements.length; i += 200) {
    await env.DB.batch(statements.slice(i, i + 200))
  }
}

export async function refreshList(
  env: CloudflareEnv,
  list: SubmissionList,
  snapshotId: string,
): Promise<RefreshResult> {
  const expression = parseJson<FilterExpression | null>(list.filters, null)
  const sort = parseJson<SortRule[] | null>(list.sort, null)
  const compiled = compileFilters(expression)
  const cap = list.limit_mode === 'topN' && list.limit_count > 0
    ? Math.min(1000, list.limit_count)
    : 5000

  // 纯策展榜（无筛选规则）只由 include_slugs 定义成员，避免误把全库 848 条塞进精选短榜
  const pureCurated = list.kind === 'curated' && !expression?.and?.length
  let slugs: string[] = []
  if (!pureCurated) {
    const { results } = await env.DB.prepare(
      `SELECT s.slug FROM submission_sites s WHERE s.status = 'active'${compiled.where} `
      + `ORDER BY ${compileSort(sort)} LIMIT ?`
    ).bind(...compiled.params, cap).all<{ slug: string }>()
    slugs = (results || []).map(row => row.slug)
  }

  const include = parseJson<string[]>(list.include_slugs, [])
  const exclude = new Set(parseJson<string[]>(list.exclude_slugs, []))
  const pinned = parseJson<string[]>(list.pinned_order, [])

  // include_slugs 由管理员维护，先校验目标存在且为 active，避免外键冲突让整个刷新失败
  let validInclude = include
  if (include.length) {
    const { results: validRows } = await env.DB.prepare(
      `SELECT slug FROM submission_sites WHERE status = 'active' AND slug IN (${include.map(() => '?').join(',')})`
    ).bind(...include).all<{ slug: string }>()
    const validSet = new Set((validRows || []).map(row => row.slug))
    validInclude = include.filter(slug => validSet.has(slug))
  }

  slugs = slugs.filter(slug => !exclude.has(slug))
  for (const slug of validInclude) if (!slugs.includes(slug)) slugs.push(slug)
  if (pinned.length) {
    const pinnedSet = new Set(pinned)
    slugs = [
      ...pinned.filter(slug => slugs.includes(slug)),
      ...slugs.filter(slug => !pinnedSet.has(slug)),
    ]
  }
  if (list.limit_mode === 'topN' && list.limit_count > 0) {
    slugs = slugs.slice(0, list.limit_count)
  }

  const { results: previous } = await env.DB.prepare(
    'SELECT site_slug FROM submission_list_items WHERE snapshot_id = ? AND list_slug = ?'
  ).bind(snapshotId, list.slug).all<{ site_slug: string }>()
  const beforeSet = new Set((previous || []).map(row => row.site_slug))
  const afterSet = new Set(slugs)
  const joined = slugs.filter(slug => !beforeSet.has(slug))
  const left = [...beforeSet].filter(slug => !afterSet.has(slug))

  const statements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM submission_list_items WHERE snapshot_id = ? AND list_slug = ?')
      .bind(snapshotId, list.slug),
  ]
  slugs.forEach((slug, index) => {
    statements.push(env.DB.prepare(
      'INSERT OR IGNORE INTO submission_list_items (snapshot_id, list_slug, site_slug, position, pinned) VALUES (?, ?, ?, ?, ?)'
    ).bind(snapshotId, list.slug, slug, index + 1, pinned.includes(slug) ? 1 : 0))
  })
  for (const slug of joined) {
    // 新置顶的成员单独记为 pinned，便于区分自动进榜与人工策展
    const changeType = pinned.includes(slug) ? 'pinned' : 'joined'
    statements.push(env.DB.prepare(
      'INSERT INTO submission_list_changelog (snapshot_id, list_slug, site_slug, change_type) VALUES (?, ?, ?, ?)'
    ).bind(snapshotId, list.slug, slug, changeType))
  }
  for (const slug of left) {
    statements.push(env.DB.prepare(
      'INSERT INTO submission_list_changelog (snapshot_id, list_slug, site_slug, change_type) VALUES (?, ?, ?, ?)'
    ).bind(snapshotId, list.slug, slug, 'left'))
  }
  statements.push(env.DB.prepare(
    'UPDATE submission_lists SET item_count = ?, snapshot_id = ?, updated_at = ? WHERE slug = ?'
  ).bind(slugs.length, snapshotId, new Date().toISOString().replace('T', ' ').slice(0, 19), list.slug))

  await runInChunks(env, statements)
  return { slug: list.slug, before: beforeSet.size, after: slugs.length, joined: joined.length, left: left.length }
}

/** 失效榜单/目录相关 KV 缓存。KV list 是最终一致的，配合 1h TTL 足够 */
export async function invalidateSubmissionCaches(env: CloudflareEnv, listSlug?: string) {
  await env.CACHE.delete('submission-lists:index')
  await env.CACHE.delete('submission-sites:facets')

  const prefixes = [
    listSlug ? `submission-list:${listSlug}:` : 'submission-list:',
    'submission-sites:',
    'submission-site:',
  ]
  for (const prefix of prefixes) {
    const listed = await env.CACHE.list({ prefix })
    await Promise.all(listed.keys.map(key => env.CACHE.delete(key.name)))
  }
}
