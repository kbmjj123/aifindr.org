# GitHub OAuth 登录实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 GitHub OAuth 登录，支持用户身份识别、邮箱采集，并关联工具提交者。

**Architecture:** Worker 处理全部 OAuth 流程和 JWT 签发，前端 useAuth composable 管理 token 和状态，D1 users 表存储用户信息。

**Tech Stack:** Cloudflare Workers + D1 + Web Crypto API (HMAC-SHA256)

---

### Task 1: D1 Schema — users 表 + tools.submitter_id

**Files:**
- Modify: `schema/init.sql`

- [ ] **Step 1: Add users table to init.sql**

在 `tool_videos` 表之后追加 users 表和索引：

```sql
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id       INTEGER NOT NULL UNIQUE,
  username        TEXT NOT NULL,
  email           TEXT,
  avatar_url      TEXT,
  unsubscribed_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
```

- [ ] **Step 2: Add submitter_id column to tools table**

在 tools 表 `body` 字段后面加一行：
```sql
submitter_id   INTEGER REFERENCES users(id),
```

- [ ] **Step 3: Commit**

```bash
git add schema/init.sql
git commit -m "feat(schema): 添加 users 表和 tools.submitter_id"
```

---

### Task 2: Worker JWT 工具函数

**Files:**
- Modify: `workers/api.ts`

在 `slugify` 函数之后添加 JWT 工具函数。

- [ ] **Step 1: Add interface and helpers**

```typescript
interface JWTPayload {
  sub: number
  gh_id: number
  iat: number
  exp: number
}

async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + 604800 }

  const encoder = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const data = `${header}.${payloadB64}`

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${data}.${sigB64}`
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts

    // Verify signature
    const encoder = new TextEncoder()
    const data = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data))
    if (!valid) return null

    const payload: JWTPayload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}
```

- [ ] **Step 2: Add GITHUB_CLIENT_ID and JWT_SECRET to Env interface**

```typescript
interface Env {
  DB: D1Database
  CACHE: KVNamespace
  TURNSTILE_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
}
```

- [ ] **Step 3: Commit**

```bash
git add workers/api.ts
git commit -m "feat(worker): 添加 JWT 签名/验证工具函数"
```

---

### Task 3: Worker Auth 路由处理函数

**Files:**
- Modify: `workers/api.ts`

在 `submit` 路由之后添加 auth 路由匹配。在 `handleSubmit` 之后添加 auth handler 函数。

- [ ] **Step 1: Add auth route matching to main handler**

在 `api.ts` 的 `fetch` 方法中，`POST /api/submit` 路由之后、`return error('Not found', 404)` 之前添加：

```typescript
// GET /api/auth/github — redirect to GitHub OAuth
if (method === 'GET' && path === '/auth/github') {
  return handleAuthRedirect(url, env)
}

// GET /api/auth/callback — handle GitHub OAuth callback
if (method === 'GET' && path === '/auth/callback') {
  return handleAuthCallback(url, env)
}

// GET /api/auth/me — get current user info
if (method === 'GET' && path === '/auth/me') {
  return handleAuthMe(request, env)
}
```

- [ ] **Step 2: Add handler functions**

在 `handleSubmit` 之后添加：

```typescript
async function handleAuthRedirect(url: URL, env: Env) {
  const redirectUri = `${url.origin}/api/auth/callback`
  const ghUrl = new URL('https://github.com/login/oauth/authorize')
  ghUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
  ghUrl.searchParams.set('redirect_uri', redirectUri)
  ghUrl.searchParams.set('scope', 'read:user user:email')
  return Response.redirect(ghUrl.toString(), 302)
}

async function handleAuthCallback(url: URL, env: Env) {
  const code = url.searchParams.get('code')
  if (!code) return error('Missing code', 400)

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) return error('Failed to get access token', 400)
  const accessToken = tokenData.access_token

  // Fetch GitHub user
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const ghUser = await userRes.json() as { id: number; login: string; avatar_url: string }

  // Fetch primary email
  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[]
  const primaryEmail = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email || ''

  // Upsert user in D1
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const existing = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, email = ?, avatar_url = ?, updated_at = ? WHERE github_id = ?')
      .bind(ghUser.login, primaryEmail, ghUser.avatar_url, now, ghUser.id).run()
  } else {
    await env.DB.prepare('INSERT INTO users (github_id, username, email, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(ghUser.id, ghUser.login, primaryEmail, ghUser.avatar_url, now).run()
  }

  // Get user ID
  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(ghUser.id).first() as { id: number }

  // Sign JWT
  const jwt = await signJWT({ sub: user.id, gh_id: ghUser.id }, env.JWT_SECRET)

  // Redirect back to frontend with token
  const frontendUrl = new URL(url.origin)
  frontendUrl.searchParams.set('token', jwt)
  return Response.redirect(frontendUrl.toString(), 302)
}

