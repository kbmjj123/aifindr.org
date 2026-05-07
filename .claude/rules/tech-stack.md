# Rules: Tech Stack & Code Conventions

> 适用：创建页面、组件、Worker、配置文件时读取本文件

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Nuxt | 4.x | SSG + ISR 混合 |
| 样式 | Tailwind CSS | v4 | utility-first |
| 内容管理 | Nuxt Content | v3 | Markdown 渲染 |
| 元数据 | Cloudflare D1 | — | SQLite，边缘数据库 |
| 缓存 | Cloudflare KV | — | 高频查询，TTL 1h |
| 对象存储 | Cloudflare R2 | — | 图片/媒体文件 |
| 后端逻辑 | Cloudflare Workers | — | API 接口 |
| AI 生成 | Anthropic API | Claude | 文章生成（后期） |
| 防垃圾 | Cloudflare Turnstile | — | 表单验证 |
| 部署 | Cloudflare Pages | — | Git 触发构建 |

## 目录结构（完整）

```
aifindr.org/
├── pages/
│   ├── index.vue                        # 首页
│   ├── tools/
│   │   ├── index.vue                    # 工具列表页
│   │   ├── [category]/
│   │   │   ├── index.vue                # 分类页
│   │   │   └── [slug].vue               # 工具详情页
│   ├── submit.vue                       # 提交页
│   ├── contributors/
│   │   ├── index.vue
│   │   └── [username].vue
│   └── blog/
│       ├── index.vue
│       └── [slug].vue
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue                # 顶部导航（固定，56px）
│   │   ├── AppSidebar.vue               # 左侧边栏（240px，桌面端）
│   │   └── AppFooter.vue
│   ├── tool/
│   │   ├── ToolCard.vue                 # 标准工具卡片（核心组件）
│   │   ├── ToolCardCompact.vue          # 精简卡片（Trending 区）
│   │   ├── ToolGrid.vue                 # 卡片网格容器
│   │   ├── ToolBadge.vue                # Featured/Verified/New 徽章
│   │   └── ToolTag.vue                  # 分类/定价标签
│   ├── search/
│   │   ├── SearchBar.vue                # 顶部搜索框
│   │   └── SearchModal.vue              # ⌘K 全局搜索弹窗
│   ├── ui/
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   ├── BaseSelect.vue
│   │   ├── BaseBadge.vue
│   │   ├── BaseTag.vue
│   │   ├── BaseToast.vue
│   │   └── BaseSkeleton.vue
│   └── submit/
│       ├── SubmitForm.vue
│       └── BacklinkIncentive.vue
│
├── composables/
│   ├── useTools.ts                      # 工具数据查询
│   ├── useSearch.ts                     # 搜索逻辑
│   ├── useToast.ts                      # Toast 通知
│   └── useKeyboardShortcuts.ts          # 快捷键（⌘K）
│
├── content/
│   └── tools/
│       ├── image/                       # 按分类组织
│       │   └── midjourney.md
│       ├── writing/
│       ├── video/
│       └── ...
│
├── workers/
│   ├── api.ts                           # 工具列表/详情/搜索 API
│   ├── submit.ts                        # 表单提交处理
│   └── generate.ts                      # AI 文章生成（后期）
│
├── types/
│   └── tool.ts                          # 工具相关类型定义
│
├── assets/
│   └── css/
│       ├── main.css                     # CSS 变量定义（根据 design-system.md）
│       └── markdown.css                 # Markdown 渲染样式
│
├── scripts/
│   └── sync-to-d1.js                    # GitHub Actions 同步脚本
│
├── public/
├── nuxt.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Nuxt 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss'],
  
  routeRules: {
    '/':           { prerender: true },
    '/tools':      { prerender: true },
    '/tools/*/':   { prerender: true },
    '/submit':     { prerender: true },
    '/tools/*/*':  { isr: 86400 },        // 工具详情页：24h ISR
    '/blog/*/*':   { isr: 604800 },        // 博客文章：7天 ISR
    '/api/**':     { cors: true },
  },
  
  nitro: {
    preset: 'cloudflare-pages',
  }
})
```

## Tailwind 配置

```typescript
// tailwind.config.ts
export default {
  content: [
    './components/**/*.vue',
    './pages/**/*.vue',
    './layouts/**/*.vue',
    './composables/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        // 映射到 CSS 变量，不要使用原始颜色值
        'bg-base':        'var(--color-bg-base)',
        'bg-surface':     'var(--color-bg-surface)',
        'bg-elevated':    'var(--color-bg-elevated)',
        'bg-input':       'var(--color-bg-input)',
        'border-base':    'var(--color-border)',
        'border-hover':   'var(--color-border-hover)',
        'border-active':  'var(--color-border-active)',
        'accent':         'var(--color-accent)',
        'accent-light':   'var(--color-accent-light)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'text-link':      'var(--color-text-link)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      maxWidth: {
        'content': '1160px',
      },
    },
  },
}
```

