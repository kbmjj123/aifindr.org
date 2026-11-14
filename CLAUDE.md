# aifindr.org — 项目指南

> 本文件是项目事实性入口文档。`CODEBUDDY.md` 是指向本文件的软链接（`CODEBUDDY.md -> CLAUDE.md`），CodeBuddy 与 Claude Code 读取的是同一份内容。
> **只修改 `CLAUDE.md`；不要覆盖或替换 `CODEBUDDY.md` 这个链接。**
> 文档以当前代码为准；若代码与本文档冲突，先核对代码再更新本文档。

---

## 1. 项目定位

开源、社区驱动的 AI 工具目录站，同时是「提交工具 → 获得 dofollow 反链」的内容反链平台。

- 域名：`aifindr.org`（含 `www` 自定义域）
- 仓库：`github.com/kbmjj123/aifindr.org`，分支 `main`
- 核心增长飞轮：提交工具审核通过后，提交者获得 3 条永久 dofollow 外链（详见 §8）
- 当前阶段：目录站核心功能、管理后台、博客 CMS、邮件/cron/支付 webhook 均已落地，不再是早期「MVP 仅 5 页」状态

## 2. 当前架构（以代码为准）

| 项 | 实际情况 |
|---|---|
| 框架 | Nuxt `^4` + Vue `^3.5` + TypeScript，ESM |
| 样式 | Tailwind CSS v4，经 `@tailwindcss/postcss` 接入；**没有** `tailwind.config.ts`，主题变量在 `assets/css/main.css` |
| 内容模块 | `@nuxt/content` 已安装，但工具数据**不**走 `queryCollection`；工具正文是 D1 `tools.body` 中的 Markdown 字符串 |
| 渲染 | 单一 Cloudflare Worker 上的 Nitro SSR；`routeRules` 仅对 `/admin/**`、`/blog`、`/blog/*` 设 `ssr: false`；**没有** prerender / ISR / SWR 配置 |
| 后端 | Nitro server routes：`server/routes/api/` 下约 62 个端点，与页面同属一个 Worker，不存在独立 API Worker |
| 数据 | Cloudflare D1 `DB`（`aifindr-db`）、KV `CACHE`、R2 `CDN`（公开域名 `https://cdn.aifindr.org`） |
| 部署 | `wrangler.toml`：`main = .output/server/index.mjs` + `assets = .output/public`，nitro preset `cloudflare_module`（不是 Cloudflare Pages） |
| 定时任务 | 4 条 cron，由 `server/plugins/scheduled.ts` 的 `cloudflare:scheduled` 钩子分发 |
| 包管理 | pnpm 10（`packageManager: pnpm@10.0.0`） |
| SEO | `@nuxtjs/seo`；OG 图**运行时渲染**（`ogImage.runtimeCacheStorage: false`），不是构建时生成 |

## 3. 目录结构（实际）

```
aifindr.org/
├── CLAUDE.md                    ← 本文件（事实性入口）
├── CODEBUDDY.md                 ← 软链接，指向 CLAUDE.md
├── README.md                    ← 对外项目说明
├── .claude/
│   ├── rules/                   ← 9 份规则文档（见 §6）
│   └── skills/                  ← debug-issue / explore-codebase / refactor-safely / review-changes
├── .github/workflows/
│   └── sync-to-d1.yml           ← 早期同步流程，当前已失效（见 §9）
├── pages/                       ← 26 个页面：首页、tools 列表/分类/子分类/标签/详情、
│                                  submit、contributors、blog、admin（index/intake/posts/tools/users/submission-lists）、
│                                  settings、privacy、terms、
│                                  backlink-sites（目录/详情/开放数据）、submission-lists（索引/详情）
├── components/                  ← layout / tool / category / search / submit / ui / admin / og / submission
├── composables/                 ← useApi、useAuth、useTools、useSearch、usePageSeo、
│                                  useToolForm、useImageUpload、useMarkdown、useWebp、
│                                  useTheme、useToast、useKeyboardShortcuts
├── layouts/admin.vue
├── server/
│   ├── routes/api/              ← 约 62 个 Nitro 端点（见 §5）
│   ├── middleware/api-logger.ts
│   ├── plugins/scheduled.ts     ← cron 分发
│   └── utils/                   ← env / auth / jwt / email / cron / seo / logger /
│                                  submissionFilters / submissionLists
├── schema/
│   ├── init.sql                 ← D1 建表（16 张表）
│   ├── reset.sql
│   └── seed-submission-sites.sql ← 848 条外链提交平台快照（由 ETL 脚本生成）
├── types/tool.ts                ← 工具类型定义
├── types/category.ts            ← 静态分类数据
├── types/submissionSite.ts      ← 外链提交平台 / 榜单类型与常量
├── scripts/                     ← 本地 ETL / 审计脚本，不参与 Worker 打包
├── assets/css/                  ← main.css、markdown.css
├── utils/linkReplacer.ts
├── plugins/stats.server.ts
├── data/                        ← exchange-links.ts、submit-template.md
├── docs/                        ← email-notification-system.md、index.html、superpowers/、res/
├── public/                      ← favicon / manifest / ads.txt / 验证文件 /
│                                  data/submission-sites.json（开放数据集）
├── api-spec.yaml                ← OpenAPI 参考（部分描述过时，见 §9）
├── nuxt.config.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```

