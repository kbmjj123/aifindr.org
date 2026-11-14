# Rules: Product Scope & Data

> 读取时机：涉及功能逻辑、数据库操作、API 接口时
> 状态：已按当前代码校正。表结构唯一事实来源是 `schema/init.sql`，端点签名以 `server/routes/api/` 源码为准。

---

## 一、分类体系

| slug | 显示名称 | emoji |
|------|----------|-------|
| `image` | Image & Design | 🖼️ |
| `writing` | Writing & Content | ✍️ |
| `video` | Video & Animation | 🎬 |
| `audio` | Audio & Music | 🎵 |
| `code` | Code & Developer | 💻 |
| `productivity` | Productivity | ⚡ |
| `marketing` | Marketing & SEO | 📈 |
| `data` | Data & Analytics | 📊 |
| `education` | Education & Learning | 📚 |
| `business` | Business & Finance | 💼 |
| `research` | Research & Search | 🔬 |
| `other` | Other | ··· |

常量与合法子分类/标签值定义在 `types/category.ts`，`types/tool.ts` 也导出 `CATEGORIES`。

---

## 二、D1 数据库（`schema/init.sql`，16 张表）

| 表 | 用途 |
|---|---|
| `tools` | 工具主表，含 Markdown 正文、审核字段、统计计数 |
| `tool_tags` | 工具标签（`tool_id` + `tag` + `type`） |
| `users` | GitHub OAuth 用户 |
| `email_logs` | 邮件发送记录 |
| `generated_articles` | AI 文章生成记录 |
| `published_links` | 反链追踪 |
| `posts` | 博客 CMS 文章 |
| `post_translations` | 文章多语种译文 |
| `custom_fields` | 自定义字段 |
| `submission_sites` | **公共外链提交平台**（848 条快照 + 用户增量），与 `tools` 是两类实体；含 `domain_rating`（Ahrefs 快照，0–100）与 `page_rank`（Open PageRank 自动刷新，0–10，量纲不同） |
| `site_categories` | 平台多标签主题分类（规则初判 + 人工复核） |
| `submission_lists` | 榜单定义：规则型 / 策展型 / 混合型，含受限筛选 DSL 与原创导语；维度含 `pricing`/`link`/`authority`/`speed`/`topic`/`alternatives` |
| `submission_list_items` | 榜单物化成员（按 `snapshot_id` 版本化） |
| `site_relations` | 相似 / 替代平台关系候选（快照 4911 条边） |
| `submission_list_changelog` | 成员 diff 审计（joined / left / pinned） |
| `submission_site_reports` | 用户补充、勘误与下架申请，待 admin 审核 |

**外链提交平台目录要点**（详见 `CLAUDE.md` §4）：数据由 `scripts/build-submission-sites.mjs`
从 `docs/res/01-list.json` + `02-details.jsonl` 双源 join 生成；`pricing`（平台整体定价）与
`has_free_submission`（是否有免费提交通道）是两套口径，不可混用；所有说明文案由本站原创，
第三方出站链接统一 `rel="nofollow noopener noreferrer"`。新增站点字段不全时落为 `needs_info`，
不参与任何榜单。

**增量维护**：新增 / 编辑 / 批量导入共用 `server/utils/submissionSiteWrite.ts` 的字段门禁、
原创文案与自动重算逻辑，入口在 `/admin/submission-lists`。保存任何站点后会自动重算
`kind IN ('rule','hybrid')` 的榜单，因此补齐字段或新增站点会立即累加进榜；策展榜的
`pinned_order` 在刷新时保留，纯策展榜（无 filters）只取 `include_slugs`。新建榜单通过
`validateFilterExpression` / `validateSortRules` 白名单校验。分类标签由后台覆盖式写入
`site_categories`，公开 facet 动态聚合并自动出现在目录页筛选器里。

**`tools` 关键字段**

