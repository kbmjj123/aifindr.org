#!/usr/bin/env node
// aifindr.org — L3 浏览器实操取证器
//
// 定位：打开真实浏览器、真的操作一遍、把观察到的东西记下来。
// 它是「取证器」不是「通过器」——拿不到证据就必须如实写拿不到，绝不补写。
//
// 设计原则（这几条是整套东西诚实与否的分水岭）：
//   1. 只对「实际观测到的事实」落盘：产物来了就是来了，没来就不能写
//   2. 遇付费字段 / 验证码 / 手机实名立即停，不重试第三次，不绕
//   3. 输入一律本地合成素材，不上传任何私人文件
//   4. 每个站点串行访问，单站点有硬时间预算，防止失控
//
// 用法：
//   node scripts/try-tool.mjs                     跑免注册批次（默认）
//   node scripts/try-tool.mjs --limit=3           只跑前 3 个，先验证有没有用
//   node scripts/try-tool.mjs --only=vocalseparator.com
//   node scripts/try-tool.mjs --pr=76 --timeout=90

import { chromium } from 'playwright'
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ensureFixture, PROMPTS } from './lib/fixtures.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EVIDENCE_DIR = resolve(ROOT, 'reports/evidence')
const PROBE = resolve(ROOT, 'reports/evidence-probe.json')

const argv = process.argv.slice(2)
const arg = (k, d = '') => {
  const eq = argv.find(a => a.startsWith(`--${k}=`))
  if (eq) return eq.split('=')[1] || d
  const i = argv.findIndex(a => a === `--${k}`)
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  return d
}
const has = k => argv.includes(`--${k}`)

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BUDGET_MS = Number(arg('timeout', '120')) * 1000
const LIMIT = Number(arg('limit', '0')) || 0
const VERBOSE = has('verbose')

// ── 供应商识别：静态 HTML 里查不到，真实调用一定在网络层留下痕迹 ──
const PROVIDERS = [
  [/(^|\.)api\.openai\.com$/, 'openai'],
  [/(^|\.)openai\.com$/, 'openai'],
  [/(^|\.)anthropic\.com$/, 'anthropic'],
  [/(^|\.)claude\.ai$/, 'anthropic'],
  [/(^|\.)replicate\.com$/, 'replicate'],
  // replicate.delivery 是它的产物 CDN。命中这个比命中官网域名强得多——
  // 它意味着「产物确实是从 Replicate 的模型里出来的」，vocalseparator 就是靠这个露的底
  [/(^|\.)replicate\.delivery$/, 'replicate'],
  [/(^|\.)fal\.ai$/, 'fal.ai'],
  [/(^|\.)flask\.ai$/, 'fal.ai'],
  [/(^|\.)together\.xyz$/, 'together'],
  [/(^|\.)stability\.ai$/, 'stability'],
  [/(^|\.)generativelanguage\.googleapis\.com$/, 'gemini'],
  [/(^|\.)aimlapi\.com$/, 'aimlapi'],
  [/(^|\.)runwayml\.com$/, 'runway'],
  [/(^|\.)elevenlabs\.io$/, 'elevenlabs'],
  [/(^|\.)deepgram\.com$/, 'deepgram'],
  [/(^|\.)assemblyai\.com$/, 'assemblyai'],
  [/(^|\.)remove\.bg$/, 'remove.bg'],
  [/(^|\.)huggingface\.co$/, 'huggingface'],
  [/(^|\.)cohere\.ai$/, 'cohere'],
  [/(^|\.)groq\.com$/, 'groq'],
  [/(^|\.)fireworks\.ai$/, 'fireworks'],
  [/(^|\.)mistral\.ai$/, 'mistral'],
  [/(^|\.)bfl\.ml$/, 'black-forest-labs'],
  [/(^|\.)klingai\.com$/, 'kling'],
  [/(^|\.)hedra\.com$/, 'hedra'],
  [/(^|\.)luma\.ai$/, 'luma'],
  [/(^|\.)suno\.com$/, 'suno'],
  [/(^|\.)sambanova\.ai$/, 'sambanova'],
  [/(^|\.)cloudflare\.com$/, 'cloudflare-workers-ai'],
]

