#!/usr/bin/env node
// aifindr.org — 提交申请自动初审器（零成本版）
//
// 原则：确定性检查优先，不调用任何 LLM 或付费 API。
// 只用 HTTP 请求 + 规则判定把「明显不合格」的提交自动淘汰，
// 剩下的才需要人工或智能体进一步处理，从而把人工工作量压到接近零。
//
// 用法：
//   node scripts/audit-submissions.mjs                 # 审查全部开放 PR（结果会缓存）
//   node scripts/audit-submissions.mjs --limit=20      # 只看最近 20 个
//   node scripts/audit-submissions.mjs --recheck       # 忽略缓存，重新联网探测
//   GITHUB_TOKEN=xxx node scripts/audit-submissions.mjs
//
// 产出：
//   reports/submissions-triage.json  机器可读，供后续流水线消费
//   reports/submissions-triage.md    人读版，带逐条拒绝理由

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const REPO = 'kbmjj123/aifindr.org'
const SITE = 'https://aifindr.org'
const CACHE_FILE = resolve(ROOT, 'reports/.audit-cache.json')

const argv = process.argv.slice(2)
const LIMIT = Number((argv.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0
const RECHECK = argv.includes('--recheck')

// ── 规则配置 ────────────────────────────────────────────────
const VALID_CATEGORIES = ['image', 'writing', 'video', 'audio', 'code', 'productivity',
  'marketing', 'data', 'education', 'business', 'research', 'other']

const PROMO_WORDS = ['best', 'revolutionary', 'amazing', 'ultimate', 'world-class',
  'game-changer', 'game changer', 'cutting-edge', '#1', 'no.1', 'leading']

const NSFW_WORDS = ['nsfw', 'porn', 'xxx', 'nude', 'undress', 'deepnude', 'adult only']

const UA = 'Mozilla/5.0 (compatible; aifindr-auditor/1.0; +https://aifindr.org)'
const TIMEOUT_MS = 9000
const CONCURRENCY = 8

// ── 基础函数 ────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))
const unquote = s => String(s).trim().replace(/^["'](.*)["']$/, '$1')

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' }
}

async function fetchWithTimeout(url, init = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), init.timeout ?? TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, redirect: 'follow', signal: ctl.signal,
      headers: { 'User-Agent': UA, 'Accept': '*/*', ...(init.headers || {}) } })
  } finally { clearTimeout(timer) }
}

async function loadCache() {
  try { return JSON.parse(await readFile(CACHE_FILE, 'utf8')) } catch { return {} }
}

// PR 列表：优先用 GitHub API（有 token 时信息更全），失败则退化为解析网页，
// 保证在没有凭证、API 已限流的情况下依然能完整跑完。
async function fetchOpenPrs() {
  const tryApi = async () => {
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'aifindr-auditor' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const res = await fetchWithTimeout(`https://api.github.com/repos/${REPO}/pulls?state=open&per_page=100`, { headers })
    if (!res.ok) return null
    const list = await res.json()
    return list.map(p => ({ number: p.number, login: p.user.login, created_at: p.created_at, title: p.title }))
  }

  const api = await tryApi().catch(() => null)
  if (api) return { list: api.sort((a, b) => b.number - a.number), via: 'api' }

  const numbers = new Set()
  for (let page = 1; page <= 12; page++) {
    let html = ''
    for (let attempt = 0; attempt < 3 && !html; attempt++) {
      try {
        const res = await fetchWithTimeout(`https://github.com/${REPO}/pulls?state=open&page=${page}`, { timeout: 25000 })
        if (res.ok) html = await res.text()
      } catch { await sleep(1200) }
    }
    if (!html) break
    const found = [...html.matchAll(new RegExp(`/${REPO}/pull/(\\d+)`, 'g'))].map(m => Number(m[1]))
    const before = numbers.size
    found.forEach(n => numbers.add(n))
    if (numbers.size === before) break
  }
  if (numbers.size === 0) throw new Error('无法获取开放 PR 列表')
  return {
    via: 'html',
    list: [...numbers].sort((a, b) => b - a).map(n => ({ number: n, login: '', created_at: '', title: `#${n}` })),
  }
}

