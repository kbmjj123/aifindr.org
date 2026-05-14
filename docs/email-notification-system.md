# aifindr.org 邮件通知系统 · 子产品说明书

> 版本：v1.1
> 归属项目：aifindr.org
> 文档类型：子产品说明书（Sub-Product Spec）
> 最后更新：2026-05-14

---

## 一、概述

### 1.1 定位

邮件通知系统是 aifindr.org 的基础服务模块，负责覆盖用户全生命周期内所有需要触达的通知场景，包括：提交流程反馈、审核结果告知、付费确认、反链效果追踪、运营推送等。

系统采用**双渠道分离架构**：
- **Resend**：负责所有由用户行为触发的事务型邮件（实时性要求高）
- **Brevo**：负责批量营销邮件和周期性报告（量大、非实时）

### 1.2 设计原则

- **免费优先**：MVP 及早期阶段全部在免费额度内运行，不产生额外费用
- **渐进开启**：按版本迭代逐步开启各场景，避免过度建设
- **场景完整**：预先设计全量场景清单，便于后续迭代时按需补充

---

## 二、技术选型

### 2.1 双渠道说明

| 维度 | Resend | Brevo |
|------|--------|-------|
| 定位 | 事务型邮件（Transactional） | 营销型邮件（Marketing） |
| 免费额度 | 3,000 封/月，100 封/天 | 300 封/天（月累计约 9,000 封） |
| 日限制 | 100 封/天 | 300 封/天 |
| 品牌水印 | 无 | 免费版强制显示 "Sent with Brevo" |
| 日志保留 | 免费版仅 1 天 | 付费版 90 天 |
| 适用场景 | 审核通知、提交确认、付款确认 | Newsletter、月报、公告 |
| 接入方式 | REST API / SDK | REST API / SMTP |
| 开发体验 | 极佳，React Email 一流 | 良好，模板编辑器完善 |

### 2.2 Cloudflare Workers Cron Triggers

定时任务统一使用 Cloudflare Workers Cron Triggers，**完全免费**，无额外费用。

| 计划 | Cron 数量上限 | 说明 |
|------|-------------|------|
| 免费计划 | 5 个/账号 | 满足本项目全部定时需求 |
| 付费计划 | 250 个/账号 | 备用，暂无需升级 |

---

## 三、当前项目状态

### 3.1 已实现的认证基础设施

GitHub OAuth 授权登录已在 `develop` 分支实现，关键组件：

| 组件 | 文件 | 说明 |
|------|------|------|
| Worker Auth 路由 | `workers/api.ts` | `/api/auth/github`, `/api/auth/callback`, `/api/auth/me`, `/api/auth/dev-login` |
| JWT 工具 | `workers/api.ts` | `signJWT()` / `verifyJWT()` — HMAC-SHA256，7 天有效期 |
| 前端状态管理 | `composables/useAuth.ts` | token 存 cookie `aifindr-token`，`login()` / `logout()` / `fetchUser()` |
| UI 组件 | `components/layout/AuthButton.vue` | 登录按钮 + 头像下拉菜单 |
| 表单集成 | `components/submit/SubmitForm.vue` | 已登录用户自动填充 GitHub 用户名，提交时带 `submitter_id` |

### 3.2 现有 D1 表结构

`users` 表（`schema/init.sql` 中定义，已建表）：

```sql
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id       INTEGER NOT NULL UNIQUE,    -- GitHub 用户 ID（数字）
  username        TEXT NOT NULL,              -- GitHub 用户名
  email           TEXT,                       -- GitHub 公开邮箱（可能为 noreply）
  avatar_url      TEXT,
  unsubscribed_at TEXT,                       -- 退订时间
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
```

`tools` 表中已有字段：
- `submitter_id INTEGER REFERENCES users(id)` — 关联提交者
- `submitter_site TEXT` — 提交者网站（dofollow 外链）
- `submitter_github TEXT` — GitHub 用户名

### 3.3 Worker Env 接口（当前）

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

### 3.4 现有 API 路由

```
GET  /api/tools                   工具列表（筛选/排序/分页）
GET  /api/tools/search            全文搜索
GET  /api/stats                   站点统计（KV 缓存 1h）
GET  /api/tools/:category/:slug   工具详情（含 images + videos）
POST /api/click/:id               记录点击
POST /api/submit                  表单提交（Turnstile 验证）
GET  /api/auth/github             GitHub OAuth 跳转
GET  /api/auth/callback           GitHub OAuth 回调
GET  /api/auth/me                 获取当前用户信息
GET  /api/auth/dev-login          本地开发 mock 登录
```