## TypeScript 类型定义

```typescript
// types/tool.ts

export type ToolPricing = 'free' | 'freemium' | 'paid'
export type ToolStatus = 'active' | 'beta' | 'discontinued' | 'pending'
export type ToolPlatform = 'web' | 'desktop' | 'mobile' | 'api' | 'discord'
export type ToolCategory =
  | 'image' | 'writing' | 'video' | 'audio' | 'code'
  | 'productivity' | 'marketing' | 'data' | 'education'
  | 'business' | 'research' | 'other'

export interface ToolImage {
  url: string
  alt: string
  caption?: string
  type: 'cover' | 'screenshot' | 'logo' | 'banner' | 'og'
  width?: number
  height?: number
}

export interface ToolVideo {
  url: string
  platform: 'youtube' | 'vimeo' | 'twitter' | 'loom' | 'direct'
  video_id?: string
  title?: string
  type: 'demo' | 'tutorial' | 'review' | 'intro'
  thumbnail?: string
  duration?: number
}

export interface Tool {
  id?: number
  slug: string
  name: string
  category: ToolCategory
  website: string
  pricing: ToolPricing
  price_starting?: number
  price_detail?: string
  has_free_trial?: boolean
  platforms: ToolPlatform[]
  tags: string[]
  status: ToolStatus
  launched?: string
  submitted_at: string
  last_verified?: string
  updated_at?: string
  meta_description?: string
  og_image?: string
  cover_image?: string
  featured: boolean
  verified: boolean
  editor_pick: boolean
  click_count?: number
  view_count?: number
  submitter_site?: string
  submitter_github?: string
  images?: ToolImage[]
  videos?: ToolVideo[]
  // Nuxt Content 字段
  body?: any
  title?: string
}

export interface ToolListResponse {
  tools: Tool[]
  total: number
  page: number
  pageSize: number
}

export interface SearchResult {
  tools: Tool[]
  query: string
}
```

## Worker API 接口

```
GET  /api/tools              # 工具列表（支持筛选、排序、分页）
  ?category=image
  ?pricing=free,freemium
  ?sort=latest|trending|featured
  ?page=1
  ?pageSize=24

GET  /api/tools/:category/:slug   # 工具详情（含 images + videos）
GET  /api/tools/search            # 全文搜索 ?q=keyword
GET  /api/stats                   # 首页统计数字
POST /api/submit                  # 工具表单提交
POST /api/click/:id               # 记录点击（用于 Trending 排序）
```

## Nuxt Content 查询规范

```typescript
// 列表查询（始终加 status 过滤）
const tools = await queryCollection('tools')
  .where('status', '==', 'active')
  .order('submitted_at', 'desc')
  .limit(24)
  .all()

// Featured 工具
const featured = await queryCollection('tools')
  .where('featured', '==', true)
  .where('status', '==', 'active')
  .limit(6)
  .all()

// 分类筛选
const categoryTools = await queryCollection('tools')
  .where('category', '==', category)
  .where('status', '==', 'active')
  .order('featured', 'desc')
  .all()

// 单个工具
const tool = await queryCollection('tools')
  .where('slug', '==', slug)
  .first()
```

## 响应式断点（Tailwind）

```
默认（移动）  < 640px    单列，侧边栏收起
sm:           640px+     2列卡片网格
md:           768px+     侧边栏可展开
lg:           1024px+    固定侧边栏，3列网格
xl:           1280px+    4列网格
2xl:          1536px+    最大宽度 1400px 居中
```

## 代码规范要点

1. **Composition API** + `<script setup>` 语法
2. **`defineProps` 必须带类型**：`defineProps<{ tool: Tool }>()`
3. **emit 必须声明**：`defineEmits<{ click: [tool: Tool] }>()`
4. **组件 props 不得有 `any` 类型**
5. **异步组件** 用 `<Suspense>` 包裹，提供 fallback 骨架屏
6. **所有外链** 必须 `target="_blank" rel="noopener noreferrer"`（工具 `submitter_site` 除外，保持 dofollow）
7. **图片** 使用 `<NuxtImg>` 组件（自动优化），非 `<img>`

## Cloudflare 绑定约定

```typescript
// 在 Worker 中访问 D1
const { DB } = env  // D1Database

// 访问 KV
const { CACHE } = env  // KVNamespace

// 访问 R2
const { MEDIA } = env  // R2Bucket
```

## Git 提交规范

```
feat: 新功能
fix: 修复 bug
style: 样式调整（不影响逻辑）
refactor: 重构
docs: 文档
chore: 构建/工具配置
```
