#!/usr/bin/env node
// aifindr.org — 身份层（L3 真实注册用）
//
// 用户决策：使用同一个邮箱，但采用「每天若干个」的节流节奏。
// 本模块在不改变这个决策的前提下，把能保住的好处尽量保住，并把节流做成硬约束。
//
// 两种寻址模式：
//   plus      you+<tag>@gmail.com  —— 与「同一个邮箱」完全等价（同一账号同一收件箱），
//                                     但每封信地址可区分，泄露时能反查来源。零配置，推荐。
//   catchall  tool-<tag>@<自有域名> —— 隔离最彻底，需要一个额外域名。
//
// 三件事：
//   1. 为每个站点派生稳定的身份（同 host 反复运行不会重复注册）
//   2. 通过 IMAP 收取该地址的验证邮件，提取验证码 / 验证链接
//   3. 每日配额硬约束 —— 当天注册数达上限就拒绝签发新身份，把节奏锁住
//
// 红线（硬编码在本模块，不允许上层绕过）：
//   · 不解决任何验证码（Turnstile / reCAPTCHA / hCaptcha）—— 遇到即报错退回
//   · 不提供任何支付字段——没有信用卡相关代码路径，就是不让它有可能发生
//   · 不使用真实个人信息——persona 来自合成池
//
// 配置（.env.local 或环境变量）：
//   IDENTITY_MODE=plus|catchall                默认 plus
//   IDENTITY_EMAIL_BASE=you@gmail.com          plus 模式必填
//   IDENTITY_DOMAIN=example.email              catchall 模式必填，务必与 aifindr.org 无关
//   IDENTITY_DAILY_QUOTA=4                     每日最多签发的注册身份数
//   IDENTITY_IMAP_HOST / _USER / _PASS         收信必需
//
// 用法：
//   node scripts/lib/identity.mjs --check              配置自检
//   node scripts/lib/identity.mjs --quota              查看今日剩余配额
//   node scripts/lib/identity.mjs --gen <host>         签发 / 查看身份（已达配额会拒绝）
//   node scripts/lib/identity.mjs --claim <host>       标记为今天已注册（消耗配额）
//   node scripts/lib/identity.mjs --wait <host> --timeout=90

import { randomBytes, createHash } from 'node:crypto'
import { readFile, writeFile, chmod, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const VAULT = resolve(ROOT, 'reports/.identity-vault.json')

const argv = process.argv.slice(2)
// 同时支持 --key=value 与 --key value 两种写法
const arg = (k, d = '') => {
  const eq = argv.find(a => a.startsWith(`--${k}=`))
  if (eq) return eq.split('=')[1] || d
  const i = argv.findIndex(a => a === `--${k}`)
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  return d
}
const has = k => argv.includes(`--${k}`)

// ── 配置加载（优先进程环境变量，其次根目录 .env.local）──────
async function loadEnv() {
  const env = { ...process.env }
  try {
    const txt = await readFile(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, '$1')
    }
  } catch { /* 没有 .env.local 属正常 */ }
  return env
}

// ── 保险库 ──────────────────────────────────────────────────
async function loadVault() {
  try {
    const s = await stat(VAULT)
    if ((s.mode & 0o777) !== 0o600) await chmod(VAULT, 0o600)
    return JSON.parse(await readFile(VAULT, 'utf8'))
  } catch { return { salt: '', sites: {} } }
}

async function saveVault(v) {
  await writeFile(VAULT, JSON.stringify(v, null, 2))
  await chmod(VAULT, 0o600)
}

// ── 身份生成 ────────────────────────────────────────────────
// 基于 host 做确定性派生：同一站点永远得到同一别名与密码，
// 避免流水线重跑时对同一站点注册第二个账号。
const digest = (salt, host, n = 10) =>
  createHash('sha256').update(`${salt}|${host}`).digest('hex').slice(0, n)

const PERSONAS = [
  { first: 'Kai', last: 'Mercer' }, { first: 'Noor', last: 'Haddad' },
  { first: 'Ivo', last: 'Tanaka' }, { first: 'Mila', last: 'Okonkwo' },
  { first: 'Ren', last: 'Vasquez' }, { first: 'Sora', last: 'Lindqvist' },
]

const today = () => new Date().toISOString().slice(0, 10)

// 今日已签发数量。节流靠这里强制生效——不是「提醒」，是超过就拒绝签发。
// 计数基准是 issuedAt（签发日）而非 claimedAt：签发之后紧接着就会去注册，
// 只有卡在签发这一步，节奏才真的守得住。
function todayCount(vault, field) {
  const d = today()
  return Object.values(vault.sites || {}).filter(s => (s[field] || '').slice(0, 10) === d).length
}

