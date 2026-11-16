#!/usr/bin/env node
/**
 * 生成改写优先级队列 docs/rewritten/_priority.json。
 *
 * 评分来源：本地 D1（submission_sites + submission_list_items），因为开放数据
 * public/data/submission-sites.json 不含 is_featured 与每站榜单归属。
 * 评分：DR/20（上限 5）+ featured(5) + 榜单数×3，降序，同分按 slug 字母序。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function findLocalDb() {
  const dir = resolve(ROOT, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
  if (!existsSync(dir)) throw new Error('local D1 not found; run wrangler d1 execute --local first')
  const file = readdirSync(dir).find(f => f.endsWith('.sqlite') && !f.startsWith('metadata'))
  if (!file) throw new Error('local D1 sqlite file not found')
  return resolve(dir, file)
}

const db = new Database(findLocalDb(), { readonly: true })
const sites = db.prepare(
  "SELECT slug, name, domain_rating, is_featured FROM submission_sites WHERE status = 'active'",
).all()
const listCounts = new Map(
  db.prepare('SELECT site_slug, COUNT(*) AS n FROM submission_list_items GROUP BY site_slug').all()
    .map(r => [r.site_slug, r.n]),
)
db.close()

const scored = sites.map(s => {
  const dr = typeof s.domain_rating === 'number' ? Math.min(s.domain_rating / 20, 5) : 0
  const featured = s.is_featured ? 5 : 0
  const lists = (listCounts.get(s.slug) || 0) * 3
  return {
    slug: s.slug, name: s.name,
    score: Math.round((dr + featured + lists) * 10) / 10,
    dr: s.domain_rating, featured: !!s.is_featured, lists: listCounts.get(s.slug) || 0,
  }
})

scored.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
writeFileSync(
  resolve(ROOT, 'docs/rewritten/_priority.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), total: scored.length, sites: scored }, null, 2),
  'utf8',
)
console.log(`[ok] priority queue: ${scored.length} sites, top: ${scored[0]?.slug} (${scored[0]?.score})`)