async function fetchPrTool(prNumber) {
  const res = await fetchWithTimeout(`https://github.com/${REPO}/pull/${prNumber}.diff`)
  if (!res.ok) return null
  const diff = await res.text()
  const blocks = diff.split(/^diff --git /m).slice(1)
  for (const b of blocks) {
    const path = (b.match(/^\+\+\+ b\/(.+)$/m) || [])[1]
    if (!path || !path.startsWith('content/tools/') || !path.endsWith('.md')) continue
    const lines = b.split('\n')
    const start = lines.findIndex(l => l.startsWith('@@')) + 1
    const body = lines.slice(start)
      .filter(l => l.startsWith('+') && !l.startsWith('+++'))
      .map(l => l.slice(1))
      .join('\n')
    return { path, body }
  }
  return null
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const out = {}
  let listKey = null
  for (const rawLine of m[1].split('\n')) {
    const line = rawLine.trimEnd()
    if (!line.trim()) continue
    const item = line.match(/^\s*-\s+(.*)$/)
    if (item && listKey) { out[listKey] = [...(out[listKey] || []), unquote(item[1])]; continue }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/)
    if (kv) {
      listKey = kv[2].trim() === '' ? kv[1] : null
      out[kv[1]] = kv[2].trim() === '' ? [] : unquote(kv[2])
    }
  }
  return out
}

// 网络探测有抖动：单失败就拒绝会误杀正常站点。
// 因此对传输层失败（超时/连接错误）重试后再定性，只有连续失败才判为不可达。
async function probeSite(url) {
  const r = { status: 0, finalHost: '', error: '', tries: 0 }
  for (let attempt = 1; attempt <= 3; attempt++) {
    r.tries = attempt
    try {
      const res = await fetchWithTimeout(url, { timeout: TIMEOUT_MS })
      r.status = res.status
      r.finalHost = hostOf(res.url)
      r.error = ''
      return r
    } catch (e) {
      r.error = e.name === 'AbortError' ? 'timeout' : String(e.message).slice(0, 50)
      if (attempt < 3) await sleep(1500 * attempt)
    }
  }
  return r
}