---

## 四、需要新增的 D1 迁移

### 4.1 users 表 — ALTER（增量）

当前 `users` 表已存在，需新增以下字段来支持邮件系统：

```sql
-- 联系邮箱（用户手动填写，用于接收通知）
ALTER TABLE users ADD COLUMN contact_email TEXT;

-- 邮箱验证状态
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;

-- 是否接收邮件通知
ALTER TABLE users ADD COLUMN email_notify INTEGER DEFAULT 1;

-- 最后登录时间
ALTER TABLE users ADD COLUMN last_login_at TEXT;

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_contact_email ON users(contact_email);
```

> **为什么拆分 email 字段：** 当前 `users.email` 存的是 GitHub 公开邮箱，可能是 `noreply.github.com` 私密地址。`contact_email` 用于接收真实通知邮件。

### 4.2 tools 表 — ALTER（增量）

```sql
-- 审核拒绝原因（枚举：info_incomplete / not_qualified / duplicate / other）
ALTER TABLE tools ADD COLUMN reject_reason TEXT;

-- 管理员审核备注
ALTER TABLE tools ADD COLUMN reviewer_note TEXT;

-- 审核时间
ALTER TABLE tools ADD COLUMN reviewed_at TEXT;
```

> `tools.submitter_id` 字段已存在（INTEGER REFERENCES users(id)），**无需重命名为 `submitter_uid`**。