**不存在的目录/文件**：`content/`、`content/tools/`、`workers/`、`tailwind.config.ts`、`scripts/sync-to-d1.js`（`package.json` 的 `sync-d1` 仍指向它，见 §9）。`scripts/` 目录现已存在，存放本地 ETL / 审计脚本，不参与 Worker 打包；快照导入文件是 `schema/seed-submission-sites.sql`，不是 `schema/seed.sql`。

## 4. 数据层

主数据在 **Cloudflare D1**，本地无 Markdown 工具库。`schema/init.sql` 定义 16 张表：

`tools`、`tool_tags`、`users`、`email_logs`、`generated_articles`、`published_links`、`posts`、`post_translations`、`custom_fields`，以及公共外链提交平台目录的 `submission_sites`、`site_categories`、`submission_lists`、`submission_list_items`、`site_relations`、`submission_list_changelog`、`submission_site_reports`。

### 公共外链提交平台目录（与 `tools` 是两类实体）

- 数据管道：`scripts/build-submission-sites.mjs` 读 `docs/res/01-list.json`（列表视图：全集、顺序、前 25 条精选、免费提交口径）+ `02-details.jsonl`（详情视图：事实字段、官网、提交入口、相关平台边），按 `slug` 左连接后输出 `schema/seed-submission-sites.sql`、`public/data/submission-sites.json` 与 `reports/submission-sites-cleaning.json`。`docs/res/platforms.json` / `platforms.csv` 是有损导出，**不作数据源**。输入文件是被 `.gitignore` 排除的本地抓取物（约 55MB）；已提交的 `schema/seed-submission-sites.sql` 与 `public/data/submission-sites.json` 保证站点无需输入文件即可运行。seed 可重复导入且**不覆盖后台人工数据**：站点用 `ON CONFLICT DO UPDATE ... WHERE data_source='snapshot'`（后台编辑后变 `admin` 即受保护），只清 `source='rule'` 的分类与 `confirmed=0` 的关系，榜单定义只更新快照版本与成员数；重跑后需刷新一次榜单以恢复 pinned 顺序。
- 提交入口来自详情 `links` 的第 2 条非源站/非 ahrefs 外链（801 条），**不要**用 `spec.submitPageUrl`（错误拼接）或 `spec.submitPage`（47 条页脚污染）。
- `pricing`（平台整体定价）与 `has_free_submission`（是否有免费提交通道）是两套口径，列表文件与详情文件的 15 条差异源于此，不是脏数据。
- 说明文案（`summary` / `fact_points` / `editorial` / 榜单 `intro` / `methodology` / `faq`）全部由本站原创生成；来源页面的编辑表达、FAQ、徽章与品牌字样不入库。每条带 `attribution` 与 `source_snapshot`。
- 榜单用受限 JSON DSL 定义（`server/utils/submissionFilters.ts` 编译成参数化 SQL），成员由 `server/utils/submissionLists.ts` 物化到 `submission_list_items` 并按 `snapshot_id` 版本化；`pinned_order` 在刷新时保留。
- 第三方出站链接统一 `rel="nofollow noopener noreferrer"`。
- **数据新鲜度**：
  - 存活巡检：`submission_sites.availability` + `last_checked_at` 由 `handleCronSubmissionSitesCheck`（cron `30 3 * * *`，复用 `handleCronLinkChecker` 的 HEAD 巡检模式）每天滚动检查 60 条 active 站点（约 14 天轮完），详情页事实表展示最近巡检时间与可达性。
  - Page Rank 自动刷新：`page_rank`（Open PageRank 的 0–10 指标，区别于 Ahrefs `domain_rating` 的 0–100）由 `handleCronDomainRating`（cron `0 4 * * *`）每日批量刷新 50 条（约 17 天轮完），依赖 secret `OPENPAGERANK_API_KEY`；未配置 key 时静默跳过。
  - **`domain_rating` 保持 2026-11-13 快照值，不自动刷新**——Ahrefs 无公开免费 API（其免费工具是前端表单、带 Cloudflare 反爬，无法批量取数，且绕过违反其 ToS）。详情页明确把 DR 标注为「Ahrefs snapshot」、Page Rank 标注为「Open PageRank」并附刷新时间，两者量纲不同、分别呈现，不混为一谈。
