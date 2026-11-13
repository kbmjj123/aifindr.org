#!/usr/bin/env node
// aifindr.org — L2 零 LLM 取证器
//
// 位置：整条验证流水线的第二层。输入是 L1 的初筛结果，输出是每个站点的客观事实 +
// 基于事实的机器判定。全程不调用任何 LLM / 付费 API。
//
// 核心逻辑：「这些站点都活着，问题是它们有没有价值」。
// 所以本层不问「能不能打开」，只问三件事：
//   1. 它是不是一个临时套壳空站（正文极少、无私法务页、无定价页）
//   2. 它到底有没有真的调用 AI 能力（静态引用供应商 API 域名）
//   3. 有没有成规模的痕迹（GA ID 重复 = 同一运营者在批量铺站）
//
// 用法：
//   node scripts/probe-evidence.mjs                 # 跑全量（默认取 L1 未淘汰的）
//   node scripts/probe-evidence.mjs --limit=10      # 只跑前 10 个
//   node scripts/probe-evidence.mjs --host=xxx.com  # 只跑指定域名
//   node scripts/probe-evidence.mjs --recheck       # 忽略缓存重新联网
//
// 产出：
//   reports/evidence-probe.json   机器可读，L3 消费的输入
//   reports/evidence-probe.md     人读版，带逐条事实与判定理由

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TRIAGE_FILE = resolve(ROOT, 'reports/submissions-triage.json')
const CACHE_FILE = resolve(ROOT, 'reports/.evidence-cache.json')

const argv = process.argv.slice(2)
const LIMIT = Number((argv.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0
const ONLY_HOST = (argv.find(a => a.startsWith('--host=')) || '').split('=')[1] || ''
const RECHECK = argv.includes('--recheck')

// ── 规则配置 ────────────────────────────────────────────────
// 重要：此维度经实测命中率极低（前 8 个站点 0/8），原因是绝大多数站点在服务端调用模型，
// 前端 HTML/bundle 里只出现自己的 /api 路径。因此它降级为纯记录，不参与判定。
// 真正的行为证据只能由 L3 拿真实产物来证明。
const AI_PROVIDERS = [
  'api.openai.com', 'api.anthropic.com', 'api.replicate.com', 'replicate.com/v1',
  'api.stability.ai', 'api.together.xyz', 'api.groq.com', 'api.mistral.ai',
  'api.deepseek.com', 'generativelanguage.googleapis.com', 'aiplatform.googleapis.com',
  'fal.run', 'queue.fal.run', 'api.bfl.ml', 'api.fireworks.ai',
  'api.elevenlabs.io', 'api.deepgram.com', 'api.play.ht', 'api.assemblyai.com',
  'api.remove.bg', 'clipdrop.co', 'api.ideogram.ai', 'api.luma.ai',
  'api.runwayml.com', 'api.pika.art', 'api.heygen.com', 'api.suno.ai',
  'huggingface.co/inference', 'api-inference.huggingface.co', 'api.cohere.ai',
  'api.perplexity.ai', 'api.recraft.ai', 'api.segmind.com', 'api.getimg.ai',
]

// ToS 里的自动化禁令。注意：绝不能单独匹配 "bot" —— 这批全是 AI 工具站，
// 它们的条款里几乎必然出现 "chatbot"，一匹配就全军覆没。
// 注意：这些词必须带禁令语境。绝不能单独匹配 crawler / spider / bot ——
// 实战教训：mydentify.com 是一款「AI Crawler Access Checker」工具，
// 页脚徽章里写着自己的产品名，裸词匹配会把它当成禁止访问的站点淘汰掉。
const TOS_BAN = [
  /no\s+(?:automated|robotic|robot|spider|crawler|scraper|bots?)\b/i,
  /prohibit(?:ed|s)?\s+(?:the\s+)?use\s+of\s+(?:any\s+)?(?:automated|robotic|robot|spider|crawler|scraper)/i,
  /you\s+(?:may|shall|must|will)\s+not\s+(?:use|access|employ)[^.]{0,80}?(?:robot|spider|crawler|scraper|automated)/i,
  /(?:robot|spider|crawler|scraper)[^.]{0,40}?(?:are|is)\s+(?:strictly\s+)?prohibited/i,
  /use\s+of\s+(?:automated|robotic)\s+(?:systems|means|tools|scripts|processes)/i,
  /web\s+scraping|data\s+mining|data\s+extraction|extract\s+(?:data|content)\s+(?:from|using)/i,
  /automated\s+(?:access|means|process|system|collection|retrieval|tool|queries)/i,
  /without\s+(?:our\s+)?prior\s+written\s+(?:permission|consent)/i,
]

const PAGE_SIGNALS = {
  pricing: /pricing|plans|subscription|\/upgrade|\/billing/i,
  terms: /terms|tos\b|\/legal|agreement/i,
  privacy: /privacy|gdpr|data-policy/i,
  contact: /contact|support|help@|mailto:/i,
  login: /login|sign-in|signin|\/auth/i,
  signup: /signup|sign-up|register|get-started/i,
  docs: /docs|documentation|api-docs/i,
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const TIMEOUT_MS = 12000
const CONCURRENCY = 6
const MIN_WORDS = 250        // 低于此视为空壳落地页

// ── 基础函数 ────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchDoc(url, timeout = TIMEOUT_MS) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  const r = { ok: false, status: 0, text: '', error: '', finalUrl: '' }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: ctl.signal,
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*',
          'Accept-Language': 'en-US,en;q=0.9' } })
      r.status = res.status
      r.finalUrl = res.url ? new URL(res.url).origin : ''
      if (res.ok) { r.text = await res.text(); r.ok = true; r.error = ''; return r }
      // 4xx/5xx 明确失败，无需重试
      r.error = `HTTP ${res.status}`
      return r
    } catch (e) {
      r.error = e.name === 'AbortError' ? 'timeout' : String(e.message).slice(0, 60)
      if (attempt < 3) await sleep(1500 * attempt)
    } finally { clearTimeout(timer) }
  }
  return r
}