async function handleAuthMe(request: Request, env: Env) {
  const token = getTokenFromRequest(request)
  if (!token) return error('Unauthorized', 401)

  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload) return error('Invalid or expired token', 401)

  const user = await env.DB.prepare('SELECT id, username, email, avatar_url FROM users WHERE id = ?').bind(payload.sub).first()
  if (!user) return error('User not found', 404)

  return json(user)
}
```

- [ ] **Step 3: Commit**

```bash
git add workers/api.ts
git commit -m "feat(worker): 添加 GitHub OAuth 登录流程路由"
```

---

### Task 4: useAuth Composable

**Files:**
- Create: `composables/useAuth.ts`

- [ ] **Step 1: Create useAuth composable**

```typescript
import type { User } from '~/types/tool'

export interface AuthUser {
  id: number
  username: string
  email?: string
  avatar_url?: string
}

export const useAuth = () => {
  const token = useCookie<string | null>('aifindr-token', { maxAge: 604800 })
  const user = ref<AuthUser | null>(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!token.value)

  async function fetchUser() {
    if (!token.value) {
      loading.value = false
      return
    }
    try {
      const data = await $fetch<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = data
    } catch {
      token.value = null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function login() {
    window.location.href = '/api/auth/github'
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/')
  }

  /** Handle token from URL (?token=xxx) after OAuth callback */
  function handleUrlToken() {
    if (import.meta.client) {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (urlToken) {
        token.value = urlToken
        window.history.replaceState({}, '', window.location.pathname)
        fetchUser()
      }
    }
  }

  return { token, user, loading, isLoggedIn, login, logout, fetchUser, handleUrlToken }
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useAuth.ts
git commit -m "feat(auth): 添加 useAuth composable"
```

---

### Task 5: AuthButton 组件

**Files:**
- Create: `components/layout/AuthButton.vue`

- [ ] **Step 1: Create AuthButton component**

```vue
<template>
  <div v-if="!loading" class="flex items-center">
    <!-- Logged in: avatar + dropdown -->
    <div v-if="isLoggedIn && user" class="relative" @click.stop>
      <button class="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="dropdownOpen = !dropdownOpen">
        <div class="w-6 h-6 rounded-full flex items-center justify-center font-sans font-bold text-[10px]"
          :style="{ background: 'var(--color-accent)', color: '#000' }">
          {{ user.username[0].toUpperCase() }}
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div v-if="dropdownOpen" class="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg z-50"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-modal)' }"
        @click="dropdownOpen = false">
        <div class="px-3 py-2 font-body text-[11px] truncate" :style="{ color: 'var(--color-text-muted)' }">
          {{ user.email || user.username }}
        </div>
        <div :style="{ borderTop: '1px solid var(--color-border)' }" />
        <button class="w-full text-left px-3 py-2 font-body text-[12px] transition-colors"
          :style="{ color: 'var(--color-text-secondary)' }"
          @click="logout">Sign Out</button>
      </div>
    </div>

    <!-- Not logged in: sign in button -->
    <button v-else class="flex items-center gap-1.5 h-7 px-2.5 rounded-md font-body text-[11px] transition-colors"
      :style="{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }"
      @click="login">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      Sign in
    </button>
  </div>
</template>

<script setup lang="ts">
const { user, isLoggedIn, loading, login, logout } = useAuth()
const dropdownOpen = ref(false)

// Close dropdown on outside click
if (import.meta.client) {
  document.addEventListener('click', () => { dropdownOpen.value = false })
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/AuthButton.vue
git commit -m "feat(auth): 添加 AuthButton 登录按钮和下拉菜单"
```

---

### Task 6: AppHeader 集成 AuthButton

**Files:**
- Modify: `components/layout/AppHeader.vue`

- [ ] **Step 1: Add AuthButton to header**

在 `ThemeToggle` 之前插入 AuthButton：

```diff
       <div class="flex items-center gap-2 ml-auto">
+        <AuthButton />
         <NuxtLink to="/submit" class="btn-header-submit">
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/AppHeader.vue
git commit -m "feat(header): 导航栏集成 AuthButton"
```

---

### Task 7: app.vue 处理 URL Token

**Files:**
- Modify: `app.vue`

- [ ] **Step 1: Add token handling + fetchUser on mount**

在 `app.vue` 的 `<script setup>` 中添加：

```typescript
const { handleUrlToken, fetchUser } = useAuth()

onMounted(() => {
  handleUrlToken()
  fetchUser()
})
```

- [ ] **Step 2: Commit**

```bash
git add app.vue
git commit -m "feat(auth): app.vue 处理 OAuth 回调 token"
```

---

### Task 8: 提交表单集成 Auth

**Files:**
- Modify: `components/submit/SubmitForm.vue`

- [ ] **Step 1: 已登录时自动填充 submitter 信息**

在 `<script setup>` 中 `onMounted` 之前添加：

```typescript
const { user, isLoggedIn } = useAuth()

// Auto-fill submitter info when logged in
watchEffect(() => {
  if (user.value) {
    if (!form.submitterGithub) form.submitterGithub = user.value.username
  }
})
```

在表单提交 payload 中添加 `submitter_id`（Worker 端处理）：

在 `handleSubmit` 的 `body` 中增加：
```typescript
submitter_id: isLoggedIn.value ? user.value?.id : undefined,
```

- [ ] **Step 2: Commit**

```bash
git add components/submit/SubmitForm.vue
git commit -m "feat(submit): 登录用户自动填充 submitter 信息"
```

---

### Task 9: Worker Submit Handler 关联 submitter_id

**Files:**
- Modify: `workers/api.ts`

- [ ] **Step 1: 从 JWT 提取 submitter_id**

在 `handleSubmit` 的开头，解析 JWT 获取用户 ID：

```typescript
async function handleSubmit(request: Request, env: Env) {
  // ── Extract authenticated user ──
  let submitterId: number | null = null
  const token = getTokenFromRequest(request)
  if (token) {
    const payload = await verifyJWT(token, env.JWT_SECRET)
    if (payload) submitterId = payload.sub
  }
```

然后在 INSERT 中将 `submitterId` 写入 `submitter_id` 字段：

```sql
INSERT INTO tools (..., submitter_id, ...) VALUES (..., ?, ...)
```

- [ ] **Step 2: Commit**

```bash
git add workers/api.ts
git commit -m "feat(worker): 提交表单关联登录用户 submitter_id"
```

---

### Task 10: 本地开发配置

**Files:**
- Modify: `.dev.vars`

- [ ] **Step 1: 确认环境变量完整**

`.dev.vars` 应包含：
```
TURNSTILE_SECRET=0x4AAAAAADLaTZ6nhzkwRkpcqMgkr73-yWc
GITHUB_CLIENT_ID=Ov23lioNhw0LD6MXeMFJ
GITHUB_CLIENT_SECRET=9deb1c1d6123320ebeac7ad575b15c60b7e9e43e
JWT_SECRET=<用户已填入>
```

- [ ] **Step 2: 重建本地 D1 数据库**

```bash
npx wrangler d1 execute aifindr-db --file=./schema/init.sql
npx wrangler d1 execute aifindr-db --file=./schema/seed.sql
```

- [ ] **Step 3: 重启测试**

```bash
rm -rf .nuxt
# 终端1: npx wrangler dev
# 终端2: pnpm dev
```

测试流程：
1. 访问 `http://localhost:3000` → 导航栏显示 "Sign in" 按钮
2. 点击 Sign in → 跳转 GitHub 授权页
3. 授权后 → 回到前端，右上角显示头像首字母
4. 点击头像 → 下拉菜单显示邮箱和 Sign Out
5. 访问 `/submit` → GitHub 用户名自动填充
6. `curl localhost:8787/api/auth/me` 带 token 返回用户信息

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: 本地开发环境配置完成"
```
