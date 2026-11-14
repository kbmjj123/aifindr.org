# Rules: Tech Stack & Code Conventions

> 适用：创建页面、组件、服务端接口、修改配置时读取本文件
> 状态：已按当前代码校正。事实性总览见仓库根目录 `CLAUDE.md`（`CODEBUDDY.md` 为其软链接）。

## 1. 技术栈

| 层级 | 技术 | 实际情况 |
|------|------|---------|
| 框架 | Nuxt `^4` + Vue `^3.5` + TypeScript | ESM，`packageManager: pnpm@10.0.0` |
| 渲染 | Nitro SSR on Cloudflare Workers | 仅 `/admin/**`、`/blog`、`/blog/*` 设 `ssr: false`；无 prerender / ISR / SWR |
| 样式 | Tailwind CSS v4 + `@tailwindcss/postcss` | 无 `tailwind.config.ts`；主题变量写在 `assets/css/main.css` |
| 内容 | `@nuxt/content` v3 | 已安装，但**工具数据不走它**；工具正文是 D1 `tools.body` 中的 Markdown 字符串 |
| SEO | `@nuxtjs/seo` | sitemap / robots / 运行时 OG 图 / schema-org |
| 数据库 | Cloudflare D1 `DB` | `schema/init.sql`，16 张表（含外链提交平台目录 7 张） |
| 缓存 | Cloudflare KV `CACHE` | 已绑定；工具列表接口当前**未**接入缓存 |
| 对象存储 | Cloudflare R2 `CDN` | 公开地址 `https://cdn.aifindr.org` |
| 后端 | Nitro server routes | `server/routes/api/` 约 62 个端点，与页面同一 Worker |
| 认证 | GitHub OAuth + JWT | 管理员由 `ADMIN_GITHUB_IDS` 判定 |
| 防垃圾 / 邮件 | Turnstile / Resend | 见 `server/utils/env.ts` |
| 部署 | 单一 Cloudflare Worker | `wrangler.toml`：`main = .output/server/index.mjs` + `assets = .output/public`，**不是 Pages** |

## 2. 目录结构（实际）

```
aifindr.org/
├── pages/                       # 首页、tools（列表/分类/子分类/标签/详情）、submit、
│                                # contributors、blog、admin、settings、privacy、terms
├── components/                  # layout / tool / category / search / submit / ui / admin / og
├── composables/                 # useApi、useAuth、useTools、useSearch、usePageSeo、
│                                # useToolForm、useImageUpload、useMarkdown、useWebp、
│                                # useTheme、useToast、useKeyboardShortcuts
├── layouts/admin.vue
├── server/
│   ├── routes/api/              # Nitro 文件路由，<name>.<method>.ts
│   ├── middleware/api-logger.ts
│   ├── plugins/scheduled.ts     # cloudflare:scheduled → cron 分发
│   └── utils/                   # env / auth / jwt / email / cron / seo / logger / utils
├── schema/init.sql              # D1 建表（唯一事实来源）、reset.sql
├── types/tool.ts                # 工具类型 + CATEGORIES
├── types/category.ts            # 静态分类与合法子分类/标签值
├── assets/css/                  # main.css（CSS 变量 / @theme）、markdown.css
├── utils/linkReplacer.ts
├── plugins/stats.server.ts
├── data/                        # exchange-links.ts、submit-template.md
├── docs/                        # 邮件系统与历史设计资料
├── public/                      # favicon、manifest、ads.txt、验证文件
├── nuxt.config.ts
├── wrangler.toml
└── package.json
```

**不存在的路径**：`content/`、`content/tools/`、`workers/`、`tailwind.config.ts`、`scripts/sync-to-d1.js`、`schema/seed.sql`。`scripts/` 目录现已存在（`build-submission-sites.mjs` 等本地 ETL / 审计脚本，不参与 Worker 打包），快照导入文件为 `schema/seed-submission-sites.sql`。

## 3. `nuxt.config.ts` 关键配置（节选）

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/seo'],
  css: ['~/assets/css/main.css', '~/assets/css/markdown.css', '@vueup/vue-quill/dist/vue-quill.snow.css'],
  components: [{ path: '~/components', pathPrefix: false }],

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: { nodeCompat: true },
  },

  ogImage: { enabled: true, runtimeCacheStorage: false },  // 边缘运行时用 wasm，运行时渲染
  robots: { allow: ['/'], disallow: ['/admin/', '/api/'] },
  sitemap: { sources: ['/api/__sitemap__/urls'], exclude: ['/admin/**', '/api/**'], autoLastmod: true },

  routeRules: {
    '/admin/**': { ssr: false },
    '/blog':     { ssr: false },
    '/blog/*':   { ssr: false },
  },

  postcss: { plugins: { '@tailwindcss/postcss': {} } },
})
```

改动渲染策略前先确认 Cloudflare Worker 的运行时限制；不要照搬旧文档里的 `prerender: true` / `isr: 86400` / `preset: 'cloudflare-pages'`。

## 4. Tailwind v4 与样式规范

- 没有 `tailwind.config.ts`：颜色、字体、断点扩展在 `assets/css/main.css` 的 `@theme` / CSS 变量中定义
- 颜色只用 CSS 变量 `var(--color-...)`，禁止硬编码 `#...` / `rgba(...)`（徽章透明背景例外，见 `design-system.md`）
- 暗色主题由变量系统自动处理，无需 `dark:` 前缀
- 样式只改 CSS 变量或 Tailwind utility class；不新增 inline style（动态值除外）
- 响应式沿用 Tailwind 默认断点：

