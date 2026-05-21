# Rules: Product Scope & Data

> 读取时机：涉及功能逻辑、数据库操作、API 接口时

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

---

## 二、D1 数据库表结构

### tools（工具主表）

```sql
CREATE TABLE tools (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  website          TEXT NOT NULL,
  pricing          TEXT NOT NULL CHECK(pricing IN ('free','freemium','paid')),
  price_starting   REAL DEFAULT 0,
  price_detail     TEXT,
  has_free_trial   INTEGER DEFAULT 0,
  platforms        TEXT DEFAULT '',        -- 逗号分隔：web,desktop,mobile,api
  status           TEXT DEFAULT 'active'
                   CHECK(status IN ('active','beta','discontinued','pending')),
  launched         TEXT,                   -- 格式：2022-07
  submitted_at     TEXT NOT NULL,
  last_verified    TEXT,
  updated_at       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  cover_image      TEXT,
  featured         INTEGER DEFAULT 0,
  verified         INTEGER DEFAULT 0,
  editor_pick      INTEGER DEFAULT 0,
  click_count      INTEGER DEFAULT 0,
  view_count       INTEGER DEFAULT 0,
  submitter_site   TEXT,                   -- dofollow 外链，不得删除
  submitter_github TEXT,
  submitter_id     INTEGER REFERENCES users(id),  -- 关联提交者
  content_path     TEXT,
  body             TEXT,                   -- Markdown 正文
  reject_reason    TEXT,                   -- 拒绝原因
  reviewer_note    TEXT,                   -- 管理员备注
  reviewed_at      TEXT                    -- 审核时间
);

CREATE INDEX idx_tools_category   ON tools(category);
CREATE INDEX idx_tools_pricing    ON tools(pricing);
CREATE INDEX idx_tools_status     ON tools(status);
CREATE INDEX idx_tools_featured   ON tools(featured);
CREATE INDEX idx_tools_submitted  ON tools(submitted_at DESC);
CREATE INDEX idx_tools_clicks     ON tools(click_count DESC);
CREATE INDEX idx_tools_cat_status ON tools(category, status);
```

### tool_tags

```sql
CREATE TABLE tool_tags (
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (tool_id, tag)
);
CREATE INDEX idx_tool_tags_tag ON tool_tags(tag);
```

### tool_images

```sql
CREATE TABLE tool_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id    INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT DEFAULT '',
  caption    TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  image_type TEXT DEFAULT 'screenshot'
             CHECK(image_type IN ('cover','screenshot','logo','banner','og')),
  width      INTEGER,
  height     INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_images_tool_id ON tool_images(tool_id, sort_order);
```

### tool_videos

```sql
CREATE TABLE tool_videos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id    INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  video_id   TEXT,
  platform   TEXT NOT NULL CHECK(platform IN ('youtube','vimeo','twitter','loom','direct')),
  title      TEXT DEFAULT '',
  video_type TEXT DEFAULT 'demo' CHECK(video_type IN ('demo','tutorial','review','intro')),
  thumbnail  TEXT,
  duration   INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_videos_tool_id ON tool_videos(tool_id, sort_order);
```

### users（用户表，GitHub OAuth 登录）

```sql
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id       INTEGER NOT NULL UNIQUE,
  username        TEXT NOT NULL,              -- GitHub 用户名
  email           TEXT,                       -- GitHub 公开邮箱
  avatar_url      TEXT,
  unsubscribed_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX idx_users_github_id ON users(github_id);
```

### email_logs（邮件发送记录，MVP 后实现）

```sql
CREATE TABLE email_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id    TEXT    NOT NULL,               -- 场景编号，如 "B-03"
  recipient   TEXT    NOT NULL,
  subject     TEXT    NOT NULL,
  status      TEXT    DEFAULT 'sent'
              CHECK(status IN ('sent','failed','bounced')),
  resend_id   TEXT,                           -- Resend message id
  created_at  TEXT    DEFAULT (datetime('now'))
);
```

---

## 三、Markdown Frontmatter 规范