| 字段 | 说明 |
|---|---|
| `slug` / `name` / `category` / `sub_category` | 标识与分类；slug 提交时由工具名 + 品类词生成 |
| `website` / `pricing` / `price_starting` / `price_detail` / `price_tiers` | 官网与定价；`price_tiers` 是 JSON，格式见 `PRICE_TIERS.md` |
| `platforms` / `has_free_trial` / `launched` | 平台、试用、上线时间 |
| `status` | `active` / `beta` / `discontinued` / `pending` / `rejected` / `needs_info`，默认 `pending` |
| `short_description` / `meta_description` / `faq` / `body` | 短描述（≤80 字符）、SEO 描述、FAQ(JSON)、Markdown 正文 |
| `logo` / `screenshots` | R2 图片；`screenshots` 为 JSON 数组 |
| `submitter_site` / `submitter_github` / `submitter_id` | 提交者信息，外链体系核心 |
| `content_path` / `data_source` | 历史内容路径字段、数据来源 |
| `featured` / `verified` / `editor_pick` | 运营标记 |
| `click_count` / `view_count` | 点击与浏览计数 |
| `reject_reason` / `reviewer_note` / `reviewed_at` | 审核信息 |
| `submitted_at` / `last_verified` / `updated_at` | 时间戳 |

> 早期文档中的 `tool_images`、`tool_videos` 表**并不存在**：媒体统一用 `tools.screenshots` / `logo` 等字段（R2 URL）。
> `types/tool.ts` 的 `ToolStatus` 目前只覆盖 4 种状态，与 schema 的 6 种不一致，涉及状态流转时以 schema 为准。

索引见 `schema/init.sql`；`schema/reset.sql` 用于重置本地库。

---

## 三、工具数据写入规范（不再是 Markdown Frontmatter）

早期方案是 `content/tools/[category]/[slug].md` + YAML frontmatter；**该目录与同步脚本已不存在**。现在工具数据由在线表单提交，经 `POST /api/submit` 校验后写入 D1，管理员在 `/admin` 审核。

`POST /api/submit` 主要字段（`server/routes/api/submit.post.ts`）：

| 字段 | 必填 | 落到 D1 |
|---|---|---|
| `name` / `website` / `category` / `pricing` / `description` | 是 | 工具主表，其中 `description` 用于正文/描述 |
| `sub_category` / `tags` | 否 | 子分类与 `tool_tags`；合法值来自 `types/category.ts` |
| `short_description` / `faq` / `detailDescription` | 否 | 短描述、FAQ(JSON)、`body` Markdown 正文 |
| `price_detail` / `price_tiers` / `has_free_trial` / `launched` | 否 | 定价信息 |
| `logo` / `screenshot_urls` / `demo_video_url` | 否 | R2 图片 URL（JSON）与演示视频 |
| `submitter_site` / `submitter_github` / `submitter_email` | 否 | 提交者与 dofollow 外链 |
| `turnstileToken` | 是 | 仅用于验证，不入库 |

slug 由 `slugify(name)` + 分类关键词后缀（`CAT_SUFFIX`）生成，并做重名检查；提交后状态为 `pending`。

---

## 四、R2 媒体文件规范

公开地址由 `R2_PUBLIC_URL` 提供（生产为 `https://cdn.aifindr.org`），旧的 `r2.aifindr.org` 写法已失效。

```
https://cdn.aifindr.org/tools/{category}/{slug}/
  cover.webp        1200×675px，< 200KB
  logo.webp         512×512px，< 100KB
  og.webp           1200×630px，< 150KB
  banner.webp       1600×400px，< 200KB
  screenshots/
    01.webp         1280×800px，< 300KB
```

上传走 `POST /api/upload` / `/api/upload/sign`（R2 绑定 `CDN`），读取走 `/api/file/[...key]`。

---

## 五、API 端点

全部位于 `server/routes/api/`，与页面同属一个 Worker：