```
默认（移动）< 640px    单列，侧边栏收起
sm:         640px+     2 列卡片网格
md:         768px+     侧边栏可展开
lg:         1024px+    固定侧边栏，3 列网格
xl:         1280px+    4 列网格
2xl:        1536px+    最大宽度居中
```

## 5. 类型定义

`types/tool.ts` 定义 `ToolPricing`、`ToolStatus`、`ToolPlatform`、`ToolCategory`、`ToolImage`、`ToolVideo`、`Tool`、`ToolListResponse`、`SearchResult` 与 `CATEGORIES`；`types/category.ts` 提供合法子分类/标签常量（提交接口用它做校验）。

注意：`ToolStatus` 目前只声明 4 种（`active | beta | discontinued | pending`），而 `schema/init.sql` 的 CHECK 允许 6 种（另有 `rejected | needs_info`）。涉及状态流转时应以 schema 为准，并顺手收敛类型定义。

## 6. 数据查询规范

**服务端（唯一允许写 SQL 的地方）**

```typescript
import { getQuery } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { results } = await env.DB.prepare(
    'SELECT * FROM tools WHERE status = ? ORDER BY submitted_at DESC LIMIT ?'
  ).bind('active', 24).all()
  return { tools: results }
})
```

- 列表查询必须带 `status = 'active'` 过滤；所有用户输入必须参数化 `.bind(...)`
- `/api/tools` 支持 `category`、`sub_category`、`pricing`（逗号分隔）、`platform`、`tags`（逗号分隔）、`sort=latest|trending|featured`、`page`、`pageSize`（上限 100），实现见 `server/routes/api/tools.get.ts`
- **禁止**用 `queryCollection('tools')` 读取工具数据：没有 `content/tools` 集合，数据全在 D1

**前端**：统一通过 `composables/useApi.ts`

```typescript
const { get, post } = useApi()
const { tools, total } = await get<ToolListResponse>('/api/tools', { query: { category: 'image' } })
```

`useApi()` 在 SSR 用 `useRequestFetch()` 进程内直调（避免 Workers 自调用 522），CSR 用 `$fetch` 并自动附 `localStorage['aifindr-token']` 的 Bearer 头。不要绕过它裸写 `useFetch('/api/...')`。

## 7. API 端点分组

全部在 `server/routes/api/`，与页面同一个 Worker：

| 分组 | 端点 |
|------|------|
| 工具 | `tools.get`、`tools/[category]/[slug].get`、`tools/search.get`、`tools/check-name.get`、`tools/links.get` |
| 提交/上传 | `submit.post`、`upload.post`、`upload/sign.post`、`file/[...key].get`、`admin/upload-from-url.post` |
| 统计 | `stats.get`、`click/[id].post`、`view/[id].post` |
| 认证 | `auth/github.get`、`auth/callback.get`、`auth/me.get`、`auth/dev-login.get` |
| 后台 | `admin/pending.get`、`admin/review.post`、`admin/tools/*`、`admin/posts/*`、`admin/users.get`、`admin/log.get`、`admin/feature.post`、`admin/broadcast.post` |
| 内容 | `blog/*`、`contributors*`、`__sitemap__/urls.get`、`generate.post` |
| 外链提交平台（公开） | `submission-sites/*`（index / `[slug]` / export / suggest）、`submission-lists/*`（index / `[slug]` / export） |
| 外链提交平台（后台） | `admin/submission-lists.get` / `.post` / `refresh.post` / `[slug].post`；`admin/submission-sites.get` / `.post` / `import.post` / `[slug].get` / `[slug].post`；`admin/submission-reports/review.post` |
| 用户邮件 | `user/email.post`、`user/email/verify/[token].get` |
| 定时任务 | `cron/daily-ops`、`cron/link-checker`、`cron/monthly-report`、`cron/newsletter` |
| Webhook | `webhooks/github.post`、`webhooks/lemonsqueezy.post` |

字段、错误码与响应形状以源码为准，`api-spec.yaml` 仅作参考草稿。

## 8. 代码规范要点

1. Composition API + `<script setup>`
2. `defineProps<{ tool: Tool }>()` 必须带类型
3. `defineEmits<{ click: [tool: Tool] }>()` 必须声明
4. 新增代码禁止 `any`（历史文件仍有残留，遇到时收敛）
5. 异步组件用 `<Suspense>` + 骨架屏 fallback
6. 外链统一 `target="_blank" rel="noopener noreferrer"`；`submitter_site` 的 dofollow 链接除外，禁止加 `nofollow`
7. 项目未安装 `@nuxt/image`，不要写 `<NuxtImg>`；用普通 `<img>` 并显式 `alt` / `loading`，或复用 `components/tool/ScreenshotGallery.vue` 的现有做法
8. 服务端代码不要直接访问 `window` / `localStorage`；用 `import.meta.server` 分支隔离
9. 新增页面调用 `usePageSeo()`（见 `seo.md`）

## 9. Cloudflare 绑定

```typescript
import { getEnv } from '~/server/utils/env'

const env = getEnv(event)     // CloudflareEnv
env.DB                        // D1Database
env.CACHE                     // KVNamespace
env.CDN                       // R2Bucket
```

`getEnv()` 依次尝试 `event.context.cloudflare.env`（生产 Workers）、`event.req.runtime.cloudflare.env`（本地 Nitro + Wrangler），都取不到时抛 500。公开变量在 `wrangler.toml [vars]`，密钥用 `wrangler secret put`，完整清单见 `server/utils/env.ts` 与 `deployment.md`。

## 10. Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档
style: 样式调整（不影响逻辑）
refactor: 重构
chore: 构建/工具配置
```