- **alternatives 榜**：`site_relations` 落库 4911 条 `similar` 候选（权重 = 共同标签数，`confirmed=0`）；详情页 "Similar platforms" 直接消费该关系（`weight>=3`，top 6）。另用该关系为 5 个基准（product-hunt / betalist / startup-stash / fazier / toolify）自动生成 `*-alternatives` 策展榜（各 6 成员，排除自身），维度归 `alternatives`，管理员可在后台继续调 `include_slugs`。
- **增量维护闭环**：`/admin/submission-lists` 支持单条新增、JSON 批量导入（≤200 条）、站点检索与逐条编辑补齐、隐藏/恢复、新建榜单、策展（pinned / include / exclude / 导语 / 阈值 / 筛选规则 / 排序 / FAQ / SEO）、报告审核与变更记录。三条写入路径共用 `server/utils/submissionSiteWrite.ts` 的字段门禁与原创文案；保存后自动重算 `rule`/`hybrid` 榜单，所以补齐或新增站点会立即累加进榜，策展榜的 `pinned_order` 不会被快照刷新冲掉。新建/编辑榜单的 filters/sort 经 `validateFilterExpression` / `validateSortRules` 白名单校验。分类标签由后台覆盖写入 `site_categories`，公开 facet 动态聚合，后台新增的分类会自动出现在 `/backlink-sites` 筛选器里；`takedown` 报告审核通过会真正隐藏站点并重算榜单。

`tools` 关键字段：`slug`、`name`、`category`、`sub_category`、`website`、`pricing`、`price_tiers`（JSON，格式见 `PRICE_TIERS.md`）、`platforms`、`status`（`active` / `beta` / `discontinued` / `pending` / `rejected` / `needs_info`）、`short_description`、`meta_description`、`faq`（JSON）、`logo`、`screenshots`（JSON）、`body`（Markdown 正文）、`submitter_site`、`submitter_github`、`submitter_id`、`content_path`、`data_source`、`featured` / `verified` / `editor_pick`、`click_count` / `view_count`、审核字段 `reject_reason` / `reviewer_note` / `reviewed_at`。

- 所有 SQL 都必须写在 `server/routes/api/` 的 Nitro handler 内，通过 `getEnv(event).DB` 取绑定
- 图片走 R2 `CDN`，公开 URL 由 `R2_PUBLIC_URL` 提供
- `schema/init.sql` 是表结构唯一事实来源；修改表结构时同步更新它和 `product-scope.md`

## 5. API 端点

全部位于 `server/routes/api/`，同域 `/api/...`，由同一个 Worker 处理：