```yaml
---
name: "Midjourney"
slug: "midjourney"
website: "https://midjourney.com"
category: "image"
tags: ["image-generation", "ai-art", "text-to-image"]

pricing: "paid"
price_starting: 10
price_detail: "Basic $10/mo, Standard $30/mo, Pro $60/mo"
has_free_trial: false

platforms: ["web", "discord"]

status: "active"       # active | beta | discontinued | pending
launched: "2022-07"
last_verified: "2026-04"

title: "Midjourney – AI Image Generator"
meta_description: "Midjourney is a powerful AI image generation tool..."

cover_image: "https://r2.aifindr.org/tools/image/midjourney/cover.webp"
og_image:    "https://r2.aifindr.org/tools/image/midjourney/og.webp"

images:
  - url: "https://r2.aifindr.org/tools/image/midjourney/screenshot-01.webp"
    alt: "Midjourney prompt interface"
    type: "screenshot"
    width: 1920
    height: 1080

videos:
  - url: "https://www.youtube.com/watch?v=xxxxxxx"
    platform: "youtube"
    video_id: "xxxxxxx"
    title: "Midjourney V6 Full Demo"
    type: "demo"

submitter_site:   "https://example.com"   # dofollow 外链，必须保留
submitter_github: "username"

featured:     false
verified:     false
editor_pick:  false
submitted_at: "2026-04-27"
---

正文 Markdown 内容...
```

---

## 四、R2 媒体文件规范

```
r2.aifindr.org/tools/{category}/{slug}/
  cover.webp        1200×675px，< 200KB
  logo.webp         512×512px，< 100KB
  og.webp           1200×630px，< 150KB
  banner.webp       1600×400px，< 200KB
  screenshots/
    01.webp         1280×800px，< 300KB（最多5张）
```

---

## 五、Worker API 接口

```
GET  /api/tools
  ?category=image
  ?pricing=free,freemium
  ?sort=latest|trending|featured
  ?page=1&pageSize=24

GET  /api/tools/:category/:slug    # 含 images + videos
GET  /api/tools/search?q=keyword   # 全文搜索（D1 LIKE，后期可接 Algolia）
GET  /api/stats                    # 首页统计：工具数/分类数/贡献者数
POST /api/submit                   # 表单提交（Turnstile 验证）
POST /api/click/:id                # 记录点击，用于 Trending 排序

# 认证
GET  /api/auth/github              # GitHub OAuth 入口
GET  /api/auth/callback            # GitHub OAuth 回调
GET  /api/auth/me                  # 当前用户信息（Cookie JWT）
GET  /api/auth/dev-login           # 本地 mock 登录

# 管理员
GET  /api/admin/pending            # 待审核工具列表（需管理员 JWT）
POST /api/admin/review             # 审核通过/拒绝（需管理员 JWT）
```

**KV 缓存策略**（TTL 1小时）：`/api/stats`、`/api/tools?sort=trending`、首页数据

---

## 六、数据流转

```
写入：
  GitHub PR 合并 → GitHub Action → D1 UPSERT → 触发 Pages 增量构建
  在线表单提交  → CF Worker    → D1 INSERT(pending) → 邮件通知管理员
  管理员审核    → D1 UPDATE(active)

读取：
  SSG 预渲染  首页、列表页、分类页、提交页
  ISR 24h    工具详情页（/tools/*/*）
  Worker API  搜索、筛选、统计
```

---

## 七、外链激励体系（产品核心，不得破坏）

提交工具后，提交者获得：

| 外链 | 域名 | 位置 | 类型 |
|------|------|------|------|
| GitHub 主仓库 | github.com（DA 100）| `content/tools/[category]/[slug].md` 中 `submitter_site` | **dofollow** |
| 工具详情页 | aifindr.org | 详情页右侧"Submitted by"区域 | **dofollow** |
| 贡献者详情页 | aifindr.org/contributors/[username] | 个人页面网站链接 | **dofollow** |

**开发约定**：`submitter_site` 字段的链接**禁止**加 `rel="nofollow"`，不得在任何重构中移除。

---

## 八、商业模式（付费功能，MVP 阶段暂缓实现）

| 功能 | 价格 |
|------|------|
| Featured 首页置顶 | $19–$49/个（永久） |
| 加速审核（24h） | 付费 |
| Verified 认证标签 | 付费 |
| 访问数据统计 | 付费 |

支付：Stripe / Lemon Squeezy（v1.3 阶段接入）

---

## 九、Nuxt 路由规则

```typescript
routeRules: {
  '/':           { prerender: true },
  '/tools':      { prerender: true },
  '/tools/*/':   { prerender: true },
  '/submit':     { prerender: true },
  '/tools/*/*':  { isr: 86400 },
  '/blog/*/*':   { isr: 604800 },
  '/api/**':     { cors: true },
}
```

---

## 十、Cloudflare 绑定（Worker 中访问）

```typescript
const { DB }    = env  // D1Database
const { CACHE } = env  // KVNamespace
const { MEDIA } = env  // R2Bucket
```