### 4.3 email_logs 表 — CREATE（新增）

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id    TEXT    NOT NULL,               -- 场景编号，如 "B-03"
  recipient   TEXT    NOT NULL,               -- 收件人邮箱
  subject     TEXT    NOT NULL,
  status      TEXT    DEFAULT 'sent'
              CHECK(status IN ('sent','failed','bounced')),
  resend_id   TEXT,                           -- Resend 返回的 message id
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_logs_scene    ON email_logs(scene_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created  ON email_logs(created_at DESC);
```

### 4.4 Worker Env 接口 — 新增绑定

```typescript
interface Env {
  // ... 现有字段
  RESEND_API_KEY: string     // Resend API Key
  LEMONSQUEEZY_WEBHOOK_SECRET: string  // Lemon Squeezy Webhook 签名密钥（v1.3）
}
```

> `wrangler.toml [vars]` 和 `.dev.vars` 中需同步添加 `RESEND_API_KEY`。

---

## 五、邮箱获取策略

### 5.1 获取流程

```
GitHub OAuth 登录
  ↓
读取 GitHub 公开邮箱 → 存入 users.email
  ↓
检测邮箱类型：
  → 正常邮箱（非 noreply）→ 直接用于通知
  → 私密邮箱（*.noreply.github.com）或为空
      ↓
      触发场景 A-01：引导用户在设置页填写 contact_email
      ↓
      contact_email 存入 D1，email_verified = 0
      ↓
      后续所有通知优先使用 contact_email，其次 users.email
```

### 5.2 邮箱选择逻辑（Worker 中实现）

```typescript
function getNotifyEmail(user: Record<string, unknown>): string | null {
  // 优先使用用户手动填写的联系邮箱
  if (user.contact_email && user.email_verified) {
    return user.contact_email as string
  }
  // 其次使用 GitHub 公开邮箱（排除 noreply）
  const githubEmail = user.email as string
  if (githubEmail && !githubEmail.includes('noreply.github.com')) {
    return githubEmail
  }
  // 都没有 → 需要引导用户填写
  return null
}
```

---

## 六、新 API 路由（按版本实现）

### 6.1 MVP 需实现（v1.0）

```
POST /api/user/email               用户更新联系邮箱
POST /api/admin/review             管理员审核操作（触发 B-03 / B-04）
```

### 6.2 后续版本

```
GET   /api/user/email/verify/:token   邮箱验证（v1.1）
POST  /api/webhooks/github            接收 GitHub PR 合并事件（B-05，v1.1）
POST  /api/webhooks/lemonsqueezy      接收 LS 支付 Webhook（v1.3）
```

**Lemon Squeezy Webhook 接入说明：**

```
接收端点：POST /api/webhooks/lemonsqueezy
验证方式：X-Signature 签名校验（HMAC-SHA256）
需处理事件：
  - order_created                   → 触发 C-01 / C-03 / C-05
  - order_refunded                  → 触发 C-06
  - subscription_payment_failed     → 触发 C-06
幂等策略：用 LS event_id 查 email_logs 去重
```

---

## 七、定时任务规划（Cron Triggers）

共使用 **4 个** Cron，剩余 1 个备用。

| Cron # | 路由 | 表达式 | 执行时间 | 任务 |
|--------|------|--------|---------|------|
| Cron 1 | `/api/cron/daily-ops` | `0 9 * * *` | 每天 09:00 UTC | ① 检查超 7 天未审核提交 → 发管理员提醒 ② 刷新 KV 缓存 |
| Cron 2 | `/api/cron/link-checker` | `0 3 * * *` | 每天 03:00 UTC | 检查 published_links 反链是否失效 → 发告警 |
| Cron 3 | `/api/cron/monthly-report` | `0 8 1 * *` | 每月 1 日 08:00 UTC | 生成反链效果报告 → Brevo 发送 |
| Cron 4 | `/api/cron/reserved` | 待定 | 待定 | Newsletter 定时触发 / 其他运营任务 |

> **实现方式：** 在 `workers/api.ts` 主 handler 中新增 4 条路由匹配。每个 Cron 触发后顺序执行内部任务，无需拆分多个 Worker 文件。
> `wrangler.toml` 中需配置 `[triggers]` 段。

---

## 八、邮件场景全量清单

### 优先级说明

- 🔴 MVP：上线必须实现（A-01, B-01 ~ B-04）
- 🟡 重要：v1.1 ~ v1.3 实现
- 🟢 计划：v1.4 及以后

---

### A 类：账号与登录

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| A-01 | 邮箱为私密/noreply，引导填写联系邮箱 | 用户 | GitHub 登录后检测邮箱类型 | Resend | 否 | 🔴 MVP |

**A-01 内容要点：** 说明为何需要邮箱（接收审核结果、外链通知），提供快捷链接直达设置页，非强制引导语气。

---

### B 类：工具提交流程

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| B-01 | 在线表单提交成功确认 | 提交者 | 表单写入 D1（status=pending）| Resend | 否 | 🔴 MVP |
| B-02 | 管理员收到新提交通知 | 管理员 | 同 B-01 | Resend | 否 | 🔴 MVP |
| B-03 | 审核通过通知（含三条外链） | 提交者 | 管理员将 status 改为 active | Resend | 否 | 🔴 MVP |
| B-04 | 审核拒绝通知（含原因+建议） | 提交者 | 管理员将 status 改为 rejected | Resend | 否 | 🔴 MVP |
| B-05 | GitHub PR 合并后上线通知 | 提交者 | Webhook 检测 PR 合并 | Resend | 否 | 🟡 v1.1 |
| B-06 | 提交内容需要补充资料通知 | 提交者 | 管理员标记 needs_info | Resend | 否 | 🟡 v1.1 |
| B-07 | 超 7 天未审核提醒 | 管理员 | Cron 1 每日检查 | Resend | ✅ Cron 1 | 🟡 v1.1 |

**B-01 内容要点：** 工具名称 + 网站 URL + 预计审核时间（3-7 工作日）+ 付费加速入口 + 提交编号。

**B-03 内容要点（核心）：** 恭喜上线 + 三条外链逐一列出（github.com DA 100 / aifindr.org 详情页 / 贡献者页）+ 引导分享 + 引导查看 Featured 置顶。

**B-04 内容要点：** 拒绝原因（info_incomplete / not_qualified / duplicate / other）+ 修改建议 + 重新提交入口。

---

### C 类：付费功能（Lemon Squeezy）

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| C-01 | Featured 购买成功确认 | 付费者 | LS Webhook: order_created | Resend | 否 | 🟡 v1.3 |
| C-02 | Featured 已生效通知 | 付费者 | 管理员操作生效 | Resend | 否 | 🟡 v1.3 |
| C-03 | 加速审核购买成功确认 | 付费者 | LS Webhook: order_created | Resend | 否 | 🟡 v1.3 |
| C-04 | 加速审核已完成通知 | 付费者 | 审核结果出来（复用 B-03/B-04） | Resend | 否 | 🟡 v1.3 |
| C-05 | Verified 认证购买成功确认 | 付费者 | LS Webhook: order_created | Resend | 否 | 🟡 v1.3 |
| C-06 | 支付失败通知 | 付费者 | LS Webhook: refunded / payment_failed | Resend | 否 | 🟡 v1.3 |

---

### D 类：AI 文章生成

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| D-01 | 文章生成完成通知 | 用户 | Claude API 任务完成 | Resend | 否 | 🟢 v1.4 |
| D-02 | 免费生成次数用完提醒 | 用户 | 当月第 3 次生成后 | Resend | 否 | 🟢 v1.4 |
| D-03 | 文章生成失败通知 | 用户 | Claude API 调用失败/超时 | Resend | 否 | 🟢 v1.4 |

---

### E 类：反链追踪

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| E-01 | 已发布反链失效告警 | 用户 | Cron 2 检测到 is_active=0 | Resend | ✅ Cron 2 | 🟢 v2.0 |
| E-02 | 每月反链效果报告 | 付费用户 | Cron 3 每月 1 日 | Brevo | ✅ Cron 3 | 🟢 v2.0 |

---

### F 类：运营 & 增长（Brevo 批量）

| # | 场景 | 收件人 | 触发条件 | 渠道 | 定时 | 优先级 |
|---|------|--------|---------|------|------|--------|
| F-01 | Newsletter | 订阅用户 | 手动 / Cron 4 | Brevo | ✅ Cron 4 | 🟢 v2.0 |
| F-02 | 新工具上线定向通知 | 同类关注者 | 工具上线 + 分类匹配 | Brevo | 否 | 🟢 v2.0 |
| F-03 | 站点重大更新公告 | 全体用户 | 手动触发 | Brevo | 否 | 🟢 v2.0 |

---

## 九、各版本实现范围与用量估算

| 版本 | 场景 | Resend 月用量 | Brevo | 新增依赖 |
|------|------|--------------|-------|---------|
| 🔴 MVP | A-01, B-01 ~ B-04 | < 600 封/月 | 不需要 | Resend API Key |
| 🟡 v1.1 | B-05 ~ B-07, 邮箱验证 | < 900 封/月 | 不需要 | GitHub Webhook |
| 🟡 v1.3 | C-01 ~ C-06 | < 1,500 封/月 | 不需要 | Lemon Squeezy |
| 🟢 v1.4 | D-01 ~ D-03 | 视生成量 | 不需要 | Claude API（已有规划） |
| 🟢 v2.0 | E-01 ~ F-03 | 视用户量 | 开始使用 | Brevo 账号 |

> Resend 免费额度 3,000 封/月，可覆盖到日 UV 500+ 的全部阶段。Brevo 在 v2.0 前无需开通。

---

## 十、风险与注意事项

| 风险 | 等级 | 应对 |
|------|------|------|
| Resend 免费版日志仅保留 1 天 | 中 | 所有发送记录写入 D1 `email_logs` 表，自建追踪 |
| Brevo 免费版带品牌水印 | 低 | v2.0 前不使用 Brevo；正式启用时升级 Starter（$9/月） |
| GitHub noreply 邮箱导致通知无法送达 | 中 | 登录后强引导填写 `contact_email`（A-01），关键操作前二次提示 |
| Lemon Squeezy Webhook 重复触发 | 中 | 用 event_id 做幂等校验，查 email_logs 去重 |
| Cron 免费版每账号仅 5 个 | 低 | 当前用 4 个，合并轻量任务到同一路由 |
| `wrangler.toml` 中 TURNSTILE_SECRET 已提交 | **高** | 需在 Cloudflare 中重置 Secret，改为 `wrangler secret put` |

---

## 十一、相关文件索引

| 文件 | 作用 | 说明 |
|------|------|------|
| `workers/api.ts` | Worker 主文件，mail 路由在此新增 | 已有 10 条路由 |
| `schema/init.sql` | D1 建表语句 | `users` 表已建，需 ALTER |
| `wrangler.toml` | Worker 部署配置 | 需添加 `[triggers]` 段的 cron 配置 |
| `.dev.vars` | 本地环境变量 | 需添加 `RESEND_API_KEY` |
| `composables/useAuth.ts` | 前端认证状态管理 | 已实现，邮件系统复用 |
| `components/submit/SubmitForm.vue` | 表单提交组件 | 已集成 auth |

---

## 十二、版本变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-05 | 初始版本（原始说明书） |
| v1.1 | 2026-05-14 | 对齐现有代码：users 表字段名、github_id 类型、API 路由清单；增补当前基础设施状态章节；修正 email_logs 建表语句；标注 TURNSTILE_SECRET 泄露风险 |