// 产物类型：network 层看到这些，基本可以认定真的跑出了东西
const ARTIFACT_TYPES = [/^image\/(png|jpeg|webp|gif|avif)/, /^audio\//, /^video\//, /^application\/zip/, /^application\/octet-stream/]

const ACTION_WORDS = [
  'generate', 'create', 'convert', 'remove', 'upscale', 'enhance', 'start',
  'run', 'submit', 'split', 'separate', 'describe', 'translate', 'process',
  'transform', 'upload', 'let’s go', 'lets go', 'try it', 'try now',
]

const NEGATIVE_WORDS = [
  'login', 'log in', 'sign in', 'sign up', 'signup', 'register', 'create account',
  'pricing', 'buy', 'subscribe', 'book a demo', 'contact sales', 'cookie', 'accept all',
  // cookie 同意条：这些按钮赢了就会点错东西，第一次试跑就在 vocalseparator 上踩了
  'decline', 'deny', 'reject', 'allow analytics', 'allow all', 'reject all', 'manage',
  'necessary only', 'preferences', 'consent',
  // 这些是「操作区里的控制项」不是主 CTA：点了等于清空刚上传的素材
  'clear', 'reset', 'cancel', 'close', 'undo', 'remove file', 'remove source',
  'delete', 'example', 'random', 'shuffle', 'previous', 'next', 'back',
  'tempo', 'pitch', 'loop', 'export',   // 播放器/编辑器里的次级控件
]

// 结果容器必须「看起来真的像结果框」。
// 第一版含 main / article，结果把整页营销文案当成「生成产物」写进了报告——污染了 PARTIAL 判定。
const RESULT_SEL = '[class*=result i], [class*=output i], [class*=generated i], [class*=response i], [class*=answer i], [class*=preview i], [id*=result i], [id*=output i]'
// 超过这个长度说明是整个区块而不是结果框
const RESULT_MAX_CHARS = 6000

// 执行失败信号：页面上出现这些就算一次真实的失败观测，属于有效证据
const FAILURE_TEXT = [
  'something went wrong', 'generation failed', 'failed to generate', 'invalid file',
  'unsupported file', 'file too large', 'request failed', 'server error',
  'try again later', 'processing failed', 'error occurred',
]

const PAYWALL_TEXT = [
  'upgrade to continue', 'credits exhausted', 'no credits left', 'out of credits',
  'purchase credits', 'add payment', 'payment method', 'card details',
  'exceeded your', 'quota exceeded', 'subscribe to continue', 'plan limit',
]

const CAPTCHA_TEXT = [
  'i’m not a robot', "i'm not a robot", 'verify you are human', 'complete the security check',
  'please complete the captcha', 'press and hold',
]

// ── 工具函数 ────────────────────────────────────────────────
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const fmtBytes = n => n < 1024 ? `${n}B` : n < 1048576 ? `${(n / 1024).toFixed(1)}KB` : `${(n / 1048576).toFixed(2)}MB`
const say = (...a) => VERBOSE && console.log('   ·', ...a)

/**
 * 在页面里找出所有可交互元素并打分。
 * 返回带 index 的列表，之后用同一个选择器按 index 定位，保证顺序稳定。
 */
async function inspect(page) {
  return page.evaluate(() => {
    const vis = el => {
      if (!el) return false
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.opacity !== '0'
    }
    const text = el => ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || el.value || '')).replace(/\s+/g, ' ').trim().slice(0, 80)
    // 位置与「是否在页头页脚导航栏」——主 CTA 几乎不可能在 nav/footer 里，
    // 少了这一维就会把「清空」「登录」这类按钮和真正的生成按钮打平。
    const box = el => {
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + window.scrollY + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) }
    }
    // 只认语义标签。第一版加了 [class*=header] / [class*=footer] 这类模糊匹配，
    // 结果命中了某个包裹整页的容器，导致全站按钮都被扣 12 分、打分信号被抹平
    //（imagedescriber.dev 的「Start Analysis」就是这样被判到 6 分的）。
    // 另外刻意不含 <header>——它常被用来包 hero 区，而那里恰恰是主 CTA 所在。
    const inChrome = el => !!el.closest('nav, footer, [role=navigation], [role=contentinfo]')

    const scope = document.body
    const base = (el, index) => ({
      index, visible: vis(el), text: text(el), box: vis(el) ? box(el) : null,
      tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || '',
      accept: el.getAttribute('accept') || '',
      placeholder: (el.getAttribute('placeholder') || '').slice(0, 80),
      name: (el.getAttribute('name') || '').slice(0, 40),
      autocomplete: el.getAttribute('autocomplete') || '',
      disabled: !!el.disabled,
    })
    const snap = sel => [...scope.querySelectorAll(sel)].map(base)
    const snapBtn = sel => [...scope.querySelectorAll(sel)].map((el, i) => ({ ...base(el, i), inChrome: inChrome(el) }))

    return {
      fileInputs: snap('input[type=file]'),
      textInputs: snap('input[type=text], input[type=search], input:not([type])'),
      textareas: snap('textarea'),
      editables: [...scope.querySelectorAll('[contenteditable=true]')].map((el, index) => ({
        index, visible: vis(el), text: text(el), box: vis(el) ? box(el) : null,
        placeholder: el.getAttribute('data-placeholder') || '',
      })),
      buttons: snapBtn('button, input[type=submit], [role=button], a.btn, a[class*=btn]'),
      dropzones: [...scope.querySelectorAll('[class*=drop], [class*=upload], [data-dropzone], label[for*=file], label[class*=upload]')]
        .map((el, index) => ({ index, visible: vis(el), text: text(el), box: vis(el) ? box(el) : null })),
    }
  })
}

async function detectCaptcha(page) {
  return page.evaluate(() => {
    const hits = []
    if (document.querySelector('iframe[src*="recaptcha"], iframe[src*="turnstile"], iframe[src*="hcaptcha"], .cf-turnstile, .g-recaptcha, .h-captcha, [data-sitekey]')) hits.push('dom')
    const t = (document.body.innerText || '').toLowerCase()
    if (/not a robot|verify you are human|security check/i.test(t)) hits.push('text')
    return hits
  })
}

/** 页面里是否已经出现明确的付费要求。出现即停止，不继续任何操作 */
/**
 * 勾选前置确认项。
 * 很多工具的主按钮要等「我拥有这段素材 / 我同意处理条款」这类勾打上才从 disabled 变可用——
 * vocalseparator.com 的「Remove vocals」就是这样，不处理它整个站会被判成「找不到主按钮」。
 * 刻意跳过营销类勾选（订阅邮件等），不做与测试无关的动作。
 */
/**
 * 按输入框自己的语义猜一个合理的合成值。
 * 邮箱和手机号一律返回空——填那两个就是在注册，属于红线。
 */
function guessValue(slot) {
  const hint = `${slot.placeholder} ${slot.name} ${slot.type} ${slot.autocomplete}`.toLowerCase()
  if (/e-?mail/.test(hint)) return ''
  if (/phone|mobile|tel/.test(hint)) return ''
  // hint 已转小写，这里的字面量必须带 i 标志，否则 YYYY-MM-DD / HH:mm 永远配不上
  if (/date|birthday|\bdob\b|yyyy-mm-dd/i.test(hint)) return '1990-05-14'
  if (/\btime\b|hh:mm/.test(hint)) return '08:30'
  if (/year/.test(hint)) return '1990'
  if (/city|location|place/.test(hint)) return 'San Francisco'
  if (/name/.test(hint)) return 'Kai Mercer'
  if (/url|website|link/.test(hint)) return 'https://example.com/page'
  return ''
}

async function tickConsents(page) {
  return page.evaluate(() => {
    const MARKETING = /newsletter|subscribe|marketing|promotion|email me|offers|keep me/i
    const ticked = []
    const label = el => {
      if (el.id) {
        try {
          const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
          if (l && l.innerText.trim()) return l.innerText
        } catch { /* id 含特殊字符 */ }
      }
      const wrap = el.closest('label')
      if (wrap && wrap.innerText.trim()) return wrap.innerText
      return el.getAttribute('aria-label') || el.parentElement?.innerText || ''
    }
    for (const el of document.querySelectorAll('input[type=checkbox]')) {
      if (el.disabled) continue
      const t = (label(el) || '').replace(/\s+/g, ' ').trim()
      if (MARKETING.test(t)) continue
      if (!el.checked) { el.click(); ticked.push(t.slice(0, 60) || '(无文案勾选框)') }
    }
    for (const el of document.querySelectorAll('[role=checkbox][aria-checked=false], [role=switch][aria-checked=false]')) {
      const t = ((el.getAttribute('aria-label') || el.innerText) || '').replace(/\s+/g, ' ').trim()
      if (MARKETING.test(t)) continue
      el.click(); ticked.push(t.slice(0, 60) || '(switch)')
    }
    return ticked
  }).catch(() => [])
}

