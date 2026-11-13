# Rules: Deployment & Cloudflare Worker

> 适用：部署站点、配置 Cloudflare 资源、本地调试 API 时读取本文件
> 状态：已按当前架构校正。早期版本的「Pages + 独立 API Worker」方案已废弃。

---

## 一、架构总览

```
Cloudflare Worker: aifindr（单一部署单元）
├── main   = .output/server/index.mjs   ← Nitro SSR + /api/* 全部端点
├── assets = .output/public             ← 静态资源
├── 自定义域：aifindr.org / www.aifindr.org
└── 绑定
    ├── D1  DB    → aifindr-db（工具、用户、文章、日志）
    ├── KV  CACHE → 缓存命名空间
    └── R2  CDN   → aifindr-cdn（公开地址 https://cdn.aifindr.org）
```

**关键约定**

- 页面渲染与 `/api/*` 由**同一个 Worker** 处理，不存在独立 API Worker，也不需要 Pages Functions 或路由回退规则
- `nuxt.config.ts` 的 nitro preset 是 `cloudflare_module`（开 `nodeCompat`），`wrangler.toml` 用 `main` + `assets`，不是 Pages 部署
- 前端统一通过 `composables/useApi.ts` 调用 API：SSR 走 `useRequestFetch()` 进程内直调，避免 Workers 自调用导致 522；CSR 走 `$fetch` + Bearer token
- 只有 `/admin/**`、`/blog`、`/blog/*` 设了 `ssr: false`；其余页面在边缘 SSR，没有 SSG / ISR 配置

---

## 二、前置条件

| 资源 | 说明 | 配置位置 |
|------|------|---------|
| Cloudflare 账号与域名 | `aifindr.org` 已托管 | `wrangler.toml` 的 `routes` 自定义域 |
| D1 数据库 | `aifindr-db` | `[[d1_databases]] binding = "DB"` |
| KV Namespace | 缓存 | `[[kv_namespaces]] binding = "CACHE"` |
| R2 Bucket | `aifindr-cdn` | `[[r2_buckets]] binding = "CDN"` |
| GitHub OAuth App | 登录与管理后台鉴权 | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` |
| Turnstile | 提交表单防垃圾 | `TURNSTILE_SECRET` |
| Resend（可选但推荐） | 通知邮件 | `RESEND_API_KEY` |

`wrangler.toml` 已填入真实的 D1 / KV ID 与自定义域配置，非敏感信息公开提交没有问题。

---

## 三、本地环境准备

### 3.1 本地密钥

```bash
# .dev.vars / .dev.vars.local（均被 .gitignore 排除）
TURNSTILE_SECRET=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=...
RESEND_API_KEY=...
```

本地 Nitro 通过 Wrangler 模拟 `wrangler.toml` 中的 D1 / KV / R2 绑定，`getEnv(event)` 会依次尝试 `event.context.cloudflare.env` 与 `event.req.runtime.cloudflare.env`（见 `server/utils/env.ts`）。

### 3.2 初始化 D1 表结构

```bash
# 本地
wrangler d1 execute aifindr-db --local --file=./schema/init.sql

