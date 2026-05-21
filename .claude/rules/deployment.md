# Rules: Deployment & Worker API

> 适用：部署 Worker、配置 Cloudflare 资源、本地 API 开发时读取本文件

---

## 一、架构总览

```
Cloudflare
├── Pages                     ← Nuxt SSG/ISR 静态站点 + Pages Functions
│   └── aifindr.org           ← 域名
│
└── Workers                   ← API 后端（独立部署）
    └── aifindr-api           ← workers/api.ts
        ├── GET  /api/tools              工具列表
        ├── GET  /api/tools/:cat/:slug   工具详情
        ├── GET  /api/tools/search       搜索
        ├── GET  /api/stats              统计
        ├── POST /api/click/:id          记录点击
        └── POST /api/submit             表单提交
```

**关键约定：**
- 所有 `/api/*` 请求由独立 Worker 处理，Pages 不做 API 路由
- Worker 通过 Cloudflare 路由规则接收 `aifindr.org/api/*` 请求
- 页面通过 `useFetch('/api/...')` 调用 Worker（同域请求）

---

## 二、前置条件

| 资源 | 说明 | 获取方式 |
|------|------|---------|
| Cloudflare 账号 | 需要已添加域名 | https://dash.cloudflare.com |
| D1 数据库 | 存储工具元数据 | `wrangler d1 create aifindr-db` |
| KV Namespace | 缓存高频查询 | `wrangler kv:namespace create CACHE` |
| Turnstile 密钥 | 表单防垃圾 | Cloudflare Dashboard → Turnstile → 添加站点 |

---

## 三、本地环境准备

### 3.1 复制环境变量模板

```bash
cp .dev.vars .dev.vars.local
# 编辑 .dev.vars.local，填入真实 Turnstile Secret Key
# .dev.vars 文件已被 .gitignore 排除，不会误提交
```

### 3.2 创建 D1 表结构

通过浏览器工具或 wrangler 执行 SQL：

```bash
# 方式一：执行 SQL 文件
wrangler d1 execute aifindr-db --file=./schema/init.sql

# 方式二：交互式执行
wrangler d1 execute aifindr-db --command="CREATE TABLE tools (← 粘贴完整建表语句)"
```

建表 SQL 参考 `@.claude/rules/product-scope.md` → 五、数据结构 → 5.2 D1 表结构。

### 3.3 填充初始数据

```bash
# 本地开发时，可通过 POST /api/submit 插入测试数据
# 或直接在 D1 中执行 INSERT 语句
wrangler d1 execute aifindr-db --command="INSERT INTO tools ..."
```

---

## 四、本地开发

### 4.1 启动 Worker

```bash
# 启动本地 Worker（默认 http://localhost:8787）
wrangler dev

# 指定端口
wrangler dev --port 8787
```

### 4.2 启动 Nuxt 开发服务器

```bash
# 新开终端
pnpm dev
```

### 4.3 调用 API 测试

```bash
# 工具列表
curl http://localhost:8787/api/tools

# 工具详情
curl http://localhost:8787/api/tools/image/midjourney

# 搜索
curl http://localhost:8787/api/tools/search?q=midjourney

# 统计
curl http://localhost:8787/api/stats

# 提交表单
curl -X POST http://localhost:8787/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tool",
    "website": "https://example.com",
    "category": "image",
    "pricing": "free",
    "description": "A test tool.",
    "turnstileToken": "1x00000000000000000000"   ← Turnstile 测试 token
  }'
```

> Turnstile 测试 token `1x00000000000000000000` 始终通过验证，可在本地开发使用。

---

## 五、生产部署

### 5.1 设置生产密钥

```bash
# Turnstile Secret（只在 Cloudflare 服务端存储，不进代码）
wrangler secret put TURNSTILE_SECRET
# → 粘贴从 Cloudflare Dashboard 获取的 Secret Key
```

### 5.2 配置 D1 和 KV ID

编辑 `wrangler.toml`，填入真实 ID：

```toml
# wrangler d1 create aifindr-db 后查看输出
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# wrangler kv:namespace create CACHE 后查看输出
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> **注意：** 这两个 ID 是资源标识符而非密钥，可以提交到 git。
> 如果不希望公开，可保留为空，部署时用环境变量或 CI 注入。

### 5.3 部署 Worker

```bash
# 部署到 Cloudflare
wrangler deploy