/**
 * 兜底：为自定义样式的「权利/许可」控件（不是原生 input[type=checkbox]）打勾。
 * 命中「我拥有… / 我有权处理… / 我同意条款」这类文案才点，避免误触无关开关。
 */
async function tickRightsControls(page) {
  return page.evaluate(() => {
    const RIGHTS = /\bi\s+(own|have|possess)\b|\bpermission\s+to\s+process\b|\brights?\s+to\b|i\s+certify|license\s+to\s+use/i
    const hit = []
    for (const el of document.querySelectorAll('[role=checkbox], [role=switch], button, label, span, div')) {
      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.width > 900 || r.height < 8 || r.height > 200) continue
      const t = ((el.innerText || el.getAttribute('aria-label') || '') || '').replace(/\s+/g, ' ').trim()
      if (!t || t.length > 140) continue
      if (!RIGHTS.test(t)) continue
      const state = el.getAttribute('aria-checked') ?? el.getAttribute('data-state') ?? ''
      if (state === 'true' || state === 'checked') continue
      el.click()
      hit.push(t.slice(0, 70))
      if (hit.length >= 3) break
    }
    return hit
  }).catch(() => [])
}

async function detectPaywall(page) {
  return page.evaluate(needles => {
    const t = (document.body.innerText || '').toLowerCase()
    const hit = needles.find(n => t.includes(n))
    if (hit) return hit
    const cc = document.querySelector('input[autocomplete="cc-number"], input[name*="card"], input[placeholder*="card number" i], .StripeElement, [class*="card-element"]')
    return cc ? '检测到信用卡输入控件' : ''
  }, PAYWALL_TEXT)
}

async function dismissCookie(page) {
  await page.evaluate(() => {
    const t = (s) => (s || '').toLowerCase()
    for (const b of document.querySelectorAll('button, a, [role=button]')) {
      const x = t(b.innerText)
      if (/^(accept all|accept|agree|got it|allow all|consent)$/.test(x.trim())) { b.click(); }
    }
  }).catch(() => {})
  await sleep(400)
}

/** 抽取产物：优先 blob/下载链接，退化到「文字变长了的输出容器」 */
async function collectArtifact(page, before, sel = RESULT_SEL) {
  return page.evaluate(({ before: prev, sel, maxChars }) => {
    const out = { images: [], links: [], media: [], resultText: '', resultSelector: '' }
    for (const img of document.querySelectorAll('img')) {
      const src = img.currentSrc || img.src || ''
      if (!src || img.naturalWidth < 32) continue          // 过滤图标 / 占位图
      if (prev.images.includes(src)) continue
      out.images.push({ src: src.slice(0, 200), w: img.naturalWidth, h: img.naturalHeight })
    }
    for (const a of document.querySelectorAll('a[download], a[href*="/download"], a[href^="blob:"]')) {
      const href = a.getAttribute('href') || ''
      if (href && !prev.links.includes(href)) out.links.push(href.slice(0, 200))
    }
    for (const v of document.querySelectorAll('video, audio')) {
      const src = v.currentSrc || v.src || ''
      if (src && !prev.media.includes(src)) out.media.push({ src: src.slice(0, 200), tag: v.tagName.toLowerCase() })
    }
    // 文字输出：找增长最多的那个「结果框」。只用严格的结果容器，
    // 且长度上限过滤掉整页区块——否则会把营销文案当成生成结果。
    const grewCands = []
    for (const el of document.querySelectorAll(sel)) {
      const now = (el.innerText || '').trim()
      if (now.length > maxChars) continue
      const key = el.id ? '#' + el.id : (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName)
      const was = prev.texts.find(t => t.key === key)
      // 要求「之前几乎没有内容，之后有了内容」——这才是生成的样子
      const grew = was ? now.length - was.len : now.length
      if (grew > 40) grewCands.push({ grew, text: now.slice(-800), key })
    }
    grewCands.sort((a, b) => b.grew - a.grew)
    if (grewCands[0]) { out.resultText = grewCands[0].text; out.resultSelector = grewCands[0].key }
    return out
  }, { before, sel, maxChars: RESULT_MAX_CHARS })
}

/** 把页面里的产物真正抓成字节：图片 / 音频 / 视频都要覆盖 */
async function persistArtifact(page, out, dir) {
  const saved = []

  // 先试页面内 fetch（带同源身份），失败再退到 node 侧裸 GET（多数 CDN 公开可读）
  const grab = async (src) => {
    const inPage = await page.evaluate(async u => {
      try {
        const r = await fetch(u)
        const b = await r.blob()
        return await new Promise(res => {
          const fr = new FileReader()
          fr.onload = () => res({ b64: String(fr.result).split(',')[1] || '', type: b.type })
          fr.onerror = () => res(null)
          fr.readAsDataURL(b)
        })
      } catch { return null }
    }, src).catch(() => null)
    if (inPage?.b64) return { buf: Buffer.from(inPage.b64, 'base64'), type: inPage.type }
    if (/^https?:/i.test(src)) {
      try {
        const r = await fetch(src)
        if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), type: (r.headers.get('content-type') || '').split(';')[0] }
      } catch { /* 跨域或不可达 */ }
    }
    return null
  }

  // audio/x-wav、image/x-png 这类带 x- 前缀的类型要剥掉，否则会落成 .xwav 这种怪扩展名
  const extOf = (type, fallback) => {
    const e = (String(type).split('/')[1] || '').split(';')[0]
      .replace(/[^a-z0-9-]/g, '').replace(/^x-/, '').slice(0, 4)
    return e || fallback
  }

  for (const [i, img] of (out.images || []).slice(0, 2).entries()) {
    if (!/^(blob|data|https?):/i.test(img.src)) continue
    const got = await grab(img.src)
    if (!got) continue
    // 8KB 以下基本是 UI 占位图；留着会把「看起来很像产物」的假证据混进来
    if (got.buf.length < 8192) continue
    const file = `artifact-${i}.${extOf(got.type, 'png')}`
    await writeFile(resolve(dir, file), got.buf)
    saved.push({ file, bytes: got.buf.length, kind: got.type || 'image', dims: `${img.w}x${img.h}` })
  }

  // 音频/视频：vocalseparator 的产物就是两个 <audio>，只抓 <img> 会整个漏掉
  for (const [i, m] of (out.media || []).slice(0, 2).entries()) {
    if (!m.src || m.src === 'none') continue
    const got = await grab(m.src)
    if (!got) continue
    if (got.buf.length < 4096) continue
    const file = `artifact-media-${i}.${extOf(got.type, m.tag === 'audio' ? 'wav' : 'mp4')}`
    await writeFile(resolve(dir, file), got.buf)
    saved.push({ file, bytes: got.buf.length, kind: got.type || `${m.tag}/*` })
  }

  if (out.resultText) {
    const file = 'artifact-text-0.txt'
    await writeFile(resolve(dir, file), out.resultText)
    saved.push({ file, bytes: Buffer.byteLength(out.resultText), kind: 'text/plain' })
  }
  return saved
}

