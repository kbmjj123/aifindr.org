# GitHub OAuth 登录系统设计

> 日期：2026-05-11
> 状态：待实现

## 1. 概述

为 aifindr.org 实现 GitHub OAuth 登录，支持用户身份识别、邮箱采集、以及后续的流量追踪和邮件推送功能。

## 2. 架构

```
用户 → 点击 "Sign in with GitHub"
     → 302 到 github.com/login/oauth/authorize
     → GitHub 授权后回调 /api/auth/callback?code=xxx
     → Worker 用 code 换 access_token
     → 查 GitHub API 获取用户信息 + 邮箱
     → 写入/更新 D1 users 表
     → 签发 JWT，302 重定向到前端带 token
     → 前端存 JWT，后续请求带 Authorization header
```

## 3. 数据表

### users（新建）

```sql
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id       INTEGER NOT NULL UNIQUE,
  username        TEXT NOT NULL,
  email           TEXT,
  avatar_url      TEXT,
  unsubscribed_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX idx_users_github_id ON users(github_id);
```

### tools（加字段）

```sql
ALTER TABLE tools ADD COLUMN submitter_id INTEGER REFERENCES users(id);
```

## 4. Worker API 端点

所有 auth 路由在 `workers/api.ts` 中通过 path 分发处理。

### GET /api/auth/github

302 跳转到 `https://github.com/login/oauth/authorize`，参数：
- `client_id`
- `redirect_uri`: `{origin}/api/auth/callback`
- `scope`: `read:user user:email`
- `state`: 随机字符串（存在 cookie 中防 CSRF）

### GET /api/auth/callback

1. 验证 state
2. 用 code 换 access_token（POST github.com/login/oauth/access_token）
3. 用 access_token 查 GitHub API：`/user` 和 `/user/emails`
4. 取 primary 邮箱
5. UPSERT 到 D1 users 表
6. 用 JWT_SECRET 签发 JWT（HS256，有效期 7 天）
7. 302 重定向到 `{origin}/?token={jwt}`

> token 通过 URL 参数传递而非直接 Set-Cookie，是因为开发环境下前端（:3000）和 Worker（:8787）不同域，Cookie 无法跨域设置。前端收到 token 后由 `useAuth` composable 存入 cookie。

### GET /api/auth/me

1. 从 `Authorization: Bearer {token}` 提取 JWT
2. 验证签名和过期时间
3. 从 D1 查用户信息
4. 返回 `{ id, username, email, avatar_url }`

## 5. JWT 实现

使用 Web Crypto API（HMAC-SHA256），手动实现 sign 和 verify：

```typescript
// JWT 载荷
interface JWTPayload {
  sub: number        // users.id
  gh_id: number      // GitHub user ID
  iat: number        // 签发时间
  exp: number        // 过期时间（+7d）
}
```

sign: base64url(header).base64url(payload).base64url(signature)
verify: 解码 header+payload，重算签名对比，检查 exp

## 6. 前端实现

### composables/useAuth.ts

```typescript
// 状态
const token = useCookie<string | null>('aifindr-token', { maxAge: 604800 })
const user = ref<User | null>(null)

// 方法
login()       → 跳转 /api/auth/github
logout()      → 清除 token，跳转首页
fetchUser()   → GET /api/auth/me，更新 user
handleToken() → 检测 URL 中 ?token=xxx，存入 cookie，清除 URL 参数
isLoggedIn    → computed: !!token.value
```

### app.vue 中处理 token

在 `onMounted` 中调用 `handleToken()`，读取 `route.query.token`，存 cookie，清除 URL 参数。

### 组件

**AuthButton.vue** — 放在 AppHeader 右上角：
- 未登录：显示 "Sign in with GitHub" 按钮
- 已登录：显示用户头像 + 用户名下拉菜单（My Tools / Sign Out）

**处理 token URL 参数** — `app.vue` 或 `pages/index.vue` 中：
- 在 onMounted 检查 URL 是否有 `?token=xxx`
- 有则存到 cookie，清除 URL 参数，调用 fetchUser

## 7. 登录对提交流程的影响

- 提交表单时，如果已登录，自动从 JWT 读取 `submitter_github` 和 `submitter_site`，用户无需重复填写
- `POST /api/submit` 从 `Authorization` header 提取用户关联 `submitter_id`
- 未登录也可以提交，`submitter_github` 和 `submitter_id` 为空

## 8. 邮件订阅策略

- 注册即订阅（opt-out）
- `users.unsubscribed_at` 为 null 表示已订阅
- 每封邮件底部含 `Unsubscribe` 链接 → `POST /api/auth/unsubscribe`
- 后续邮件类型：周报、月度报告、审核通知

## 9. 安全考虑

- JWT Secret 通过 `wrangler secret put` 设置，不进代码仓库
- GitHub OAuth 使用 `state` 参数防 CSRF（存 KV 中验证）
- token 通过 URL 参数传入前端，前端存入 cookie（HttpOnly 方案开发环境不兼容）
- 前端收到 token 后立即清除 URL 中 `?token=xxx` 参数（`window.history.replaceState`），防止 token 泄露
- HTTPS 传输（生产环境强制）
- JWT 7 天过期，无 refresh token（MVP 阶段简化）

## 10. 环境变量

| 变量 | 来源 | 本地 | 生产 |
|------|------|------|------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App | `.dev.vars` | `wrangler.toml` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App | `.dev.vars` | `wrangler secret` |
| `JWT_SECRET` | 自生成 | `.dev.vars` | `wrangler secret` |