| 分组 | 内容 |
|---|---|
| 工具 | `tools.get`、`tools/[category]/[slug].get`、`tools/search.get`、`tools/check-name.get`、`tools/links.get` |
| 提交与上传 | `submit.post`、`upload.post`、`upload/sign.post`、`admin/upload-from-url.post`、`file/[...key].get` |
| 统计 | `stats.get`、`click/[id].post`、`view/[id].post` |
| 认证 | `auth/github.get`、`auth/callback.get`、`auth/me.get`、`auth/dev-login.get` |
| 管理后台 | `admin/pending.get`、`admin/review.post`、`admin/tools/*`、`admin/posts/*`、`admin/users.get`、`admin/log.get`、`admin/feature.post`、`admin/broadcast.post` |
| 内容 | `blog/*`、`contributors*`、`__sitemap__/urls.get`、`generate.post` |
| 外链提交平台（公开） | `submission-sites/index.get`、`submission-sites/[slug].get`、`submission-sites/export.get`、`submission-sites/suggest.post`、`submission-lists/index.get`、`submission-lists/[slug].get`、`submission-lists/[slug]/export.get` |
| 外链提交平台（后台） | `admin/submission-lists.get` / `.post`（新建）/ `refresh.post` / `[slug].post`（策展）、`admin/submission-sites.get` / `.post`（新增）/ `import.post`（批量）/ `[slug].get` / `[slug].post`（编辑补齐）、`admin/submission-reports/review.post` |
| 用户邮件 | `user/email.post`、`user/email/verify/[token].get` |
| 定时任务 | `cron/daily-ops`、`cron/link-checker`、`cron/monthly-report`、`cron/newsletter` |
| Webhook | `webhooks/github.post`、`webhooks/lemonsqueezy.post` |

前端统一通过 `composables/useApi.ts` 调用：SSR 用 `useRequestFetch()` 进程内直调（避免 Workers 自调用 522），CSR 用 `$fetch` 并附 `localStorage['aifindr-token']` 的 Bearer 头。不要绕过它直接裸写 `useFetch('/api/...')`。

## 6. Rules 文件索引

详细规范在 `.claude/rules/`，**开始任务前必须读取相关文件**：

| 文件 | 内容 | 状态 |
|---|---|---|
| `tech-stack.md` | 技术栈、目录结构、代码规范、请求与绑定约定 | 现行 |
| `design-system.md` | 设计 Token、组件像素规范、暗色主题 | 现行 |
| `product-scope.md` | 分类体系、D1 表结构、API、外链逻辑 | 现行 |
| `seo.md` | SEO 标题模板、`usePageSeo`、OG 图片 | 现行 |
| `seo-keyword-strategy.md` | 关键词策略、文案与结构化数据清单 | 现行 |
| `deployment.md` | Wrangler 配置、绑定、环境变量、本地与生产部署 | 现行 |
| `PRICE_TIERS.md` | `price_tiers` JSON 五种定价类型 | 现行 |
| `PRD.md` | v1.2 完整产品需求与外链生态设想 | **历史设想**，架构描述已过时，仅作产品背景 |
| `nuxt-cms-prd.md` | 早期博客 CMS 设想，标注「待开发」 | **历史设想**，博客 CMS 已落地，实现与设想不同 |

`PRD.md` / `nuxt-cms-prd.md` 中的 Nuxt 3、Pages、Markdown 工具库、SSG+ISR、账号密码登录等描述均不代表现状，**不得据此写代码**。

## 7. 工作流程与关键约定

### 创建组件 / 页面
1. 组件先读 `design-system.md`；页面先读 `tech-stack.md` + `product-scope.md` + `design-system.md`，SEO 相关再读 `seo.md`
2. 颜色只用 CSS 变量（`var(--color-...)`），禁止硬编码 `#...` / `rgba(...)`；暗色主题由变量系统自动处理
3. 必须响应式；样式只改 CSS 变量或 Tailwind utility，不新增 inline style（动态值除外）
4. 每个页面调用 `usePageSeo()`；需要自定义 OG 图时在其后调 `defineOgImage`

### 命名
- 页面：`pages/tools/[category]/[slug].vue`
- 组件：`components/tool/ToolCard.vue`（PascalCase，`pathPrefix: false`）
- Composables：`composables/useTools.ts`（`use` 前缀）
- 服务端：`server/routes/api/<name>.<method>.ts`（Nitro 文件路由）

### TypeScript
- 工具类型定义在 `types/tool.ts`；新增代码禁止 `any`（历史文件中仍有少量残留，遇到时顺手收敛）
- `defineProps` / `defineEmits` 必须带类型，使用 `<script setup>` + Composition API

### 数据库
1. 先读 `product-scope.md` 与 `schema/init.sql`
2. 查询只出现在 Nitro handler 内，用 `getEnv(event)` 取 D1/KV/R2 绑定
3. 列表查询必须过滤 `status = 'active'`

### 认证
GitHub OAuth + JWT；管理员由 `ADMIN_GITHUB_IDS`（逗号分隔的 GitHub ID）判定；`auth/dev-login` 仅供本地开发。

## 8. 外链激励体系（产品核心，不得破坏）

