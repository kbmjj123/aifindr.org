/**
 * 图片迁移脚本：外部 CDN → R2（S3 API）
 * ───────────────────────────────────────────
 * 扫描 content/tools/ 下所有 .md 文件，提取外部图片 URL，
 * 下载后上传到 Cloudflare R2，替换 Markdown 中的 URL。
 *
 * 前置条件：
 *   1. Cloudflare R2 bucket 已创建
 *   2. R2 API Token 已生成（Dashboard → R2 → Manage R2 API Tokens）
 *   3. 设置环境变量：
 *      R2_ACCOUNT_ID=xxx
 *      R2_ACCESS_KEY_ID=xxx
 *      R2_SECRET_ACCESS_KEY=xxx
 *      R2_BUCKET_NAME=aifindr-media  （默认）
 *      R2_PUBLIC_URL=https://r2.aifindr.org  （默认）
 *
 * 运行：
 *   预览模式：DRY_RUN=true npx tsx scripts/migrate-images-to-r2.ts
 *   正式执行：npx tsx scripts/migrate-images-to-r2.ts
 *
 * R2 S3 endpoint: https://{account_id}.r2.cloudflarestorage.com
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { readdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const __dirname = new URL('.', import.meta.url).pathname

// ─── 配置 ──────────────────────────────────────────────────

const CONTENT_DIR = join(__dirname, '..', 'content', 'tools')

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'aifindr-media'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://r2.aifindr.org'

const CDNS_TO_MIGRATE = [
  'cdn.futurepedia.io',
  'cdn2.futurepedia.io',
  'cdn.prod.website-files.com',
  'website-files.com',
  'www.futurepedia.io/api/og', // Futurepedia OG image proxy
]

const DRY_RUN = process.env.DRY_RUN === 'true'

// ─── S3 Client ────────────────────────────────────────────

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})

// ─── Helpers ──────────────────────────────────────────────

const log = (msg: string) => console.log(`[${new Date().toTimeString().slice(0, 8)}] ${msg}`)

function findFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry.startsWith('.')) continue
    if (statSync(full).isDirectory()) {
      result.push(...findFiles(full))
    } else if (entry.endsWith('.md')) {
      result.push(full)
    }
  }
  return result
}

/** Extract image URLs from markdown YAML frontmatter + inline images */
function extractImageUrls(content: string): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  // YAML fields that contain image URLs
  const fields = ['cover_image', 'og_image', 'url', 'logo_url', 'screenshot_url']
  for (const field of fields) {
    const re = new RegExp(`${field}:\\s*"?(https?://[^"\\s]+)"?`, 'gi')
    for (const m of content.matchAll(re)) {
      const u = m[1]
      if (!seen.has(u)) { seen.add(u); urls.push(u) }
    }
  }

  // Markdown images: ![](url)
  for (const m of content.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)) {
    const u = m[1]
    if (!seen.has(u)) { seen.add(u); urls.push(u) }
  }

  return urls
}

function isExternal(u: string): boolean {
  return CDNS_TO_MIGRATE.some(cdn => u.includes(cdn))
}

function r2Key(url: string, category: string, slug: string): string {
  const ext = extname(new URL(url).pathname).split('?')[0] || '.webp'
  // Detect file type for better naming
  let type = 'img'
  if (url.includes('favicon') || url.includes('logo') || url.includes('icon') || url.endsWith('.svg')) type = 'logo'
  else if (url.includes('screenshot') || url.endsWith('.webp')) type = 'screenshot'
  const hash = createHash('md5').update(url).digest('hex').slice(0, 10)
  return `tools/${category}/${slug}/${type}-${hash}${ext}`
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    console.error('❌ Missing R2 credentials. Set these env vars:')
    console.error('   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
    console.error('   (Cloudflare Dashboard → R2 → Manage R2 API Tokens)')
    process.exit(1)
  }

  log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`)
  log(`Bucket: ${R2_BUCKET} → ${R2_PUBLIC_URL}`)

  const files = findFiles(CONTENT_DIR)
  log(`Found ${files.length} markdown files`)

  // Phase 1: Download + Upload
  const urlMap = new Map<string, string>()
  let total = 0, done = 0, failed = 0, skipped = 0

  for (const fp of files) {
    const content = readFileSync(fp, 'utf-8')
    const urls = extractImageUrls(content).filter(isExternal)
    if (urls.length === 0) continue

    const parts = fp.replace(CONTENT_DIR, '').replace(/^\//, '').split('/')
    const category = parts[0]
    const slug = basename(fp, '.md')

    for (const url of urls) {
      if (urlMap.has(url)) { skipped++; continue }
      total++

      try {
        const res = await fetch(url)
        if (!res.ok) { log(`  ✗ ${res.status} ${url}`); failed++; continue }

        const body = Buffer.from(await res.arrayBuffer())
        const contentType = res.headers.get('content-type') || 'image/webp'
        const key = r2Key(url, category, slug)

        if (!DRY_RUN) {
          await s3.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
          }))
        }

        urlMap.set(url, `${R2_PUBLIC_URL}/${key}`)
        done++
        if (done % 50 === 0) log(`  ${done} images migrated...`)
      } catch (err: any) {
        log(`  ✗ ${url}: ${err.message}`)
        failed++
      }
    }
  }

  // Phase 2: Replace URLs in markdown
  if (!DRY_RUN && urlMap.size > 0) {
    log(`Replacing URLs in ${files.length} files...`)
    let changed = 0
    for (const fp of files) {
      let content = readFileSync(fp, 'utf-8')
      let modified = false
      for (const [old, newUrl] of urlMap) {
        if (content.includes(old)) { content = content.replaceAll(old, newUrl); modified = true }
      }
      if (modified) { writeFileSync(fp, content, 'utf-8'); changed++ }
    }
    log(`Updated ${changed} files`)
  }

  log(`\n✅ ${done} uploaded, ${failed} failed, ${skipped} deduped, ${urlMap.size} unique URLs`)
  if (DRY_RUN) log('🔍 DRY RUN — no files were changed.')
}

main().catch(err => { console.error(err); process.exit(1) })