# 生产
wrangler d1 execute aifindr-db --remote --file=./schema/init.sql
```

`schema/init.sql` 定义 9 张表，是表结构的唯一事实来源；`schema/reset.sql` 用于重置本地库。修改表结构时同步更新 `product-scope.md`。

### 3.3 测试数据

通过 `POST /api/submit` 插入（进入 `pending`），再用管理端点 `POST /api/admin/review` 审核为 `active`；也可直接在 D1 里执行 INSERT。

---

## 四、本地开发

```bash
pnpm dev        # Nuxt + Nitro，默认 http://localhost:3000
```

不需要单独启动 `wrangler dev` 提供 API：API 就在同一个 Nitro 服务里。若确实需要用 Wrangler 运行构建产物做部署前验证，用 `wrangler dev` 指向 `.output`。

```bash
# 工具列表（支持筛选）
curl 'http://localhost:3000/api/tools?category=image&sort=trending'
# 工具详情
curl 'http://localhost:3000/api/tools/image/midjourney'
# 搜索
curl 'http://localhost:3000/api/tools/search?q=midjourney'
# 统计
curl 'http://localhost:3000/api/stats'
# 提交（需要 Turnstile token）
curl -X POST 'http://localhost:3000/api/submit' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Tool","website":"https://example.com","category":"image","pricing":"free","description":"A test tool.","turnstileToken":"1x00000000000000000000"}'
```

> Turnstile 测试 token `1x00000000000000000000` 在本地始终通过验证。
> `pnpm run sync-d1` 指向已删除的 `scripts/sync-to-d1.js`，**不要执行**。

---

## 五、生产部署

### 5.1 设置密钥

```bash
wrangler secret put TURNSTILE_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
wrangler secret put SITE_URL            # 可选，缺省回退到 API_BASE / https://aifindr.org
```

`wrangler.toml` 设置了 `keep_vars = true`，部署不会清掉已有变量。

### 5.2 构建并部署

```bash
pnpm build
wrangler deploy

