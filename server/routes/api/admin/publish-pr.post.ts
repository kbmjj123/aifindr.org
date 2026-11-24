import { createError, readBody } from 'h3'
import { getEnv, siteUrl } from '~/server/utils/env'
import { verifyAdmin } from '~/server/utils/auth'
import { getNotifyEmail, sendEmail } from '~/server/utils/email'
import { notifySearchEngines } from '~/server/utils/seo'
import { writeListingPage, pagesListingUrl, writeListingsIndex } from '~/server/utils/githubBacklink'
import { postPrComment, mergePr } from '~/server/utils/githubPr'
import { VALID_SUBCATEGORY_VALUES, VALID_TAG_VALUES } from '~/types/category'
import type { UserRecord } from '~/server/utils/jwt'

const VALID_TAG_TYPES = ['use_case', 'audience', 'feature'] as const
const VALID_CATEGORIES = Object.keys(VALID_SUBCATEGORY_VALUES)
const CAT_SUFFIX: Record<string, string> = {
  image: 'ai-image-generator', writing: 'ai-writing-tool', video: 'ai-video-generator',
  audio: 'ai-audio-tool', code: 'ai-coding-tool', productivity: 'ai-productivity-tool',
  marketing: 'ai-marketing-tool', data: 'ai-data-tool', education: 'ai-learning-tool',
  business: 'ai-business-tool', research: 'ai-research-tool', other: 'ai-tool',
}