| 分组 | 端点 |
|---|---|
| 工具 | `tools.get`、`tools/[category]/[slug].get`、`tools/search.get`、`tools/check-name.get`、`tools/links.get` |
| 提交/上传 | `submit.post`、`upload.post`、`upload/sign.post`、`file/[...key].get`、`admin/upload-from-url.post` |
| 统计 | `stats.get`、`click/[id].post`、`view/[id].post` |
| 认证 | `auth/github.get`、`auth/callback.get`、`auth/me.get`、`auth/dev-login.get` |
| 后台 | `admin/pending.get`、`admin/review.post`、`admin/tools/*`、`admin/posts/*`、`admin/users.get`、`admin/log.get`、`admin/feature.post`、`admin/broadcast.post` |
| 内容 | `blog/*`、`contributors*`、`__sitemap__/urls.get`、`generate.post` |
| 用户邮件 | `user/email.post`、`user/email/verify/[token].get` |
| 定时任务 | `cron/daily-ops`、`cron/link-checker`、`cron/monthly-report`、`cron/newsletter` |
| Webhook | `webhooks/github.post`、`webhooks/lemonsqueezy.post` |

`/api/tools` 查询参数：`category`、`sub_category`、`pricing`（逗号分隔）、`platform`、`tags`（逗号分隔）、`sort=latest|trending|featured`、`page`、`pageSize`（上限 100）；实现里强制 `t.status = 'active'`。

> **KV 缓存**：`CACHE` 绑定已配置，但工具列表/统计接口当前未接入缓存。早期文档写的「TTL 1 小时」尚未落地，新增缓存逻辑时再更新本节。

---

## 六、数据流转（实际）

```
写入：
  在线表单 → POST /api/submit → Turnstile 校验 → D1 INSERT(pending) → 邮件通知管理员
  管理员审核 → POST /api/admin/review → D1 UPDATE(active)
  图片上传 → /api/upload → R2(CDN) → URL 写入 tools.logo / screenshots
  定时任务 → cron/* → 邮件、反链检查、月报、newsletter
  Webhook → GitHub / Lemon Squeezy 事件 → 对应处理逻辑

读取：
  边缘 SSR 页面 → useApi() → Nitro handler → D1 SQL / R2
  客户端渲染页（/admin/**、/blog*）→ useApi() 的 CSR 分支 → 同域 /api/*
  sitemap → /api/__sitemap__/urls
```

不存在「GitHub PR → Action → D1 UPSERT → Pages 增量构建」这条链路：`.github/workflows/sync-to-d1.yml` 与 `pnpm run sync-d1` 都是残留（见 `CLAUDE.md` §9）。

---

## 七、外链激励体系（产品核心，不得破坏）

| 外链 | 域名 | 位置 | 状态 |
|------|------|------|------|
| GitHub 主仓库 | github.com（DA 100） | 工具内容文件中的 `submitter_site` | ⚠️ 依赖的 `content/tools/*.md` 目录当前不存在，PR 流程待恢复 |
| 工具详情页 | aifindr.org | 详情页 "Submitted by" 区域 | ✅ 由 `tools.submitter_site` 提供 |
| 贡献者详情页 | aifindr.org/contributors/[username] | 个人页面网站链接 | ✅ 由用户数据提供 |

**开发约定**：`submitter_site` 链接禁止加 `rel="nofollow"`，任何重构不得移除。
恢复 GitHub 外链时，必须保证三条承诺不缩水；不要为了「修文档」而删掉这条产品逻辑。

---

## 八、付费与增值功能

早期设想：Featured 首页置顶、加速审核、Verified 标签、访问数据统计。当前代码已接入 Lemon Squeezy webhook（`server/routes/api/webhooks/lemonsqueezy.post.ts`），具体已开放的付费权益与价格以代码/运营配置为准；`tools.featured` / `verified` / `editor_pick` 标记由后台 `admin/feature.post` 等端点维护。

---

## 九、Nuxt 路由规则（实际）

```typescript
// nuxt.config.ts
routeRules: {
  '/admin/**': { ssr: false },
  '/blog':     { ssr: false },
  '/blog/*':   { ssr: false },
}
```

其余页面为边缘 SSR；项目**没有**配置 `prerender` 或 `isr`。`robots` 排除 `/admin/` 与 `/api/`，`sitemap` 数据源是 `/api/__sitemap__/urls`。

---

## 十、Cloudflare 绑定（服务端访问）

```typescript
import { getEnv } from '~/server/utils/env'

const env = getEnv(event)
const { DB, CACHE, CDN } = env   // D1Database / KVNamespace / R2Bucket
```

公开变量与密钥清单见 `deployment.md` 和 `server/utils/env.ts` 的 `CloudflareEnv`。