# 验证
curl https://aifindr.org/api/stats
curl -I https://aifindr.org/tools
```

自定义域已在 `wrangler.toml` 的 `routes` 中声明（`aifindr.org` 与 `www.aifindr.org`），无需再为 `/api/*` 单独配置路由规则。

### 5.3 定时任务

`wrangler.toml [triggers] crons` 定义 4 条计划任务，`server/plugins/scheduled.ts` 监听 `cloudflare:scheduled` 并按 `controller.cron` 分发：

| cron | 处理函数 |
|------|---------|
| `0 9 * * *` | `handleCronDailyOps` |
| `0 3 * * *` | `handleCronLinkChecker` |
| `0 8 1 * *` | `handleCronMonthlyReport` |
| `0 14 * * 1` | `handleCronNewsletter` |

新增 cron 时，`wrangler.toml`、`server/plugins/scheduled.ts`、`server/utils/cron.ts` 三处都要改。

---

## 六、API 路由参考

端点文件位于 `server/routes/api/`，约 45 个。核心接口：

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| `GET` | `/api/tools` | `?category` `?sub_category` `?pricing=free,freemium` `?platform` `?tags` `?sort` `?page` `?pageSize` | 列表，强制 `status='active'`，返回 `{ tools, total, page, pageSize }` |
| `GET` | `/api/tools/:category/:slug` | — | 详情（含标签、正文、FAQ） |
| `GET` | `/api/tools/search` | `?q` | 搜索 |
| `GET` | `/api/tools/check-name` | `?name` | 提交前查重 |
| `GET` | `/api/stats` | — | 首页统计 |
| `POST` | `/api/submit` | `{ name, website, category, pricing, description, turnstileToken, ... }` | 新工具进入 `pending`，slug 由工具名 + 品类词生成 |
| `POST` | `/api/click/:id` · `/api/view/:id` | — | 点击/浏览计数 |
| `GET` | `/api/auth/github` · `/api/auth/callback` · `/api/auth/me` · `/api/auth/dev-login` | — | GitHub OAuth / JWT，dev-login 仅本地 |
| `POST` | `/api/admin/review` | `{ tool_id, status, reject_reason?, reviewer_note? }` | 审核（需管理员 JWT） |
| `GET` | `/api/admin/pending` | `?page&pageSize` | 待审核列表 |
| `POST` | `/api/upload` · `/api/upload/sign` | — | R2 图片上传 |
| `POST` | `/api/cron/*` · `/api/webhooks/*` | — | 定时任务与 GitHub / Lemon Squeezy webhook |

完整清单见 `server/routes/api/` 目录与 `api-spec.yaml`（后者部分描述仍基于旧架构）。

### 错误响应格式

```json
{ "error": "描述信息", "code": "ERROR_CODE" }
```

常见错误码：`MISSING_FIELDS` `INVALID_PRICING` `INVALID_CATEGORY` `CAPTCHA_FAILED` `INVALID_NAME` `INVALID_TOOL_ID` `INVALID_STATUS` `ALREADY_REVIEWED` `MISSING_REJECT_REASON`。

---

## 七、常见问题

**Q: 报 `Cloudflare bindings not available`（500）？**
说明 `getEnv(event)` 两种绑定来源都没取到。确认 `nitro.preset = 'cloudflare_module'`、Wrangler 已安装、`wrangler.toml` 中 D1/KV/R2 绑定齐全；用 Wrangler 运行构建产物时绑定才会完整注入。

**Q: SSR 页面调用 `/api/...` 超时/522？**
Worker 不能在请求中通过公网自调用自己。必须用 `useApi()`（SSR 分支使用 `useRequestFetch()` 进程内直调），不要写裸 `useFetch`。

**Q: 部署后 API 404？**
确认部署的是 `pnpm build` 产出的 `.output`，且 `wrangler.toml` 的 `main`/`assets` 路径未被改动；本架构无需 `/api/*` 的独立路由规则。

**Q: Turnstile 验证失败？**
本地用测试 token；生产确认 `wrangler secret put TURNSTILE_SECRET` 已执行且站点密钥域名匹配。

**Q: 博客/后台页面行为异常？**
`/admin/**`、`/blog*` 是 `ssr: false` 的客户端渲染页面，SEO 与 SSR 相关逻辑不适用于它们。

---

## 八、环境变量清单

| 变量 | 用途 | 存储方式 |
|------|------|---------|
| `DB` / `CACHE` / `CDN` | Cloudflare 绑定 | `wrangler.toml` |
| `API_BASE` | 站点/API 基址 | `wrangler.toml [vars]` |
| `R2_PUBLIC_URL` | CDN 公开地址 | `wrangler.toml [vars]` |
| `GITHUB_CLIENT_ID` | OAuth Client ID | `wrangler.toml [vars]` |
| `ADMIN_GITHUB_IDS` | 管理员 GitHub ID（逗号分隔） | `wrangler.toml [vars]` |
| `SITE_URL` | 生成绝对链接用 | secret（可缺省） |
| `TURNSTILE_SECRET` | 表单验证 | secret |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret | secret |
| `JWT_SECRET` | JWT 签名 | secret |
| `RESEND_API_KEY` | 邮件服务 | secret |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook 验签 | secret |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | 支付 webhook 验签 | secret |

权威清单是 `server/utils/env.ts` 的 `CloudflareEnv` 接口；`.env.example` 只包含 R2 图片迁移脚本需要的变量。

---

## 九、相关文件索引

| 文件 | 作用 | 是否提交 |
|------|------|---------|
| `wrangler.toml` | Worker 配置：入口、assets、自定义域、D1/KV/R2、vars、crons | 是 |
| `nuxt.config.ts` | nitro preset、routeRules、SEO 模块配置 | 是 |
| `server/routes/api/**` | 全部 API 端点 | 是 |
| `server/utils/env.ts` | 绑定与环境变量类型、获取逻辑 | 是 |
| `server/plugins/scheduled.ts` | cron 分发 | 是 |
| `schema/init.sql` / `reset.sql` | D1 建表与重置 | 是 |
| `composables/useApi.ts` | 前端请求封装（SSR/CSR 分流） | 是 |
| `.dev.vars` / `.dev.vars.local` | 本地密钥 | 否（.gitignore） |
| `wrangler.local.toml` | 本地部署覆盖配置 | 否（.gitignore） |
| `.github/workflows/sync-to-d1.yml` | 早期 Markdown → D1 同步流程 | 是，但已失效（见 `CLAUDE.md` §9） |