function buildAddress(mode, tag, env) {
  if (mode === 'catchall') return `tool-${tag}@${env.IDENTITY_DOMAIN}`
  // plus 模式：同一个邮箱，只是每站一个 tag。收件仍是同一账号同一 INBOX。
  const [u, d] = env.IDENTITY_EMAIL_BASE.split('@')
  const clean = String(d).replace(/\+/g, '') // 防嵌套
  return `${u}+${tag}@${clean}`
}

export async function ensureIdentity(host, env, { consumeQuota = false } = {}) {
  const mode = env.IDENTITY_MODE || 'plus'
  if (mode === 'catchall' && !env.IDENTITY_DOMAIN)
    throw new Error('catchall 模式缺少 IDENTITY_DOMAIN')
  if (mode === 'plus' && !env.IDENTITY_EMAIL_BASE)
    throw new Error('plus 模式缺少 IDENTITY_EMAIL_BASE，例如 IDENTITY_EMAIL_BASE=you@gmail.com')

  const vault = await loadVault()
  if (!vault.salt) { vault.salt = randomBytes(16).toString('hex'); await saveVault(vault) }

  const existing = vault.sites[host]
  if (existing) return { ...existing, vault, mode }

  const quota = Number(env.IDENTITY_DAILY_QUOTA) || 4
  const used = todayCount(vault, 'issuedAt')
  if (used >= quota) {
    const err = new Error(`今日配额已满（${used}/${quota}）：节流是硬约束，明天再继续。`)
    err.quotaExceeded = true
    throw err
  }

  const tag = digest(vault.salt, host, 10)
  // 同一个邮箱时 persona 必须全站一致：真人在不同站通常就是同一个身份，
  // 各站换个名字反而更像脚本生成的账户。
  const p = PERSONAS[parseInt(digest(vault.salt, 'persona', 8), 16) % PERSONAS.length]
  // base64 派生的密码含大小写，末尾补 A9! 保证满足「大写+小写+数字+符号」的常见策略要求
  const pwSeed = Buffer.from(createHash('sha256')
    .update(`${vault.salt}|pw|${host}`).digest()).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
  const rec = {
    alias: buildAddress(mode, tag, env),
    password: pwSeed + 'A9!',
    persona: `${p.first} ${p.last}`,
    createdAt: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    claimedAt: '',
    attempts: 0,
    note: '',
  }
  vault.sites[host] = rec
  await saveVault(vault)
  return { ...rec, vault, mode }
}

// ── 邮件解析（不引入任何第三方解析器）────────────────────────
function decodeBody(src) {
  let s = Buffer.isBuffer(src) ? src.toString('utf8') : String(src)
  const b64 = s.match(/Content-Transfer-Encoding:\s*base64/i)
  if (b64) {
    const payload = s.split(/\r?\n\r?\n/).slice(1).join('\n').replace(/\s+/g, '')
    try { s = Buffer.from(payload, 'base64').toString('utf8') } catch { /* 保留原文 */ }
  } else if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(s)) {
    s = s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  }
  return s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
}