// ── 单站点主流程 ────────────────────────────────────────────
/**
 * 上传合成素材。三条路径依次降级，缺一条都会让整批站点被判成「不可用」：
 *   ① 页面已有 <input type=file>（哪怕隐藏）—— Playwright 可直接注入
 *   ② 点拖拽区唤起系统文件选择框 —— 拿到 filechooser 再 setFiles
 *   ③ 直接向页面派发合成的 DragEvent —— React/Vue 拖拽组件的标准解法
 * 第一版只有 ①②，导致 14 个里有 5 个因为拿不到选择框而被误判为 UNVERIFIED。
 */
const DROPZONE_SELECTORS = [
  '[data-dropzone]', '[class*=dropzone]', '[class*=drop-zone]',
  '[class*=upload-area]', '[class*=uploadArea]', '[class*=upload]',
  '[class*=drop]', 'label[for*=file]', '[class*=file-input]',
]

async function uploadFile(page, fixture) {
  // ①
  if (await page.locator('input[type=file]').count()) {
    await page.setInputFiles('input[type=file]', fixture.path, { timeout: 10000 })
    return 'input[type=file]'
  }

  // ② 逐个候选选择器试点击；每试一次都回头再看一眼有没有动态插入 file input
  for (const sel of DROPZONE_SELECTORS) {
    const loc = page.locator(sel).first()
    if (!(await loc.count())) continue
    let chooserRef = null
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 4000 }).then(c => (chooserRef = c)).catch(() => null)
    await loc.click({ timeout: 4000, force: true }).catch(() => {})
    await chooserPromise
    if (chooserRef) { await chooserRef.setFiles(fixture.path); return `filechooser ${sel}` }
    if (await page.locator('input[type=file]').count()) {
      await page.setInputFiles('input[type=file]', fixture.path, { timeout: 8000 })
      return `延迟出现的 input（经 ${sel} 触发）`
    }
  }

  // ③ 合成拖拽事件。先判断成功与否，不然后面所有步骤都在空转
  const b64 = (await readFile(fixture.path)).toString('base64')
  const hit = await page.evaluate(async ({ b64, name, type, selectors }) => {
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    const file = new File([arr], name, { type })
    const dt = new DataTransfer()
    dt.items.add(file)
    const fire = (el, kind) => el.dispatchEvent(new DragEvent(kind, { bubbles: true, cancelable: true, dataTransfer: dt }))

    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.width < 40 || r.height < 40) continue
        fire(el, 'dragenter'); fire(el, 'dragover'); fire(el, 'drop')
        await new Promise(r2 => setTimeout(r2, 900))
        // 成功信号：页面承认了这个文件名，或出现了新的 blob 预览图
        if ((document.body.innerText || '').includes(name)) return sel
        for (const img of document.querySelectorAll('img[src^="blob:"]')) {
          if (img.naturalWidth > 50) return sel
        }
      }
    }
    return ''
  }, { b64, name: fixture.kind === 'wav' ? 'sample.wav' : 'sample.png', type: fixture.kind === 'wav' ? 'audio/wav' : 'image/png', selectors: DROPZONE_SELECTORS })

  if (hit) return `合成拖拽事件 → ${hit}`
  throw new Error('三条上传路径全部失败（无 file input、唤不出选择框、拖拽事件无效）')
}

