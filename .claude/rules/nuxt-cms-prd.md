# 产品需求文档 · Nuxt CMS 模块

**项目名称**：基于 Nuxt SSR + Cloudflare 全栈的博客 CMS 系统
**文档版本**：v1.0
**创建日期**：2025-06-11
**状态**：待开发

---

## 1. 项目背景

在现有 Nuxt SSR 项目中，新增一套面向非技术编辑人员的内容管理模块，支持博客文章的创建、编辑与发布。所有基础设施全部运行在 Cloudflare 生态内，无需引入第三方 CMS 服务或外部数据库，同时保持低运维成本与良好的可扩展性。

---

## 2. 目标与范围

### 2.1 目标

- 为非技术人员提供可视化的博客内容管理后台
- 图片直传 Cloudflare R2，不经过服务器中转
- 支持多语言内容管理（中文 / 英文）
- 支持自定义字段扩展，适应未来内容结构变化
- 全部基础设施跑在 Cloudflare 上，免费额度满足日常使用

### 2.2 范围

| 模块 | 包含 | 不包含 |
|---|---|---|
| 内容管理 | 文章 CRUD、草稿/发布状态 | 评论系统、订阅功能 |
| 媒体管理 | 图片上传到 R2 | 视频存储、CDN 转码 |
| 多语言 | zh / en 双语内容 | 机器翻译 |
| 前台展示 | SSR 博客列表与详情页 | 评论、点赞互动 |

---

## 3. 用户角色

| 角色 | 描述 | 典型操作 |
|---|---|---|
| **内容编辑** | 非技术人员，负责日常写稿 | 新建/编辑文章、上传图片、发布 |

---

## 4. 功能需求

### 4.1 后台登录

- 账号密码登录，Session 存储于 Cloudflare KV
- 后台路由 `/admin/*` 全部需要登录态保护

### 4.2 文章管理

**文章列表页** `/admin/posts`

- 展示所有文章（标题、语言、状态、创建时间）
- 支持按状态筛选（草稿 / 已发布）
- 支持搜索标题关键词
- 新建文章按钮

**文章编辑页** `/admin/posts/[id]`

- 富文本编辑器（Tiptap）：支持标题、正文、粗体、斜体、链接、图片插入
- 封面图上传（触发 R2 直传）
- 多语言 Tab 切换（zh / en），独立编辑各语言内容
- 自定义字段区域（key-value 形式）
- 保存草稿 / 发布 两个操作
- 发布时自动清除对应 KV 缓存

**字段说明**

| 字段 | 类型 | 说明 |
|---|---|---|
| slug | text | URL 唯一标识，自动生成可手动修改 |
| title | text | 文章标题（各语言独立） |
| content | text | Tiptap 输出的 HTML（各语言独立） |
| cover_image | text | R2 公开 URL |
| meta_desc | text | SEO 描述（各语言独立） |
| status | text | `draft` / `published` |
| custom_fields | json | 自定义扩展字段 |

### 4.3 图片上传

- 编辑器内点击插入图片按钮，弹出上传选择框
- 文件在浏览器端直接 `PUT` 到 R2（不经过服务器）
- 流程：前端请求 `POST /api/upload/sign` → Nitro 返回 R2 可写地址 → 浏览器直传 → 返回公开 URL 写入编辑器
- 支持 jpg / png / webp / gif，单文件不超过 10MB
- 文件命名规则：`images/{timestamp}-{原始文件名}`

### 4.4 多语言管理

- 文章主记录（`posts` 表）与翻译内容（`post_translations` 表）分离存储
- 编辑页以 Tab 形式切换语言，各语言独立保存
- 前台读取时通过 `?locale=zh` 参数或路由前缀区分语言
- 至少一种语言完成填写才可发布

### 4.5 自定义字段

- 每篇文章可添加任意数量的 key-value 字段
- 支持新增、编辑、删除
- 前台可通过 API 读取自定义字段，用于特殊展示需求（如作者信息、文章系列等）

### 4.6 前台展示

- 博客列表页 `/blog`：展示已发布文章，支持分页
- 博客详情页 `/blog/[slug]`：SSR 渲染，优先读 KV 缓存
- 缓存策略：发布/更新文章后自动刷新对应 KV 缓存，TTL 1 小时兜底

---

## 5. 技术架构

### 5.1 技术栈

| 层级 | 选型 | 说明 |
|---|---|---|
| 框架 | Nuxt 3 SSR |  |
| 数据库 | Cloudflare D1 | SQLite-based，无服务器 |
| 缓存 | Cloudflare KV | 文章缓存、Session 存储 |
| 图片存储 | Cloudflare R2 | 对象存储，兼容 S3 API |
| 部署 | Cloudflare Pages | 无限请求，免费 |
| 富文本编辑器 | Tiptap + Vue 3 | 可扩展，支持自定义节点 |


### 5.2 数据库 Schema

```sql
-- 文章主表
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  status      TEXT DEFAULT 'draft',       -- draft | published
  created_at  INTEGER DEFAULT (unixepoch()),
  updated_at  INTEGER DEFAULT (unixepoch())
);

-- 多语言内容表
CREATE TABLE IF NOT EXISTS post_translations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale       TEXT NOT NULL,             -- zh | en
  title        TEXT NOT NULL,
  content      TEXT,                      -- Tiptap HTML
  cover_image  TEXT,                      -- R2 公开 URL
  meta_desc    TEXT,
  UNIQUE(post_id, locale)
);

-- 自定义字段表
CREATE TABLE IF NOT EXISTS custom_fields (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  value    TEXT
);
```

### 5.4 Cloudflare 资源绑定（wrangler.toml）


### 5.5 数据流

```
# 图片上传流程
浏览器选择图片
  → POST /api/upload/sign（获取 R2 可写地址）
  → 浏览器直接 PUT 到 R2
  → 返回公开 URL → 写入编辑器

# 文章保存流程
编辑器点击发布
  → POST
  → 写入 D1（posts + post_translations + custom_fields）
  → 清除 KV 中对应缓存

# 前台读取流程
用户访问 /blog/[slug]
  → 读取 KV 缓存（命中则直接返回）
  → 未命中则查询 D1
  → 写入 KV（TTL 1小时）→ 返回数据
```

---

## 6. 非功能需求

### 6.1 性能

- 前台页面首屏响应 < 200ms（KV 缓存命中情况下）
- 图片上传不经过服务器，不影响 API 响应速度
- Worker 单次请求实际 CPU Time 预计 < 3ms（D1/KV 等待不计入）

### 6.2 安全

- 后台接口全部校验 Session，未登录返回 401
- 上传接口限制文件类型（jpg/png/webp/gif）与大小（≤ 10MB）
- R2 Bucket 设置为私有，仅通过 Worker 内部绑定写入，公开读取通过自定义域

### 6.3 可用性

- 部署到 Cloudflare Pages，SLA 依赖 Cloudflare（99.99%+）
- D1 数据自动备份（Cloudflare 托管）

---

## 7. Cloudflare 免费额度评估

| 服务 | 免费额度 | 预估用量（博客场景） | 结论 |
|---|---|---|---|
| Pages（Workers） | 100,000 请求/天 | < 10,000 请求/天 | ✅ 够用 |
| D1 | 500万次读、10万次写/天，5GB 存储 | < 1万次/天 | ✅ 够用 |
| KV | 10万次读/天，1000次写/天 | < 5000次读/天 | ✅ 够用 |
| R2 | 10GB 存储，100万次操作/月 | < 1GB | ✅ 够用 |

> 日均 PV 低于 5 万的博客，全程免费额度完全覆盖。

---