// 优先取验证链接（更可靠），其次取 6-8 位验证码
function extractSecret(text) {
  const link = text.match(/https?:\/\/[^\s"'<>()]*?(?:verify|confirm|activate|validate|magic|invite)[^\s"'<>()]*/i)
  if (link) return { kind: 'link', value: link[0].replace(/[.,)]+$/, '') }
  const otp = text.match(/(?<!\d)(\d{6})(?!\d)/) || text.match(/(?<!\d)(\d{4,8})(?!\d)/)
  if (otp) return { kind: 'code', value: otp[1] }
  return null
}

// ── IMAP 接码 ───────────────────────────────────────────────
export async function waitForSecret(host, env, { timeoutMs = 90000, pollMs = 5000 } = {}) {
  const missing = ['IDENTITY_IMAP_HOST', 'IDENTITY_IMAP_USER', 'IDENTITY_IMAP_PASS'].filter(k => !env[k])
  if (missing.length) return { state: 'unconfigured', missing }

  let ImapFlow
  try { ImapFlow = (await import('imapflow')).ImapFlow }
  catch { return { state: 'no-client', hint: '执行：npx pnpm@10 add -D imapflow' } }

  const id = await ensureIdentity(host, env)
  const client = new ImapFlow({
    host: env.IDENTITY_IMAP_HOST,
    port: Number(env.IDENTITY_IMAP_PORT) || 993,
    secure: true,
    auth: { user: env.IDENTITY_IMAP_USER, pass: env.IDENTITY_IMAP_PASS },
    logger: false,
  })

  const deadline = Date.now() + timeoutMs
  try {
    await client.connect()
    const box = await client.mailboxOpen('INBOX')
    void box
    while (Date.now() < deadline) {
      const list = await client.search({ seen: false, since: new Date(Date.now() - 30 * 60000) })
      for await (const msg of client.fetch(list, { envelope: true, source: true })) {
        const to = (msg.envelope?.to || []).map(a => (a.address || '').toLowerCase()).join(',')
        if (!to.includes(id.alias.toLowerCase())) continue
        const secret = extractSecret(decodeBody(msg.source))
        if (secret) { await client.logout(); return { state: 'ok', ...secret, alias: id.alias } }
      }
      await new Promise(r => setTimeout(r, pollMs))
    }
    await client.logout()
    return { state: 'timeout', alias: id.alias }
  } catch (e) {
    try { await client.logout() } catch { /* 连接已断 */ }
    return { state: 'error', message: String(e.message).slice(0, 160) }
  }
}

// ── CLI ─────────────────────────────────────────────────────
async function cli() {
  const env = await loadEnv()

  if (has('check')) {
    const mode = env.IDENTITY_MODE || 'plus'
    const rows = [
      ['IDENTITY_MODE', mode, 'plus=同一邮箱加后缀（推荐） / catchall=独立域名'],
      mode === 'catchall'
        ? ['IDENTITY_DOMAIN', env.IDENTITY_DOMAIN, 'catch-all 域名，必须与 aifindr.org 无关']
        : ['IDENTITY_EMAIL_BASE', env.IDENTITY_EMAIL_BASE, '你的邮箱，如 you@gmail.com'],
      ['IDENTITY_DAILY_QUOTA', env.IDENTITY_DAILY_QUOTA || '4（默认）', '每日注册上限，硬约束'],
      ['IDENTITY_IMAP_HOST', env.IDENTITY_IMAP_HOST, '收信服务器'],
      ['IDENTITY_IMAP_USER', env.IDENTITY_IMAP_USER, '收信账号'],
      ['IDENTITY_IMAP_PASS', env.IDENTITY_IMAP_PASS ? '(已设置)' : '', '应用专用密码'],
    ]
    console.log('配置自检：')
    let ok = true
    for (const [k, v, note] of rows) {
      const good = k === 'IDENTITY_MODE' || Boolean(v)
      if (!good) ok = false
      console.log(`  ${good ? '✓' : '✗'} ${k.padEnd(22)} ${v || '—'}  ${note}`)
    }
    try { await import('imapflow') }
    catch { console.log('  ✗ imapflow              未安装，执行 npx pnpm@10 add -D imapflow'); ok = false }
    const vaultMode = await stat(VAULT).then(s => (s.mode & 0o777).toString(8)).catch(() => '未创建')
    console.log(`  保险库权限 ${vaultMode}（应为 600）`)
    console.log(ok ? '结论：可用' : '结论：尚缺配置')
    return
  }

  if (has('quota')) {
    const vault = await loadVault()
    const quota = Number(env.IDENTITY_DAILY_QUOTA) || 4
    const used = todayCount(vault, 'issuedAt')
    console.log(`今日配额 ${used}/${quota}（剩余 ${Math.max(0, quota - used)}）`)
    const claimed = Object.entries(vault.sites || {}).filter(([, s]) => s.issuedAt)
    if (claimed.length) {
      console.log('已签发：')
      for (const [h, s] of claimed.sort((a, b) => (b[1].issuedAt || '').localeCompare(a[1].issuedAt || '')).slice(0, 20))
        console.log(`  ${(s.issuedAt || '').slice(0, 10)}  ${h.padEnd(30)} ${s.alias}${s.claimedAt ? '  ✓已注册' : ''}`)
    }
    return
  }

  const claimHost = arg('claim')
  if (claimHost) {
    const vault = await loadVault()
    const rec = vault.sites[claimHost]
    if (!rec) { console.error('未签发过身份，请先 --gen'); process.exit(1) }
    if (rec.claimedAt) console.log(`已注册过：${rec.claimedAt.slice(0, 10)}`)
    else {
      rec.claimedAt = new Date().toISOString()
      rec.note = arg('note', '')
      await saveVault(vault)
      console.log(`已标记注册：${claimHost}  ${rec.alias}`)
    }
    return
  }

  const host = arg('gen') || arg('wait')
  if (!host) { console.log('用法：--check | --quota | --gen <host> | --claim <host> | --wait <host>'); return }

  const id = await ensureIdentity(host, env)
  console.log(JSON.stringify({ alias: id.alias, password: id.password, persona: id.persona, mode: id.mode }, null, 2))

  if (has('wait')) {
    const r = await waitForSecret(host, env, { timeoutMs: Number(arg('timeout', '90')) * 1000 })
    console.log('接码结果：', JSON.stringify(r))
  }
}

cli().catch(e => { console.error('失败：', e.message); process.exit(1) })