interface PublishPayload {
  name: string
  website: string
  category: string
  pricing: 'free' | 'freemium' | 'paid'
  pr_number: number
  pr_url?: string
  slug?: string
  sub_category?: string
  price_starting?: number
  price_detail?: string
  price_tiers?: string
  has_free_trial?: number
  platforms?: string[]
  launched?: string
  meta_description?: string
  short_description?: string
  description?: string
  faq?: string
  logo?: string
  screenshots?: string[]
  body?: string
  data_source?: string
  submitter_github?: string
  submitter_site?: string
  tags?: { type: string; tag: string }[]
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  if (!await verifyAdmin(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody<PublishPayload>(event)
  const required = ['name', 'website', 'category', 'pricing', 'pr_number'] as const
  const missing = required.filter(f => body[f] === undefined || body[f] === null || String(body[f]).trim() === '')
  if (missing.length) {
    throw createError({ statusCode: 400, statusMessage: `Missing fields: ${missing.join(', ')}` })
  }

  const name = String(body.name).trim()
  const website = String(body.website).trim()
  const category = String(body.category).trim()
  const subCategory = String(body.sub_category || '').trim()
  const pricing = String(body.pricing).trim()
  const prNumber = Number(body.pr_number)
  const prUrl = String(body.pr_url || `https://github.com/kbmjj123/aifindr.org/pull/${prNumber}`).trim()
  const submitterGithub = String(body.submitter_github || '').trim()
  const submitterSite = String(body.submitter_site || '').trim()

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pr_number' })
  }
  if (!['free', 'freemium', 'paid'].includes(pricing)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pricing' })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid category' })
  }
  if (subCategory && !VALID_SUBCATEGORY_VALUES[category]?.includes(subCategory)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sub_category: ${subCategory}` })
  }

  // 幂等：同一 PR 只允许发布一次，避免重复入库 / 重复邮件 / 重复评论 / 重复 merge
  const already = await env.DB.prepare('SELECT id, slug FROM tools WHERE pr_number = ? LIMIT 1')
    .bind(prNumber).first<{ id: number; slug: string }>()
  if (already) {
    throw createError({
      statusCode: 409,
      statusMessage: `PR #${prNumber} already published as tool #${already.id} (${already.slug})`,
    })
  }

  const catKw = CAT_SUFFIX[category] || 'ai-tool'
  const nameSlug = slugify(body.slug || name)
  let slug = nameSlug.includes(catKw.split('-')[0]) ? nameSlug : `${nameSlug}-${catKw}`
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  for (let suffix = 1; ; suffix++) {
    const dup = await env.DB.prepare('SELECT id FROM tools WHERE slug = ?').bind(slug).first()
    if (!dup) break
    slug = `${nameSlug}-${catKw}-${suffix}`
  }

  type TagItem = { type: string; tag: string }
  const validTags: TagItem[] = []
  for (const t of (body.tags || []) as TagItem[]) {
    if (t?.type && t?.tag && VALID_TAG_TYPES.includes(t.type as typeof VALID_TAG_TYPES[number])
      && VALID_TAG_VALUES[t.type]?.includes(t.tag)) validTags.push(t)
  }

  let ownerId: number | null = null
  if (submitterGithub) {
    const owner = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(submitterGithub).first<{ id: number }>()
    ownerId = owner?.id ?? null
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const insertResult = await env.DB.prepare(`
    INSERT INTO tools (
      slug, name, category, sub_category, website,
      pricing, price_starting, price_detail, price_tiers, has_free_trial, platforms,
      status, launched, submitted_at, updated_at, meta_description, short_description,
      faq, logo, screenshots, body, featured, verified, editor_pick, data_source,
      submitter_id, submitter_github, submitter_site, pr_number, pr_url
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      'active', ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 1, 1, 0, ?,
      ?, ?, ?, ?, ?
    )
  `).bind(
    slug, name, category, subCategory || null, website,
    pricing, Number(body.price_starting ?? 0), body.price_detail || null,
    typeof body.price_tiers === 'string' ? body.price_tiers : JSON.stringify(body.price_tiers || null),
    body.has_free_trial ? 1 : 0,
    Array.isArray(body.platforms) ? body.platforms.join(',') : String(body.platforms || ''),
    body.launched || null, now, now, body.meta_description || body.description || null,
    String(body.short_description || '').trim().slice(0, 80) || null,
    body.faq ? (typeof body.faq === 'string' ? body.faq : JSON.stringify(body.faq)) : null,
    body.logo || null,
    body.screenshots ? JSON.stringify(body.screenshots) : null,
    body.body || null,
    body.data_source || 'pr_publish',
    ownerId, submitterGithub || null, submitterSite || null, prNumber, prUrl,
  ).run()

  const toolId = insertResult.meta?.last_row_id
  if (toolId) {
    for (const t of validTags) {
      await env.DB.prepare('INSERT OR IGNORE INTO tool_tags (tool_id, tag, type) VALUES (?, ?, ?)')
        .bind(toolId, t.tag, t.type).run()
    }
  }

  // 生成 GitHub Pages 收录页（失败不影响发布）
  let listingPath = `docs/listings/${category}/${slug}.md`
  let listingUrl = pagesListingUrl(env, category, slug)
  const listing = await writeListingPage(env, {
    slug, category, name, website,
    pricing, shortDescription: body.short_description || undefined,
    submitterGithub, submitterSite,
  })
  if (listing) {
    listingPath = listing.path
    listingUrl = listing.url
    await env.DB.prepare('UPDATE tools SET content_path = ? WHERE id = ?').bind(listing.path, toolId).run()
  }
  await writeListingsIndex(env)

  const detailUrl = siteUrl(env, `/tools/${category}/${slug}`)
  const contributorUrl = submitterGithub
    ? siteUrl(env, `/contributors/${submitterGithub}`)
    : siteUrl(env, '/contributors')
  const sourceUrl = `https://github.com/kbmjj123/aifindr.org/blob/main/${listingPath}`
  // 没有 PR 作者 GitHub login 时，第三条退到贡献者列表页，避免发出 /contributors/ 空路径
  const contributorLabel = submitterGithub ? `aifindr.org/contributors/${submitterGithub}` : 'aifindr.org/contributors'
  const linksHtml = [
    `<li><a href="${listingUrl}">GitHub Pages listing</a> — kbmjj123.github.io</li>`,
    `<li><a href="${detailUrl}">Tool Detail Page</a> — aifindr.org</li>`,
    `<li><a href="${contributorUrl}">Contributor Page</a> — ${contributorLabel}</li>`,
  ].join('')

  // B-03 邮件（有可用邮箱才发）
  let submitterEmail: string | null = null
  if (ownerId) {
    submitterEmail = getNotifyEmail(
      await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ownerId).first<UserRecord>()
    )
  }
  if (submitterEmail) {
    void sendEmail(env, {
      to: submitterEmail,
      sceneId: 'B-03',
      subject: `[aifindr] Your tool "${name}" has been approved!`,
      html: [
        `<p>Great news! Your tool <strong>${name}</strong> has been approved and is now live.</p>`,
        `<p>Here are your <strong>three permanent dofollow backlinks</strong>:</p>`,
        `<ol>${linksHtml}</ol>`,
        `<p style="color:#666;font-size:11px;">Your GitHub listing is generated from <a href="${sourceUrl}">this source file</a> in our repository.</p>`,
        `<p><a href="${detailUrl}">View your listing →</a></p>`,
        `<p>— aifindr.org</p>`,
      ].join(''),
    })
  }
  void notifySearchEngines(env, detailUrl)

  // F-02 通知同分类提交者（排除本人）
  const { results: categorySubmitters } = await env.DB.prepare(`
    SELECT DISTINCT u.id AS submitter_id, u.*
    FROM tools t JOIN users u ON u.id = t.submitter_id
    WHERE t.category = ? AND t.status = 'active'
      AND t.submitter_id IS NOT NULL AND t.submitter_id != ?
      AND u.email_notify = 1 AND u.unsubscribed_at IS NULL
  `).bind(category, ownerId || 0).all<UserRecord>()
  const notified = new Set<number>()
  for (const catUser of categorySubmitters) {
    if (notified.has(catUser.id)) continue
    notified.add(catUser.id)
    const catEmail = getNotifyEmail(catUser)
    if (catEmail) {
      void sendEmail(env, {
        to: catEmail,
        sceneId: 'F-02',
        subject: `[aifindr] New ${category} tool: ${name}`,
        html: [
          `<p>A new tool has been added in <strong>${category}</strong>:</p>`,
          `<h3>${name}</h3>`,
          `<p><a href="${detailUrl}">View ${name} →</a></p>`,
          `<p style="color:#666;font-size:11px;">You're receiving this because you submitted a tool in the ${category} category. <a href="${siteUrl(env, '/settings')}">Manage notifications</a>.</p>`,
          `<p>— aifindr.org</p>`,
        ].join(''),
      })
    }
  }

  await env.CACHE.delete('stats').catch(() => {})
  await env.CACHE.delete('sitemap-xml').catch(() => {})
  await env.CACHE.delete('contributors').catch(() => {})
  await env.CACHE.delete('tools-links').catch(() => {})

  // PR 评论（三条链接）→ 最后再 merge；评论/merge 失败都不影响已发布的数据
  const prComment = [
    `✅ **${name}** has been published on aifindr.org. Thank you for your contribution!`,
    '',
    'Your three permanent **dofollow** backlinks:',
    `1. ${listingUrl} — GitHub Pages listing`,
    `2. ${detailUrl} — Tool detail page`,
    `3. ${contributorUrl} — Contributor page`,
    '',
    `Source: ${sourceUrl}`,
    '',
    '— aifindr.org',
  ].join('\n')
  const commentOk = await postPrComment(env, prNumber, prComment)
  const merged = commentOk ? await mergePr(env, prNumber) : false

  return {
    success: true,
    tool: { id: toolId, slug, name, status: 'active', pr_number: prNumber, pr_url: prUrl },
    notification: {
      listingUrl, detailUrl, contributorUrl,
      listingGenerated: !!listing,
      emailSent: !!submitterEmail,
      prCommentPosted: commentOk,
      prMerged: merged,
    },
  }
})