// 返回值区分三种状态：拿到数据 / 明确无存档 / 服务不可达。
// 第三态必须区别于「无存档」，否则网络不通时会对全队列误判。
async function waybackAge(host) {
  try {
    const res = await fetchWithTimeout(`https://archive.org/wayback/available?url=${encodeURIComponent(host)}`, { timeout: 12000 })
    if (!res.ok) return { state: 'error' }
    const j = await res.json()
    const ts = j?.archived_snapshots?.closest?.timestamp
    if (!ts) return { state: 'empty' }
    const d = new Date(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`)
    return { state: 'ok', days: Math.floor((Date.now() - d.getTime()) / 86400000) }
  } catch { return { state: 'error' } }
}

async function parallelMap(items, fn, size = CONCURRENCY) {
  const out = []
  for (let i = 0; i < items.length; i += size) {
    out.push(...await Promise.all(items.slice(i, i + size).map(fn)))
  }
  return out
}

// ── 主流程 ──────────────────────────────────────────────────
async function main() {
  console.log('→ 拉取已收录清单（去重用）…')
  let knownHosts = []
  for (let i = 0; i < 3 && knownHosts.length === 0; i++) {
    try {
      const j = await (await fetchWithTimeout(`${SITE}/api/tools?limit=500`)).json()
      knownHosts = (j.tools || []).map(t => hostOf(t.website)).filter(Boolean)
    } catch { await new Promise(r => setTimeout(r, 1500)) }
  }
  console.log(`  已收录 ${knownHosts.length} 个工具`)

  console.log('→ 拉取开放 PR…')
  const { list: rawList, via } = await fetchOpenPrs()
  let prs = rawList.map(p => ({ number: p.number, user: { login: p.login }, created_at: p.created_at || '', title: p.title }))
  if (LIMIT) prs = prs.slice(0, LIMIT)
  console.log(`  ${prs.length} 个开放 PR（来源：${via === 'api' ? 'GitHub API' : '网页解析'}）`)

  const cache = await loadCache()
  console.log('→ 读取 PR 内容（未缓存的才联网）…')
  const drafts = await parallelMap(prs, async pr => {
    const key = String(pr.number)
    if (cache[key]?.body) return cache[key]
    const fetched = await fetchPrTool(pr.number)
    const rec = { pr: pr.number, author: pr.user.login, created: pr.created_at.slice(0, 10),
      title: pr.title.slice(0, 60), path: fetched?.path || '', body: fetched?.body || '' }
    cache[key] = rec
    return rec
  }, 6)

  console.log('→ 静态规则检查…')
  const records = []
  const seenHosts = new Map()

  for (const d of drafts) {
    const mk = (verdict, reasons) => ({ pr: d.pr, author: d.author, created: d.created,
      name: d.title, host: '', site: '', pricing: '', verdict, reasons })

    if (!d.path) { records.push(mk('REJECT', ['PR 未新增 content/tools/**/*.md 文件'])); continue }
    const parts = d.path.replace('content/tools/', '').replace(/\.md$/, '').split('/')
    if (parts.length < 2) { records.push(mk('REJECT', ['文件路径非法，缺少分类目录'])); continue }

    const fm = parseFrontmatter(d.body)
    if (!fm) { records.push(mk('REJECT', ['frontmatter 缺失或格式错误'])); continue }

    const name = unquote(fm.name || '')
    const website = unquote(fm.website || '')
    const desc = unquote(fm.description || '')
    const pricing = unquote(fm.pricing || '')
    const tags = (Array.isArray(fm.tags) ? fm.tags.join(',') : unquote(fm.tags || ''))
    const reasons = []
    let verdict = 'PASS'
    const hard = r => { reasons.push(r); verdict = 'REJECT' }
    const soft = r => { reasons.push(r); if (verdict === 'PASS') verdict = 'MANUAL' }

    if (!name || !website || !desc) hard('缺必填字段（name / website / description）')
    if (!VALID_CATEGORIES.includes(parts[0])) hard(`分类目录非法：${parts[0]}`)
    else if (fm.category && unquote(fm.category) !== parts[0]) soft(`frontmatter 分类 ${unquote(fm.category)} 与目录 ${parts[0]} 不一致`)
    if (!['free', 'freemium', 'paid'].includes(pricing)) hard(`pricing 非法：${pricing || '(空)'}`)
    if (desc.length < 40) soft(`描述过短（${desc.length} 字符）`)

    const lowish = `${name} ${desc} ${tags}`.toLowerCase()
    const promo = PROMO_WORDS.find(w => lowish.includes(w))
    if (promo) soft(`含宣传词 "${promo}"`)
    const nsfw = NSFW_WORDS.find(w => lowish.includes(w))
    if (nsfw) hard(`命中风险词 "${nsfw}"，不适合在主域名发布`)
    if (pricing === 'free' && /\b(credits?|trial|per month|\$\d)\b/i.test(desc)) soft('标称 free 但描述含付费/额度信息')
    if (pricing === 'paid' && lowish.includes('free')) soft('pricing=paid 但标签含 free')

    const host = hostOf(website)
    if (!host) hard(`website 不是合法 URL：${website}`)
    if (host && knownHosts.includes(host)) hard(`${host} 已收录`)
    if (host && seenHosts.has(host)) hard(`与 PR #${seenHosts.get(host)} 重复提交同一域名`)
    if (host) seenHosts.set(host, d.pr)

    records.push({ pr: d.pr, author: d.author, created: d.created, name: name || d.title,
      site: website, host, pricing, category: parts[0], verdict, reasons,
      status: 0, ageDays: null })
  }

  console.log('→ 联网探测存活 / 域名漂移 / 域名年龄…')
  const toProbe = records.filter(r => r.verdict !== 'REJECT' && (RECHECK || !cache[String(r.pr)]?.probed))
  await parallelMap(toProbe, async r => {
    const probe = await probeSite(r.site)
    r.status = probe.status
    // 只有「明确打不开」才淘汰；反爬状态码不能直接当死站，否则误杀 Cloudflare/WAF 站点
    if (probe.error) { r.reasons.push(`站点不可达（${probe.error}）`); r.verdict = 'REJECT' }
    else if ([404, 410].includes(probe.status)) { r.reasons.push(`站点返回 HTTP ${probe.status}`); r.verdict = 'REJECT' }
    else if ([403, 429, 503].includes(probe.status)) {
      r.reasons.push(`HTTP ${probe.status}，疑似反爬拦截而非失效`); if (r.verdict === 'PASS') r.verdict = 'MANUAL'
    } else if (probe.status >= 500) {
      r.reasons.push(`服务器错误 HTTP ${probe.status}`); if (r.verdict === 'PASS') r.verdict = 'MANUAL'
    } else if (probe.finalHost && r.host && probe.finalHost !== r.host) {
      r.reasons.push(`域名漂移：声称 ${r.host}，实际落到 ${probe.finalHost}`); r.verdict = 'REJECT'
    } else if (probe.status >= 300) {
      r.reasons.push(`存在重定向（HTTP ${probe.status}`); if (r.verdict === 'PASS') r.verdict = 'MANUAL'
    }

    if (r.verdict !== 'REJECT') {
      const age = await waybackAge(r.host)
      r.ageDays = age.state === 'ok' ? age.days : null
      if (age.state === 'ok' && age.days < 120) { r.reasons.push(`域名仅 ${age.days} 天历史`); r.verdict = 'REJECT' }
      else if (age.state === 'empty') { r.reasons.push('无历史存档（域名较新或未被抓取）'); if (r.verdict === 'PASS') r.verdict = 'MANUAL' }
      else if (age.state === 'error') { r.reasons.push('存档服务不可达，域名年龄未校验'); }
    }
    const c = cache[String(r.pr)] || {}
    c.probed = true; c.status = r.status; c.ageDays = r.ageDays
    cache[String(r.pr)] = c
  })

  for (const r of records) {
    const c = cache[String(r.pr)]
    if (!RECHECK && c && c.probed && r.host && r.verdict !== 'REJECT') {
      r.status = c.status; r.ageDays = c.ageDays
    }
  }

  // ── 输出 ──────────────────────────────────────────────────
  const order = { PASS: 0, MANUAL: 1, REJECT: 2 }
  records.sort((a, b) => order[a.verdict] - order[b.verdict] || b.pr - a.pr)
  const counts = records.reduce((m, r) => (m[r.verdict] = (m[r.verdict] || 0) + 1, m), {})

  await mkdir(resolve(ROOT, 'reports'), { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
  await writeFile(resolve(ROOT, 'reports/submissions-triage.json'), JSON.stringify(records, null, 2))

  const row = (a, b, c, d) => `| ${a} | ${b} | ${c} | ${d} |`
  const md = [
    '# 提交申请自动初审报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `共 ${records.length} 个开放提交 —— 直接通过 **${counts.PASS || 0}** · 需复核 **${counts.MANUAL || 0}** · 自动淘汰 **${counts.REJECT || 0}**`,
    '',
    '> 注意：域名年龄依赖 archive.org。若运行环境无法访问该服务，本轮会标注「存档服务不可达，域名年龄未校验」，该维度不参与判定，需要在网络正常的环境中重跑才生效。',
    '',
    '## 可处理：直接通过 / 需复核',
    '',
    row('PR', '工具', '域名', '判定 · 注意点'),
    row('---', '---', '---', '---'),
    ...(records.filter(r => r.verdict !== 'REJECT').map(r =>
      row(`#${r.pr}`, r.name.slice(0, 28), r.host || '—', `${r.verdict} · ${r.reasons.join('；') || '无异常'}`)) || ['（无）']),
    '',
    '## 自动淘汰',
    '',
    row('PR', '工具', '域名', '拒绝理由'),
    row('---', '---', '---', '---'),
    ...records.filter(r => r.verdict === 'REJECT').map(r =>
      row(`#${r.pr}`, r.name.slice(0, 28), r.host || '—', r.reasons.join('；'))),
    '',
  ].join('\n')
  await writeFile(resolve(ROOT, 'reports/submissions-triage.md'), md)

  console.log('\n=== 初审结果 ===')
  console.log(`直接通过 ${counts.PASS || 0} · 需复核 ${counts.MANUAL || 0} · 自动淘汰 ${counts.REJECT || 0}（共 ${records.length}）`)
  console.log('报告 → reports/submissions-triage.md')
  console.log('数据 → reports/submissions-triage.json')
}

main().catch(e => { console.error('失败：', e.message); process.exit(1) })