# 验证部署
curl https://aifindr.org/api/stats
```

### 5.4 配置路由规则

确保 Worker 能接收到 `aifindr.org/api/*` 的请求：

```toml
# wrangler.toml
routes = [
  { pattern = "aifindr.org/api/*", zone_id = "你的zone_id" }
]
```

`zone_id` 在 Cloudflare Dashboard → 域名概览页面右侧获取。

### 5.5 Nuxt Pages 屏蔽 API 路由

在 `nuxt.config.ts` 中确保 Pages 不尝试处理 `/api/*`：

```ts
routeRules: {
  '/api/**': { cors: true },
}
```

Cloudflare Pages 自动生成 `_routes.json`，不在 Pages 路由中的路径会回退到 Worker。

---

## 六、API 路由参考

| 方法 | 路径 | 参数 | 响应 | 说明 |
|------|------|------|------|------|
| `GET` | `/api/tools` | `?category=image` `?pricing=free,freemium` `?platform=web` `?tags=ai,chat` `?sort=latest\|trending\|featured` `?page=1` `?pageSize=24` | `{ tools, total, page, pageSize }` | 工具列表，支持多条件筛选和分页 |
| `GET` | `/api/tools/:category/:slug` | — | `{ tool + tags + images + videos }` | 工具详情，联表查询完整数据 |
| `GET` | `/api/tools/search` | `?q=keyword` `?page=1` `?pageSize=20` | `{ tools, query, total, page, pageSize }` | 全文搜索（name + description + tags） |
| `GET` | `/api/stats` | — | `{ tools, categories, contributors }` | 站点统计，KV 缓存 1 小时 |
| `POST` | `/api/click/:id` | — | `{ success: true }` | 递增工具点击量 |
| `POST` | `/api/submit` | `{ name, website, category, pricing, description, turnstileToken, ... }` | `{ success, slug }` | 提交新工具（pending 状态） |
| `GET` | `/api/auth/github` | — | 302 跳转 GitHub | GitHub OAuth 授权入口 |
| `GET` | `/api/auth/callback` | `?code=...&state=...` | 302 跳转前端 `?token=jwt` | GitHub OAuth 回调，签发 JWT |
| `GET` | `/api/auth/me` | — (Cookie `aifindr-token`) | `{ id, username, email, avatar_url }` | 获取当前登录用户信息 |
| `GET` | `/api/auth/dev-login` | — | 302 跳转 `localhost:3000?token=jwt` | 本地开发 mock 登录 |
| `GET` | `/api/admin/pending` | `?page=1&pageSize=20` | `{ tools, total, page, pageSize }` | 列出待审核工具（需管理员 JWT） |
| `POST` | `/api/admin/review` | `{ tool_id, status, reject_reason?, reviewer_note? }` | `{ success, tool }` | 审核通过/拒绝工具（需管理员 JWT） |

### 筛选参数详解

| 参数 | 示例 | 说明 |
|------|------|------|
| `category` | `image` | 单分类筛选 |
| `pricing` | `free,freemium` | 多定价，逗号分隔 |
| `platform` | `web` | 单平台筛选（LIKE %platform%） |
| `tags` | `ai,chat` | 多标签，需联表 `tool_tags` 查询 |
| `sort` | `trending` | `latest`(默认) / `trending`(按点击) / `featured`(精选优先) |
| `page` | `1` | 页码，从 1 开始 |
| `pageSize` | `24` | 每页条数，上限 100 |

### 错误响应格式

```json
{
  "error": "描述信息",
  "code": "ERROR_CODE"    // 可选，用于程序化处理
}
```

常见错误码：`MISSING_FIELDS` `INVALID_PRICING` `INVALID_CATEGORY` `CAPTCHA_FAILED` `INVALID_NAME` `INVALID_TOOL_ID` `INVALID_STATUS` `ALREADY_REVIEWED` `MISSING_REJECT_REASON`

---

## 七、常见问题

### Q: `wrangler dev` 连接 D1 失败？
确保已执行 `wrangler d1 create aifindr-db` 并在 `wrangler.toml` 中填入正确的 `database_id`。

### Q: 本地开发时前端页面 404？
`pnpm dev` 启动 Nuxt 开发服务器（默认 3000 端口），`wrangler dev` 启动 API Worker（默认 8787 端口）。
前端页面中 `useFetch('/api/...')` 在开发环境下默认请求 Nuxt 开发服务器。需要配置代理：

```ts
// nuxt.config.ts
nitro: {
  devProxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true,
    },
  },
},
```

或者在 Vite 中配置：

```ts
vite: {
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
},
```

### Q: 部署后 API 返回 404？
检查 `wrangler.toml` 中的 `routes` 配置和 `zone_id` 是否正确。
确认 Worker 已成功部署到正确的域名。

### Q: Turnstile 验证失败？
- 本地开发使用测试 token `1x00000000000000000000`
- 生产环境确保 `wrangler secret put TURNSTILE_SECRET` 已执行
- 确认 Turnstile 站点密钥与域名匹配

---

## 八、Worker 环境变量清单

| 变量 | 用途 | 存储方式 |
|------|------|---------|
| `TURNSTILE_SECRET` | Turnstile 验证密钥 | `wrangler secret put`（生产）/ `.dev.vars`（本地） |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `wrangler.toml [vars]` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | `wrangler secret put`（生产）/ `.dev.vars`（本地） |
| `JWT_SECRET` | JWT 签名密钥（32 字符+） | `wrangler secret put`（生产）/ `.dev.vars`（本地） |
| `ADMIN_GITHUB_IDS` | 管理员 GitHub ID，逗号分隔 | `wrangler.toml [vars]` |
| `RESEND_API_KEY` | Resend 邮件服务 API Key（v1.1） | `wrangler secret put` |

## 九、相关文件索引

| 文件 | 作用 | 是否提交 |
|------|------|---------|
| `workers/api.ts` | Worker 源码，处理全部 `/api/*` 路由 | ✅ 提交 |
| `wrangler.toml` | Worker 部署配置（D1/KV 绑定、路由、环境变量） | ✅ 提交 |
| `.dev.vars` | 本地环境变量（密钥） | ❌ .gitignore 排除 |
| `.github/workflows/sync-to-d1.yml` | CI：Markdown 变更自动同步 D1 | ✅ 提交 |
| `schema/init.sql` | D1 建表 + 迁移语句 | ✅ 提交 |
| `scripts/sync-to-d1.js` | Markdown → SQL 生成脚本 | ✅ 提交 |
| `.wrangler/` | wrangler 缓存/认证信息 | ❌ .gitignore 排除 |
