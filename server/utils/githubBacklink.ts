import type { CloudflareEnv } from './env'
import { logger } from './logger'

const REPO = 'kbmjj123/aifindr.org'
const BRANCH = 'main'
const API_BASE = 'https://api.github.com'
const DEFAULT_PAGES_BASE = 'https://kbmjj123.github.io/aifindr.org'

export interface ListingPageInput {
  slug: string
  category: string
  name: string
  website?: string | null
  pricing?: string | null
  shortDescription?: string | null
  submitterGithub?: string | null
  submitterSite?: string | null
  /** 已有文件的路径；存在时原地更新，避免 slug/category 改动后留下孤儿文件 */
  existingPath?: string | null
}

export interface ListingPageResult {
  path: string
  url: string
}

/** 收录页在仓库中的路径 */
export function listingPagePath(category: string, slug: string): string {
  return `docs/listings/${category}/${slug}.md`
}

/** 收录页在 GitHub Pages 上的公开 URL */
export function pagesListingUrl(env: CloudflareEnv, category: string, slug: string): string {
  const base = (env.GITHUB_PAGES_BASE || DEFAULT_PAGES_BASE).replace(/\/+$/, '')
  return `${base}/listings/${category}/${slug}/`
}

function escapeFrontMatter(value: string): string {
  return JSON.stringify(value.replace(/[\r\n]+/g, ' ').trim())
}

function escapeMarkdownText(value: string): string {
  return value.replace(/[\\\[\]]/g, '\\$&').replace(/[\r\n]+/g, ' ')
}

/** 只允许 http(s) 链接，避免把 javascript: 等协议写进公开页面 */
function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!/^https?:\/\//i.test(value)) return null
  if (/[\s<>"']/.test(value)) return null
  try {
    new URL(value)
  } catch {
    return null
  }
  return value.replace(/\)/g, '%29')
}

function buildMarkdown(input: ListingPageInput): string {
  const title = escapeFrontMatter(input.name)
  const description = escapeFrontMatter(input.shortDescription || `${input.name} — listed on aifindr.org`)
  const lines: string[] = [
    '---',
    `title: ${title}`,
    `description: ${description}`,
    `permalink: /listings/${input.category}/${input.slug}/`,
    '---',
    '',
    `# ${escapeMarkdownText(input.name)}`,
    '',
    `Category: ${escapeMarkdownText(input.category)}`,
  ]

  if (input.pricing) lines.push(`Pricing: ${escapeMarkdownText(input.pricing)}`)

  const website = safeHttpUrl(input.website)
  if (website) lines.push('', `[Visit website](<${website}>) — listed on [aifindr.org](https://aifindr.org).`)

  const submitterSite = safeHttpUrl(input.submitterSite)
  const submitterName = input.submitterGithub
    ? escapeMarkdownText(input.submitterGithub)
    : 'the submitter'
  if (submitterSite) {
    lines.push('', `Submitted by [${submitterName}](${submitterSite}) — discovered and contributed to aifindr.org.`)
  }

  return `${lines.join('\n')}\n`
}

/** Workers 环境下的 UTF-8 安全 base64（分块避免 String.fromCharCode 栈溢出） */
function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * 生成/更新一条工具收录页到本仓库的 docs/listings/。
 * 失败只记日志、不抛出——审核流程不应因 GitHub API 故障而中断。
 * token 未配置时静默跳过（本地开发场景）。
 */
export async function writeListingPage(
  env: CloudflareEnv,
  input: ListingPageInput,
): Promise<ListingPageResult | null> {
  const token = env.GITHUB_BACKLINK_TOKEN
  if (!token) return null

  // 没有提交者网站就没有可展示的外链，不生成页面
  if (!safeHttpUrl(input.submitterSite)) return null

  const path = input.existingPath || listingPagePath(input.category, input.slug)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'aifindr-backlink-bot',
  }

  try {
    let sha: string | undefined
    const current = await fetch(`${API_BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers })
    if (current.ok) {
      const data = await current.json() as { sha?: string }
      sha = data.sha
    } else if (current.status !== 404) {
      logger.warn('githubBacklink', 'Failed to check existing listing file', { path, status: current.status })
      return null
    }

    const response = await fetch(`${API_BASE}/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore: ${sha ? 'update' : 'add'} listing page for ${input.slug}`,
        content: utf8ToBase64(buildMarkdown(input)),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })

    if (!response.ok) {
      logger.error('githubBacklink', 'Failed to write listing file', { path, status: response.status })
      return null
    }

    logger.info('githubBacklink', 'Listing page written', { path })
    return { path, url: pagesListingUrl(env, input.category, input.slug) }
  } catch (error) {
    logger.error('githubBacklink', 'Error writing listing file', {
      path,
      message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