async function tryTool(browser, target) {
  const { host, site, pr, category } = target
  const t0 = Date.now()
  const dir = resolve(EVIDENCE_DIR, host)
  // 只清自己这一个站点的目录，避免上一轮的产物残留在 report 里造成误读
  // （刻意不做整目录 rm -rf：reports/ 里还有别的流程生成的报告）
  await rm(dir, { recursive: true, force: true }).catch(() => {})
  await mkdir(dir, { recursive: true })

  const rec = {
    host, pr, category,
    observed_at: new Date().toISOString(),
    verdict: 'UNVERIFIED',
    reasons: [],
    steps: [],
    wall_clock_sec: 0,
    environment: { headed: false, chrome: 'local', budget_sec: BUDGET_MS / 1000 },
    observed: {
      reached: false, http_status: 0, final_host: '', title: '',
      output_kind: '', artifacts: [], providers_seen: [], api_calls: [],
      captcha: '', paywall: '', post_run_blocker: '', notes: [],
    },
    evidence: { steps: [], wall_clock_sec: 0, output_kind: '', output_detail: '', screenshots: [], artifacts: [] },
  }
  const step = s => { rec.steps.push(s); say(s) }
  const deadline = t0 + BUDGET_MS
  const left = () => deadline - Date.now()

  let ctx
  try {
    ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
      acceptDownloads: true,
    })
    const page = await ctx.newPage()

    // 网络层观测：纯静态资源一律丢弃，只留可能有信息量的请求
    const netLog = []
    // 只在点击主按钮之后开启：把「响应体真的是产物」的字节抓下来存盘。
    // 只看 <img> 会被 UI 占位图和列表缩略图骗过去（第一次试跑就栽在这里）。
    const collecting = { on: false, pending: [] }
    page.on('response', async res => {
      try {
        const req = res.request()
        const u = req.url()
        const type = (res.headers()['content-type'] || '').split(';')[0]
        if (/^https?:/.test(u) && !/\.(css|js|map|woff2?|ttf|ico)(\?|$)/i.test(u)) {
          netLog.push({ url: u, method: req.method(), status: res.status(), type, size: Number(res.headers()['content-length']) || 0 })
        }
        if (collecting.on && ARTIFACT_TYPES.some(re => re.test(type)) && !/\/(logo|avatar|icon|placeholder|sprite)/i.test(u)) {
          collecting.pending.push((async () => {
            try {
              const buf = await res.body()
              return { url: u, type, bytes: buf.length, buf }
            } catch { return null }
          })())
        }
      } catch { /* 忽略已销毁的请求 */ }
    })

    step(`打开 ${site}`)
    const resp = await page.goto(site, { waitUntil: 'domcontentloaded', timeout: Math.min(25000, left()) })
    rec.observed.http_status = resp ? resp.status() : 0
    rec.observed.final_host = hostOf(page.url())
    rec.observed.title = (await page.title().catch(() => '')).slice(0, 120)
    rec.observed.reached = true
    if (rec.observed.final_host !== host) step(`⚠ 域名漂移至 ${rec.observed.final_host}`)

    await page.waitForTimeout(2000)
    await dismissCookie(page)

    const homeCap = await detectCaptcha(page)
    if (homeCap.length) { rec.observed.captcha = homeCap.join('+'); say('首页出现验证码控件：' + homeCap.join('+')) }

    const beforeShot = resolve(dir, '01-landing.png')
    await page.screenshot({ path: beforeShot, fullPage: false }).catch(() => {})
    rec.evidence.screenshots.push('evidence/' + host + '/01-landing.png')

    const ui = await inspect(page)
    const visibleAll = ui.fileInputs.filter(x => x.visible).length
      + ui.textInputs.filter(x => x.visible).length
      + ui.textareas.filter(x => x.visible).length
      + ui.editables.filter(x => x.visible).length
    step(`页面探测：${ui.fileInputs.length} 个文件上传 · ${ui.textInputs.length} 个文本框 · ${ui.textareas.length} 个文本域 · ${ui.buttons.length} 个按钮（可见输入 ${visibleAll}）`)

    // 付费控件优先于一切：页面上有任何信用卡输入位就立即停下
    const pw = await detectPaywall(page)
    if (pw) {
      rec.verdict = 'BLOCKED_PAYWALL'
      rec.observed.paywall = pw
      rec.reasons.push('页面存在付费要求/信用卡控件，到此为止')
      return rec
    }

    // 只有「看起来真像拖拽区」才算：[class*=drop] 会命中 topbar 的 dropdown 菜单，
    // 第一版就是因此把几个纯落地页当成了「上传失败」。
    const looksLikeUpload = z =>
      z.box && z.box.w >= 120 && z.box.h >= 80
      && /upload|drop|drag|browse|choose|select\s*(an?\s*)?(image|file|photo|audio|video)/i.test(z.text || '')
    const uploadZones = ui.dropzones.filter(d => d.visible && looksLikeUpload(d))
    const realFileInput = ui.fileInputs.length > 0
    const textSlot = ui.textareas.find(x => x.visible && !x.disabled)
      || ui.textInputs.find(x => x.visible && !x.disabled && /prompt|describe|text|enter|type|write|idea/i.test(x.placeholder + x.name))
      || ui.textInputs.find(x => x.visible && !x.disabled)
      || null
    const editableSlot = ui.editables.find(e => e.visible) || null
    const mediaCategory = ['image', 'video', 'audio'].includes(category)

    // 优先级：真实的 file input > 文本框 > contenteditable > 只有拖拽区
    // 顺序错了会闹笑话——vedicastrologychart.net 有 4 个文本框（姓名/城市/日期），
    // 第一版却因为误匹配到一个「拖拽区」去上传图片，白白判成上传失败。
    let plan = 'none'
    if (realFileInput) plan = 'file'
    else if (mediaCategory && uploadZones.length) plan = 'file'
    else if (textSlot) plan = 'text'
    else if (editableSlot) plan = 'editable'
    else if (uploadZones.length) plan = 'file'

    if (plan === 'none') {
      rec.verdict = 'UNVERIFIED'
      rec.reasons.push('首页没有任何可操作的输入（既无上传区也无文本框），本轮无法试用；'
        + '这类站点通常需要登录后才有工作台，属于 no-free-tier 而非工具不可用')
      return rec
    }

    // ⛔ 红线：绝不往任何疑似注册/付款表单里填东西
    const textLooksLikeAuth = t => /e-?mail|password|phone|card|验证码/i.test(t)
    if (plan === 'text' && textLooksLikeAuth(`${textSlot.placeholder} ${textSlot.name} ${textSlot.autocomplete}`)) {
      rec.verdict = 'BLOCKED_LOGIN'
      rec.reasons.push('唯一的输入位是登录/注册表单，本轮不注册')
      return rec
    }

    // fixture 类型按「站点自己声明能接什么」决定，而不是按分类猜
    const acceptAll = ui.fileInputs.map(f => f.accept).join(' ')
    const fixture = await ensureFixture(
      plan === 'file'
        ? (/audio|wav|mp3/i.test(acceptAll) || category === 'audio' ? 'wav' : 'png')
        : 'text',
    )
    // 图片/视频/音频类给画面描述，其余品类给一段写作任务——给错类型的提示词会让工具走异常分支
    if (fixture.kind === 'text' && !mediaCategory) fixture.text = PROMPTS[1]

    step(`计划：${{ file: '上传合成素材', text: '填写表单/提示词', editable: '在富文本区输入' }[plan]}（禁用：注册 / 付款）`)

    // ── 填输入 ──
    if (plan === 'file') {
      try {
        const how = await uploadFile(page, fixture)
        step(`上传 ${fixture.kind.toUpperCase()} ${fmtBytes(fixture.bytes)}（本地合成，非私人文件；途径：${how}）`)
        await page.waitForTimeout(1200)
      } catch (e) {
        rec.reasons.push('文件上传失败：' + String(e.message).split('\n')[0].slice(0, 110))
        rec.verdict = 'UNVERIFIED'
        return rec
      }
    } else if (plan === 'text') {
      // 「表单 → 生成结果」类工具往往有多个必填项（姓名 / 城市 / 日期 / 时间）。
      // 只填第一个的话后面全空，提交必然静默失败——vedicastrologychart.net 就是这么被判死的。
      const slots = [...ui.textareas, ...ui.textInputs].filter(x => x.visible && !x.disabled)
      const slotsToFill = slots.slice(0, 6)
      const allAuth = slotsToFill.length && slotsToFill.every(s => textLooksLikeAuth(`${s.placeholder} ${s.name} ${s.autocomplete}`))
      if (allAuth) {
        rec.verdict = 'BLOCKED_LOGIN'
        rec.reasons.push('首页唯一的输入位是登录/注册表单，本轮不注册')
        return rec
      }
      let filled = 0
      for (const slot of slotsToFill) {
        const value = guessValue(slot) || fixture.text
        if (!value) continue          // 邮箱 / 手机号留空：那是在注册
        const sel = slot.tag === 'textarea' ? 'textarea' : 'input[type=text], input[type=search], input:not([type])'
        try {
          const loc = page.locator(sel).nth(slot.index)
          await loc.click({ timeout: 3000 }).catch(() => {})
          await loc.fill(value, { timeout: 6000 })
          filled++
          step(`填入${slot.placeholder ? `「${slot.placeholder.slice(0, 18)}」` : '输入框'}：${String(value).slice(0, 30)}`)
        } catch { /* 个别输入框不可编辑，跳过 */ }
      }
      if (!filled) {
        rec.reasons.push('所有可见输入框都不可填写')
        rec.verdict = 'UNVERIFIED'
        return rec
      }
    } else if (plan === 'editable') {
      try {
        const loc = page.locator('[contenteditable=true]').nth(editableSlot.index)
        await loc.click({ timeout: 5000 }).catch(() => {})
        await page.keyboard.type(fixture.text, { delay: 10 })
        step(`在富文本区输入：${String(fixture.text).slice(0, 46)}…`)
      } catch (e) {
        rec.reasons.push('富文本输入失败：' + String(e.message).split('\n')[0].slice(0, 90))
        rec.verdict = 'UNVERIFIED'
        return rec
      }
    }

    // ── 找主按钮 ──
    // 必须重新采集：上传/输入之后页面会重排，按钮可能由 disabled 变可用，
    // 沿用之前的 index 会点到错误的元素。
    // 再清一次同意条：不少站点的 cookie 横幅是延迟渲染的，上传后才浮出来，
    // 它的按钮会被当成主 CTA 点到（vocalseparator.com 就栽在这里）。
    await dismissCookie(page)

    // 勾选「我拥有这段素材」之类前置确认项，否则主按钮一直是 disabled
    // 勾选「我拥有这段素材」之类前置确认项，否则主按钮一直是 disabled。
    // vocalseparator.com 后来把原生 input 换成了自定义控件，input[type=checkbox] 直接归零，
    // 所以必须有第二层兜底：按文案找「权利/许可」类控件并点它。
    let ticked = await tickConsents(page)
    if (!ticked.length) ticked = await tickRightsControls(page)
    if (ticked.length) step('勾选前置确认：' + ticked.map(t => `「${t}」`).join(' '))
    await page.waitForTimeout(800)

    // 锚点 = 我们刚刚操作过的那个输入位。真正的提交按钮几乎总在它旁边。
    const anchor = plan === 'file'
      ? (ui.fileInputs[0]?.box || uploadZones[0]?.box || null)
      : (textSlot?.box || editableSlot?.box || null)
    const scoreButtons = list => list
      .filter(b => b.visible && !b.disabled)
      .map(b => {
        const t = b.text.toLowerCase()
        let score = 0
        ACTION_WORDS.forEach(w => { if (t.includes(w)) score += 10 })
        if (/^(try|generate|create|convert|start|run|upscale|enhance|describe|translate|split|separate|process|transform)\b/.test(t)) score += 8
        NEGATIVE_WORDS.forEach(w => { if (t.includes(w)) score -= 20 })
        if (b.inChrome) score -= 12                                  // nav / header / footer 里的基本不会是主 CTA
        const words = t.split(/\s+/).length
        if (words <= 2) score += 6                                   // 主 CTA 文案通常很短
        else if (words >= 5) score -= 6
        if (plan === 'file' && /upload|choose|browse|select/i.test(t)) score -= 8   // 已经传过了
        if (anchor && b.box) {
          const d = Math.hypot(anchor.x - b.box.x, anchor.y - b.box.y)
          if (d < 300) score += 12; else if (d < 700) score += 4; else score -= 6
        }
        if (b.tag === 'input' && b.type === 'submit') score += 3
        return { ...b, score }
      })
      .sort((a, b) => b.score - a.score)

    let afterUi = await inspect(page)
    let candidates = scoreButtons(afterUi.buttons)

    // 有些 React 界面 hydration 比我们的等待慢，主按钮会晚几秒才出现。
    // 给一次「再看一眼」的机会，否则会把本来能用的工具判成「找不到主按钮」。
    if (!(candidates[0] && candidates[0].score >= 10)) {
      await page.waitForTimeout(2500)
      const more = await tickConsents(page)
      const extra = more.length ? more : await tickRightsControls(page)
      if (extra.length) step('二次勾选：' + extra.map(t => `「${t}」`).join(' '))
      afterUi = await inspect(page)
      candidates = scoreButtons(afterUi.buttons)
    }

    const pick = candidates[0]
    if (!pick || pick.score < 10) {
      rec.verdict = 'UNVERIFIED'
      rec.reasons.push('找不到足够明确的主操作按钮（最高分按钮：' + (pick ? `"${pick.text}" ${pick.score} 分，门槛 10` : '无') + '）')
      return rec
    }
    say(`主按钮候选：${candidates.slice(0, 3).map(c => `"${c.text}"(${c.score})`).join(' · ')}`)

    // ── 执行 ──
    // before 快照的 key 规则必须和 collectArtifact 里逐字一致，否则比对会全部落空
    const beforeSample = await page.evaluate(sel => ({
      images: [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src).filter(Boolean),
      links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean),
      media: [...document.querySelectorAll('video,audio')].map(v => v.currentSrc || v.src).filter(Boolean),
      texts: [...document.querySelectorAll(sel)].map(el => ({
        key: el.id ? '#' + el.id : (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName),
        len: (el.innerText || '').trim().length,
      })),
    }), RESULT_SEL)
    const netMark = netLog.length
    const runStart = Date.now()

    try {
      await page.locator('button, input[type=submit], [role=button], a.btn, a[class*=btn]').nth(pick.index)
        .click({ timeout: 8000, force: false })
      step(`点击「${pick.text.slice(0, 40)}」`)
    } catch (e) {
      rec.reasons.push('点击主按钮失败：' + String(e.message).split('\n')[0].slice(0, 90))
      rec.verdict = 'UNVERIFIED'
      return rec
    }

    // ── 等待产物 ──
    collecting.on = true
    let result = null
    let failure = ''
    // 异步任务队列的人工智能工具可能要等几十秒甚至排队上百秒，48 秒会系统性低报
    const waitBudget = Math.max(8000, Math.min(90000, left() - 9000))
    const poll = 1500
    let idleSince = 0
    let lastNetCount = netLog.length
    for (let waited = 0; waited < waitBudget; waited += poll) {
      await page.waitForTimeout(poll)

      failure = await page.evaluate(needles => {
        const t = (document.body.innerText || '').toLowerCase()
        return needles.find(n => t.includes(n)) || ''
      }, FAILURE_TEXT)
      if (failure) break

      const cap = await detectCaptcha(page)
      if (cap.length) { rec.observed.captcha = cap.join('+'); rec.verdict = 'BLOCKED_CAPTCHA'; rec.reasons.push('执行后出现验证码，不绕过'); break }
      const paid = await detectPaywall(page)
      if (paid) { rec.observed.paywall = paid; rec.verdict = 'BLOCKED_PAYWALL'; rec.reasons.push('执行后转入付费流程：' + paid); break }

      result = await collectArtifact(page, beforeSample)
      // 只有「强信号」才提前收手。弱信号（多了几张小图、某处文字动了）继续等，
      // 否则会像 imagetoimage.dev 那样在 2 秒时就误判收工，把真产物漏掉。
      const bigNow = (result.images || []).filter(i => i.w >= 320).length
      const textNow = (result.resultText || '').length >= 120
      if (bigNow || result.links.length || (result.media || []).length || textNow) {
        await page.waitForTimeout(2500)   // 留个尾巴，让还在飞的产物响应能落地
        step(`等待 ${((Date.now() - runStart) / 1000).toFixed(0)}s 后出现产物`)
        break
      }
      // 网络彻底安静一段时间就别再耗着了——省下的时间留给下一个站点
      if (netLog.length !== lastNetCount) { lastNetCount = netLog.length; idleSince = 0 }
      else {
        idleSince += poll
        if (idleSince >= 12000) { say('网络静默超过 12s，判定本次无产物'); break }
      }
    }
    collecting.on = false
    rec.evidence.wall_clock_sec = +((Date.now() - runStart) / 1000).toFixed(1)

    const afterShot = resolve(dir, '02-result.png')
    await page.screenshot({ path: afterShot, fullPage: false }).catch(() => {})
    rec.evidence.screenshots.push('evidence/' + host + '/02-result.png')

    if (failure) { rec.observed.notes.push('页面报错：' + failure); step('页面报错：' + failure) }

    // ── 产物①：网络响应体（最强证据，有真实字节）──
    const netArts = (await Promise.all(collecting.pending)).filter(Boolean).filter(a => a.bytes >= 8192)
    for (const [i, a] of netArts.sort((x, y) => y.bytes - x.bytes).slice(0, 2).entries()) {
      const ext = (a.type.split('/')[1] || 'bin').split(';')[0].replace(/[^a-z0-9]/g, '')
      const file = `artifact-net-${i}.${ext === 'octet-stream' ? 'bin' : ext}`
      await writeFile(resolve(dir, file), a.buf)
      rec.observed.artifacts.push({ file, bytes: a.bytes, kind: a.type, source: hostOf(a.url) })
      step(`捕获网络产物 ${fmtBytes(a.bytes)}（${a.type}）`)
    }

    // ── 产物②：页面元素 —— 图片要过 320px 门槛，文字要 ≥120 字符 ──
    const hasDownloadLink = (result?.links || []).length > 0
    const strictText = (result?.resultText || '').length >= 120
      ? result.resultText
      : ''
    if (result && rec.verdict !== 'BLOCKED_CAPTCHA' && rec.verdict !== 'BLOCKED_PAYWALL') {
      const big = (result.images || []).filter(i => i.w >= 320)
      const mediaNew = result.media || []
      // 只要有任一类线索就去抓字节，不能只因为「没有大图」就把音频/文字产物丢掉
      if (big.length || mediaNew.length || strictText) {
        const saved = await persistArtifact(page, { images: big.slice(0, 2), media: mediaNew.slice(0, 2), resultText: strictText }, dir)
        rec.observed.artifacts.push(...saved)
        for (const s of saved) step(`落盘产物 ${s.file} ${fmtBytes(s.bytes)}`)
      }
      if (big.length) step(`新图片 ${result.images.length} 张，其中 ${big.length} 张 ≥320px（最大 ${Math.max(...big.map(i => i.w))}px）`)
      else if (result.images.length) step(`新图片 ${result.images.length} 张但均 <320px，判定为列表缩略图/UI，不计为产物`)
      if (mediaNew.length) step(`新出现 ${mediaNew.length} 个音频/视频播放器`)
      if (strictText) rec.evidence.output_detail = strictText.slice(0, 400)
      rec.observed.output_kind = rec.observed.artifacts.length
        ? (rec.observed.artifacts[0].kind || rec.observed.artifacts[0].type || 'file')
        : hasDownloadLink ? 'download-link'
          : (result.media || []).length ? 'media' : strictText ? 'text' : ''
    }
    rec.evidence.artifacts = rec.observed.artifacts.map(a => `evidence/${host}/${a.file}`)
    if (hasDownloadLink) step(`观测到 ${result.links.length} 个下载链接`)

    // ── 网络层证据 ──
    const newCalls = netLog.slice(netMark)
    rec.observed.api_calls = newCalls
      .filter(n => n.method !== 'GET' || n.size > 500)
      .slice(0, 12)
      .map(n => ({ m: n.method, host: hostOf(n.url), p: '/' + n.url.split('/').slice(3).join('/').slice(0, 70), s: n.status, t: n.type }))
    const seen = new Set()
    for (const n of netLog) {
      const h = hostOf(n.url)
      if (!h || h === host || h === rec.observed.final_host) continue
      for (const [re, name] of PROVIDERS) if (re.test(h)) seen.add(name)
    }
    rec.observed.providers_seen = [...seen]
    if (rec.observed.providers_seen.length) step(`网络层检出 AI 供应商：${rec.observed.providers_seen.join(', ')}`)

    // ── 判定：没有字节就没有 VERIFIED ──
    // 一次 POST 请求 ≠ 产出。它经常只是「创建项目 / 埋点 / 拉取配额」。
    // 只有真的把产物字节存下来了，才配得上 VERIFIED；调用发生了但没取回东西，只能是 PARTIAL。
    if (rec.verdict === 'UNVERIFIED') {
      const hasBytes = rec.observed.artifacts.some(a => a.bytes >= 8192)
      const postCall = newCalls.some(n => n.method !== 'GET' && (n.type.startsWith('application/json') || ARTIFACT_TYPES.some(re => re.test(n.type))))
      const called = postCall || rec.observed.providers_seen.length > 0

      if (hasBytes || hasDownloadLink) {
        rec.verdict = 'VERIFIED'
        rec.reasons.push('实测产出且留有字节级证据' + (rec.observed.providers_seen.length ? `（模型供应商：${rec.observed.providers_seen.join('/')}）` : ''))
      } else if (strictText && called) {
        rec.verdict = 'VERIFIED'
        rec.reasons.push('产出文字结果且伴随真实的后端调用')
      } else if (called || strictText || (result?.media || []).length) {
        rec.verdict = 'PARTIAL'
        rec.reasons.push(called ? '后端调用确实发生了，但没取回产物本体，不足以据此收录' : '有产出迹象但缺少调用佐证')
      } else if (failure) {
        rec.verdict = 'FAILED'
        rec.reasons.push('工具执行报错：' + failure)
      } else {
        rec.reasons.push('未观测到任何产物，也未检出模型调用——不补写、不推测')
      }
    }
    return rec
  } catch (e) {
    rec.verdict = 'ERROR'
    rec.reasons.push('执行异常：' + String(e.message).split('\n')[0].slice(0, 140))
    return rec
  } finally {
    rec.wall_clock_sec = rec.evidence.wall_clock_sec = +((Date.now() - t0) / 1000).toFixed(1)
    await ctx?.close().catch(() => {})
  }
}