function visibleWords(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
  return body.split(/\s+/).filter(w => w.length > 1).length
}

// 只看正文。导航栏、页脚、徽章不属于条款内容——把整页当纯文本扫会连产品名都算进去，
// mydentify.com 就是这样被误杀的。
function mainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

function pickMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)`, 'i')
  return ((html.match(re) || [])[1] || '').trim()
}

function collectLinks(html) {
  const out = new Set()
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)(?:#[^"']*)?["']/gi)) {
    let v = m[1].trim()
    if (v.startsWith('javascript:') || v.startsWith('data:') || v.startsWith('tel:')) continue
    if (v.startsWith('mailto:')) { out.add('mailto:'); continue }
    if (v.startsWith('/') || v.startsWith('?')) { out.add(v); continue }
    try {
      const u = new URL(v)
      if (u.hostname) out.add(u.hostname + u.pathname)
    } catch { /* 相对路径已处理 */ }
  }
  return out
}

function analyticsIds(html) {
  const ids = new Set()
  for (const m of html.matchAll(/\b(G-[A-Z0-9]{6,12}|UA-\d{4,10}-\d{1,4}|GTM-[A-Z0-9]{4,10}|AW-\d{6,12})\b/g)) ids.add(m[1])
  for (const m of html.matchAll(/(?:gtag|gtm|measurementId)[^\n]{0,40}["'](G-[A-Z0-9]+|GTM-[A-Z0-9]+)["']/g)) ids.add(m[1])
  // Facebook Pixel / Plausible / Mixpanel 也一并记录，批站常共用
  for (const m of html.matchAll(/\b(\d{15,16})\s*[,)]/g)) ids.add('fb:' + m[1])
  return [...ids]
}

function aiProviderHits(html) {
  return AI_PROVIDERS.filter(p => html.toLowerCase().includes(p.toLowerCase()))
}

// robots.txt 的违ublockDirective 判断：只在 User-agent: * 这一段里生效，
// 且只要同段存在任何 Allow 就是不完整的禁止，不能当作全域 Disallow。
function parseDisallowAll(txt) {
  const lines = txt.split(/\r?\n/).map(l => l.replace(/#.*$/, '').trim()).filter(Boolean)
  let inWildcard = false, seen = false, hasAllow = false, disallowRoot = false
  for (const l of lines) {
    if (/^user-agent\s*:/i.test(l)) {
      const isWild = /^user-agent\s*:\s*\*\s*$/i.test(l)
      if (isWild) { inWildcard = true; seen = true } else inWildcard = false
      continue
    }
    if (!inWildcard) continue
    if (/^disallow\s*:\s*\/\s*$/i.test(l)) disallowRoot = true
    else if (/^allow\s*:\s*/i.test(l)) hasAllow = true
  }
  return seen && disallowRoot && !hasAllow
}

function detectPlatform(host) {
  if (host.endsWith('.github.io')) return 'github.io'
  if (host.endsWith('.gitlab.io')) return 'gitlab.io'
  if (/\.(vercel\.app|pages\.dev|netlify\.app|fly\.dev|web\.app)$/.test(host)) return 'paas'
  return ''
}

const daysSince = iso => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 9999

// GitHub Pages 站点可以直接追溯到仓库——stars / 最近提交 / 许可证都是无法粉饰的客观事实
async function githubRepoMeta(site) {
  let u
  try { u = new URL(site) } catch { return { state: 'error' } }
  const owner = u.hostname.replace(/\.github\.io$/, '')
  const seg = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  const repo = seg ? `${owner}/${seg}` : `${owner}/${u.hostname}`
  try {
    const headers = { 'User-Agent': 'aifindr-evidence', 'Accept': 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(10000) })
    if (res.status === 403 || res.status === 429) return { state: 'rate_limited', repo }
    if (!res.ok) return { state: 'missing', repo }
    const j = await res.json()
    return { state: 'ok', repo, full_name: j.full_name, stars: j.stargazers_count,
      pushed: j.pushed_at, created: j.created_at, license: (j.license || {}).spdx_id || '',
      language: j.language, archived: j.archived }
  } catch { return { state: 'error', repo } }
}

// ── 单站点取证 ──────────────────────────────────────────────
async function probe(target) {
  const site = target.site
  const origin = new URL(site).origin
  const facts = { finalOrigin: '', httpStatus: 0, words: 0, title: '', ogTitle: '', ogDesc: '',
    aiProviders: [], analytics: [], pages: {}, robots: { state: 'missing', disallowAll: false },
    tos: { state: 'notfound', banned: false, hit: '' }, linkCount: 0 }
  const reasons = []
  let verdict = 'PASS'
  const hard = r => { reasons.push(r); verdict = 'REJECT' }
  const soft = r => { reasons.push(r); if (verdict === 'PASS') verdict = 'MANUAL' }

  const home = await fetchDoc(site)
  facts.httpStatus = home.status
  if (!home.ok) {
    // 只有明确的 4xx 才算失效。403/429 多为 WAF 与限流，timeout 多为网络抖动——
    // 这两条都不能自动淘汰，否则又是 L1 踩过的坑（hol.org 用真实浏览器 UA 也返回 403）。
    if ([403, 429, 503].includes(home.status))
      return { verdict: 'MANUAL', reasons: [`首页返回 HTTP ${home.status}，疑似 WAF / 限流而非失效`], facts }
    if (home.status >= 400)
      return { verdict: 'REJECT', reasons: [`首页返回 HTTP ${home.status}`], facts }
    return { verdict: 'MANUAL', reasons: [`首页不可达（${home.error}），需在网络正常的环境复核`], facts }
  }

  facts.finalOrigin = home.finalUrl
  if (facts.finalOrigin && new URL(facts.finalOrigin).hostname.replace(/^www\./, '') !== new URL(site).hostname.replace(/^www\./, '')) {
    hard(`域名漂移至 ${facts.finalOrigin}`)
  }

  const html = home.text
  facts.title = ((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').trim().slice(0, 120)
  facts.ogTitle = pickMeta(html, 'og:title').slice(0, 120)
  facts.ogDesc = pickMeta(html, 'og:description').slice(0, 200)
  facts.words = visibleWords(html)
  facts.analytics = analyticsIds(html)
  facts.aiProviders = aiProviderHits(html)

  const links = collectLinks(html)
  facts.linkCount = links.size
  const all = [...links].join(' ')
  for (const [k, re] of Object.entries(PAGE_SIGNALS)) facts.pages[k] = re.test(all)

  if (facts.words < MIN_WORDS) hard(`正文仅 ${facts.words} 词，疑似空壳落地页`)
  const legalCount = ['terms', 'privacy', 'contact'].filter(k => facts.pages[k]).length
  const platform = detectPlatform(new URL(site).hostname)
  if (legalCount === 0) {
    // 开发者托管平台上的开源 / 个人项目没有法务页属正常，不该被硬规则一刀切
    if (platform) soft(`托管于 ${platform}，无法务页属常见情况，改看仓库质量`)
    else hard('无私法务页（terms / privacy / contact 全缺），典型临时站特征')
  } else if (legalCount === 1) soft('仅 1 个法务页面，资质偏薄')
  // 免费工具本来就没有定价页，把「无定价页」一律降级会把整批免费工具推去人工复核。
  // 只对声称 freemium / paid 的站点要求定价信息——声称收费却找不到价格才是问题。
  if (target.pricing !== 'free' && !facts.pages.pricing) soft('声称收费但未发现定价页')

  if (facts.linkCount < 8) soft(`全站仅 ${facts.linkCount} 个链接，疑似单页落地页`)

  // robots.txt 必须按 User-agent 块解析。
  // 教训：用跨行正则会让「一堆 Allow + 末尾一条 Disallow」的正规站被误判为全域禁止
  // （influence.so 有 147 个链接依然被误杀），因此改成块内精确判断。
  const rob = await fetchDoc(`${origin}/robots.txt`, 8000)
  if (rob.ok && rob.text.trim()) {
    facts.robots.state = 'ok'
    facts.robots.disallowAll = parseDisallowAll(rob.text)
    if (facts.robots.disallowAll) hard('robots.txt 全域 Disallow')
  } else if (!rob.ok) {
    facts.robots.state = 'missing'
  }

  // 开发者托管平台：绕过自述，直接问平台 API 拿无法粉饰的客观数据
  facts.platform = platform
  if (platform === 'github.io') {
    const repo = await githubRepoMeta(site)
    facts.repo = repo
    if (repo.state === 'ok') {
      const idle = daysSince(repo.pushed)
      reasons.push(`GitHub 仓库 ${repo.full_name}：${repo.stars} 星 · 最近提交 ${repo.pushed?.slice(0, 10)} · ${repo.license || '无许可证'}`)
      if (repo.stars === 0 && idle < 21) soft(`${repo.stars} 星且 ${idle} 天前才推送，多为自娱 demo`)
    } else if (repo.state === 'rate_limited') {
      soft('GitHub API 限流，仓库数据未取到')
    }
  }

  // ToS 闸门：既避开明确禁止自动访问的站点，也顺带淘汰一批
  if (verdict !== 'REJECT') {
    const candidates = [...links].filter(l => PAGE_SIGNALS.terms.test(l) || PAGE_SIGNALS.privacy.test(l))
    let tosUrl = ''
    for (const c of candidates) {
      if (/^https?:\/\//i.test(c)) { tosUrl = c; break }
      if (c.startsWith('/')) { tosUrl = origin + c; break }
    }
    if (tosUrl) {
      const t = await fetchDoc(tosUrl, 10000)
      facts.tos.url = tosUrl
      if (t.ok && mainText(t.text).length > 400) {
        facts.tos.state = 'ok'
        const body = mainText(t.text)
        const hit = TOS_BAN.find(re => re.test(body))
        if (hit) {
          facts.tos.banned = true
          facts.tos.hit = String(hit).slice(0, 60)
          facts.tos.context = (body.match(new RegExp(`.{0,50}${String(hit).slice(1, -4)}.{0,50}`, 'i')) || [''])[0]
          hard(`ToS 限制自动化访问（命中 /${String(hit).slice(1, 34)}/）`)
        }
      } else if (!t.ok) {
        facts.tos.state = 'error'
        soft('法务页打不开，未能完成自动化条款检查')
      }
    }
  }

  return { verdict, reasons, facts }
}

// ── 交叉分析：同一运营者痕迹 ────────────────────────────────
function crossCheck(records) {
  const gaMap = new Map()
  for (const r of records) {
    if (r.verdict === 'REJECT') continue
    for (const id of r.facts?.analytics || []) {
      if (id.startsWith('fb:')) continue
      gaMap.set(id, [...(gaMap.get(id) || []), r.host])
    }
  }
  for (const [id, hosts] of gaMap) {
    const uniq = [...new Set(hosts)]
    if (uniq.length < 2) continue
    for (const h of uniq) {
      const r = records.find(x => x.host === h)
      if (!r || r.verdict === 'REJECT') continue
      r.reasons.push(`与 ${uniq.filter(x => x !== h).join(' / ')} 共用统计 ID ${id}，疑似同一运营者批量铺站`)
      r.verdict = 'REJECT'
    }
  }

  // 描述文案完全一致 -> 模板复制站
  const descMap = new Map()
  for (const r of records) {
    const d = r.facts?.ogDesc?.slice(0, 80)
    if (!d || d.length < 30) continue
    descMap.set(d, [...(descMap.get(d) || []), r.host])
  }
  for (const [, hosts] of descMap) {
    const uniq = [...new Set(hosts)]
    if (uniq.length < 2) continue
    for (const h of uniq) {
      const r = records.find(x => x.host === h)
      if (!r || r.verdict === 'REJECT') continue
      r.reasons.push(`与 ${uniq.filter(x => x !== h).join(' / ')} 使用完全相同的 og:description`)
      r.verdict = 'REJECT'
    }
  }
}

// ── 主流程 ──────────────────────────────────────────────────
async function main() {
  let triage
  try { triage = JSON.parse(await readFile(TRIAGE_FILE, 'utf8')) }
  catch { console.error('找不到 reports/submissions-triage.json，请先运行 L1：pnpm audit'); process.exit(1) }

  let targets = triage.filter(r => r.verdict !== 'REJECT' && r.site)
  if (ONLY_HOST) targets = targets.filter(r => r.host === ONLY_HOST || r.host.includes(ONLY_HOST))
  if (LIMIT) targets = targets.slice(0, LIMIT)

  const cache = await (async () => { try { return JSON.parse(await readFile(CACHE_FILE, 'utf8')) } catch { return {} } })()
  console.log(`→ L2 取证：${targets.length} 个站点（来自 L1 未淘汰队列）`)

  const records = []
  let done = 0
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY)
    const out = await Promise.all(batch.map(async t => {
      const key = t.host
      if (!RECHECK && cache[key]) return cache[key]
      const { verdict, reasons, facts } = await probe(t)
      const rec = { pr: t.pr, author: t.author, name: t.name, host: t.host, site: t.site,
        pricing: t.pricing, category: t.category, verdict, reasons, facts }
      cache[key] = rec
      return rec
    }))
    records.push(...out)
    done += batch.length
    process.stdout.write(`  ${done}/${targets.length}\r`)
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
  }
  console.log('')

  crossCheck(records)

  const order = { PASS: 0, MANUAL: 1, REJECT: 2 }
  records.sort((a, b) => order[a.verdict] - order[b.verdict] || b.pr - a.pr)
  const counts = records.reduce((m, r) => (m[r.verdict] = (m[r.verdict] || 0) + 1, m), {})

  await mkdir(resolve(ROOT, 'reports'), { recursive: true })
  await writeFile(resolve(ROOT, 'reports/evidence-probe.json'), JSON.stringify(records, null, 2))

  const fact = r => {
    const f = r.facts || {}
    return `${f.words || 0}词 · AI:${(f.aiProviders || []).length ? '✓' : '—'} · ` +
      `法务:${['terms', 'privacy', 'contact'].filter(k => f.pages?.[k]).length}/3 · ` +
      `定价:${f.pages?.pricing ? '✓' : '—'}`
  }
  const md = [
    '# L2 取证报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `共 ${records.length} 个站点 —— 进入 L3 实操 **${counts.PASS || 0}** · 需复核 **${counts.MANUAL || 0}** · L2 淘汰 **${counts.REJECT || 0}**`,
    '',
    '> 说明：AI 供应商引用是静态检测的，SPA 站点可能漏检；真正的调用证据由 L3 抓网络请求确认。未检出仅标记复核，不直接淘汰。',
    '',
    '## 进入 L3 浏览器实操',
    '',
    '| PR | 域名 | 分类 | 事实 |',
    '| --- | --- | --- | --- |',
    ...records.filter(r => r.verdict === 'PASS').map(r =>
      `| #${r.pr} | ${r.host} | ${r.category} | ${fact(r)} |`),
    '',
    '## 需人工复核',
    '',
    '| PR | 域名 | 注意点 |',
    '| --- | --- | --- |',
    ...records.filter(r => r.verdict === 'MANUAL').map(r =>
      `| #${r.pr} | ${r.host} | ${r.reasons.join('；').slice(0, 110)} |`),
    '',
    '## L2 淘汰',
    '',
    '| PR | 域名 | 理由 |',
    '| --- | --- | --- |',
    ...records.filter(r => r.verdict === 'REJECT').map(r =>
      `| #${r.pr} | ${r.host} | ${r.reasons.join('；').slice(0, 110)} |`),
    '',
  ].join('\n')
  await writeFile(resolve(ROOT, 'reports/evidence-probe.md'), md)

  console.log('=== L2 结果 ===')
  console.log(`进入 L3 ${counts.PASS || 0} · 复核 ${counts.MANUAL || 0} · 淘汰 ${counts.REJECT || 0}（共 ${records.length}）`)
  console.log('报告 → reports/evidence-probe.md')
  console.log('数据 → reports/evidence-probe.json')
}

main().catch(e => { console.error('失败：', e.message); process.exit(1) })