| 外链 | 位置 | 类型 |
|---|---|---|
| GitHub 主仓库 | 工具内容文件中的 `submitter_site` | dofollow |
| 工具详情页 | 详情页 "Submitted by" 区域 | dofollow |
| 贡献者页 | `/contributors/[username]` 的个人网站链接 | dofollow |

**约定**：`submitter_site` 链接禁止加 `rel="nofollow"`，任何重构不得移除。
**现状提醒**：第一条依赖的 `content/tools/[category]/[slug].md` 文件并不存在，相关代码仍按该路径生成链接（见 §9）。修复时须保证三条外链承诺不缩水。

**边界**：`/backlink-sites` 与 `/submission-lists` 记录的是**站外第三方提交平台**，其出站链接统一 `nofollow`；它们不是站内提交者激励的一部分，不得用上面的 dofollow 约定去改这批链接，也不得影响上述三条承诺。

## 9. 已知技术债（文档已标注，代码待处理）

- `package.json` 的 `sync-d1` 脚本指向不存在的 `scripts/sync-to-d1.js`，**不要执行**
- `.github/workflows/sync-to-d1.yml` 监听 `content/tools/**` 且调用上述缺失脚本，等于空转
- `pages/submit.vue` 的 PR 提交指引仍提示在 `content/tools/` 新建 `.md`
- `server/routes/api/admin/review.post.ts`、`server/routes/api/webhooks/github.post.ts` 仍硬编码 GitHub `content/tools/*.md` 路径
- `api-spec.yaml` 头部架构描述已校正，但正文端点清单仍可能滞后，以 `server/routes/api/` 源码为准
- `docs/email-notification-system.md` 仍引用 `workers/api.ts` 等旧路径（已在文件头标注）；`docs/superpowers/` 为历史设计资料，同样不作为实现依据
- `product-scope.md` / 早期规范中提到的 KV 高频查询缓存（TTL 1h）尚未在 `tools.get.ts` 落地
- `@nuxt/content` 依赖仍在，但工具数据不走它；后续如无内容集合需求可评估移除

## 10. 环境与命令

本地 Node.js / pnpm 环境已预先配置好，**禁止**运行 node、nvm、pnpm 版本检查、Node 版本切换等环境检测操作。

```bash
pnpm dev          # 本地开发（Nuxt + Nitro，Cloudflare 绑定由 wrangler.toml 模拟）
pnpm build        # 构建到 .output/
pnpm generate     # 静态生成（当前 Workers SSR 架构下一般不用）
pnpm preview      # 预览构建产物
pnpm typecheck    # 类型检查
wrangler deploy   # 部署单一 Worker
wrangler d1 execute aifindr-db --remote --file=./schema/init.sql   # 初始化/迁移 D1
node scripts/build-submission-sites.mjs                            # 重建外链提交平台快照产物
wrangler d1 execute aifindr-db --remote --file=./schema/seed-submission-sites.sql  # 导入快照（可重复执行）
```

环境变量分三类：

- `wrangler.toml [vars]`（公开）：`API_BASE`、`R2_PUBLIC_URL`、`GITHUB_CLIENT_ID`、`ADMIN_GITHUB_IDS`
- `wrangler secret put`（密钥）：`TURNSTILE_SECRET`、`GITHUB_CLIENT_SECRET`、`JWT_SECRET`、`RESEND_API_KEY`、`GITHUB_WEBHOOK_SECRET`、`LEMONSQUEEZY_WEBHOOK_SECRET`、`SITE_URL` 等，完整清单见 `server/utils/env.ts` 的 `CloudflareEnv`
- 本地：`.dev.vars` / `.dev.vars.local` / `.env*.local`（均被 `.gitignore` 排除）；`.env.example` 只含 R2 图片迁移脚本所需变量

## 11. 文档维护约定

- 改架构、目录、数据结构或 API 时，同步更新本文件、对应 rule 与 `README.md`
- `api-spec.yaml` 是接口参考草稿；端点签名以 `server/routes/api/` 源码为准
- `docs/email-notification-system.md` 是早期邮件系统说明书（头部已标注过时路径），`docs/superpowers/` 为历史设计资料；两者均不作为实现依据
- 修改本文件即等同于修改 `CODEBUDDY.md`；不要为 CodeBuddy 另建内容不同的指南，避免双份文档再次漂移