// ── 主入口 ──────────────────────────────────────────────────
async function main() {
  if (!existsSync(CHROME)) {
    console.error(`找不到本机 Chrome：${CHROME}\n可设置 CHROME_PATH 环境变量指向任意 Chromium 内核。`)
    process.exit(1)
  }
  const probe = JSON.parse(await readFile(PROBE, 'utf8'))
  const passed = probe.filter(x => x.verdict === 'PASS')

  let targets = arg('only')
    ? passed.filter(x => x.host === arg('only'))
    : arg('pr')
      ? passed.filter(x => String(x.pr) === arg('pr'))
      : has('all')
        ? passed
        : passed.filter(x => !(x.facts?.pages?.signup || x.facts?.pages?.login))

  if (LIMIT) targets = targets.slice(0, LIMIT)
  if (!targets.length) { console.log('没有可跑的目标'); return }

  console.log(`待验证 ${targets.length} 个站点 · 单站预算 ${BUDGET_MS / 1000}s · 预计最长 ${Math.round(targets.length * BUDGET_MS / 60000)} 分钟`)
  console.log('（目标取自 reports/evidence-probe.json 中 L2 判定 PASS 的记录）\n')

  await mkdir(EVIDENCE_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--disable-blink-features=AutomationControlled'] })

  const results = []
  for (const t of targets) {
    process.stdout.write(`[${results.length + 1}/${targets.length}] ${t.host.padEnd(30)} `)
    const r = await tryTool(browser, { host: t.host, site: t.site, pr: t.pr, category: t.category })
    results.push(r)
    await writeFile(resolve(EVIDENCE_DIR, `${t.host}.json`), JSON.stringify(r, null, 2))
    const flag = { VERIFIED: '✅', PARTIAL: '🟡', UNVERIFIED: '⬜', FAILED: '⚠️', BLOCKED_CAPTCHA: '🔒', BLOCKED_PAYWALL: '💳', BLOCKED_LOGIN: '🔑', ERROR: '❌' }[r.verdict] || '?'
    console.log(`${flag} ${r.verdict.padEnd(16)} ${String(r.wall_clock_sec).padStart(5)}s  ${r.reasons[0] || ''}`.slice(0, 150))
    await sleep(1200)   // 站点之间留一点间隔，别像扫描器
  }
  await browser.close()

  // ── 汇总 ──
  const tally = results.reduce((m, r) => { m[r.verdict] = (m[r.verdict] || 0) + 1; return m }, {})
  const md = [
    '# L3 浏览器实操取证报告',
    '',
    `生成时间：${new Date().toISOString()}　样本：${results.length} 个站点`,
    '',
    '## 结果分布',
    '',
    '| 结局 | 数量 | 含义 |',
    '|---|---|---|',
    `| ✅ VERIFIED | ${tally.VERIFIED || 0} | 真的跑出了产物，证据已落盘 |`,
    `| 🟡 PARTIAL | ${tally.PARTIAL || 0} | 检出模型调用但没取回产物，证据不足以上架 |`,
    `| ⬜ UNVERIFIED | ${tally.UNVERIFIED || 0} | 没观测到任何产物——如实记录，不推测 |`,
    `| ⚠️ FAILED | ${tally.FAILED || 0} | 工具真的报错了，本身就是有效负面证据 |`,
    `| 🔒 CAPTCHA | ${tally.BLOCKED_CAPTCHA || 0} | 遇验证码，不绕过 |`,
    `| 💳 PAYWALL | ${tally.BLOCKED_PAYWALL || 0} | 遇付费要求，不填卡 |`,
    `| 🔑 LOGIN | ${tally.BLOCKED_LOGIN || 0} | 只有注册/登录入口，本轮不注册 |`,
    `| ❌ ERROR | ${tally.ERROR || 0} | 执行异常 |`,
    '',
    '## 逐条明细',
    '',
  ]
  for (const r of results) {
    const o = r.observed
    md.push(`### ${r.verdict}　\`${r.host}\`（PR #${r.pr}，${r.category}）`)
    md.push('')
    md.push(`- 结论：${r.reasons.join('；') || '—'}`)
    if (o.output_kind) md.push(`- 产物类型：\`${o.output_kind}\``)
    if (o.artifacts.length) md.push(`- 落盘产物：${o.artifacts.map(a => `\`${a.file}\` ${fmtBytes(a.bytes)}${a.dims ? ' ' + a.dims : ''}`).join('、')}`)
    if (o.providers_seen.length) md.push(`- 网络层检出供应商：${o.providers_seen.join(', ')}`)
    if (r.evidence.wall_clock_sec) md.push(`- 从点击到取回产物：${r.evidence.wall_clock_sec}s`)
    if (o.api_calls.length) md.push(`- 后端调用：${o.api_calls.slice(0, 4).map(c => `\`${c.m} ${c.host}${c.p}\``).join(' · ')}`)
    if (r.steps.length) md.push(`- 操作轨迹：${r.steps.map(s => s.replace(/⚠/g, '⚠')).join(' → ').slice(0, 500)}`)
    md.push('')
  }
  await writeFile(resolve(ROOT, 'reports/evidence-trial.md'), md.join('\n'))
  await writeFile(resolve(ROOT, 'reports/evidence-trial.json'), JSON.stringify(results, null, 2))

  console.log('\n──────── 汇总 ────────')
  console.log(Object.entries(tally).map(([k, v]) => `${k}:${v}`).join('  '))
  console.log(`通过率 ${Math.round((tally.VERIFIED || 0) / results.length * 100)}%（规划设定区间 20%–45%）`)
  console.log('报告：reports/evidence-trial.md　证据目录：reports/evidence/')
}

main().catch(e => { console.error('致命错误：', e); process.exit(1) })
