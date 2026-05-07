# aifindr.org — Claude Code Project Guide

## 项目概述

aifindr.org 是一个**开源、社区驱动**的 AI 工具目录站，同时也是一个**内容反链自动化平台**。

- **域名**：aifindr.org
- **定位**：开源 AI 工具目录 → 提交工具 → 自动获得多条 dofollow 外链
- **技术栈**：Nuxt 4 + Tailwind CSS v4 + Cloudflare（Pages / D1 / Workers / R2 / Turnstile）
- **部署**：SSG（核心页面）+ ISR（工具详情页）

## 当前阶段：MVP v1.0

优先实现以下页面，其余功能暂缓：

1. 首页 `/`
2. 工具列表页 `/tools`
3. 工具详情页 `/tools/[category]/[slug]`
4. 提交页 `/submit`
5. 分类页 `/tools/[category]`

## Rules 文件索引

详细规范拆分在以下文件中，**每次开始任务前必须读取相关 rules**：

- @.claude/rules/tech-stack.md — 技术栈约定、目录结构、代码规范
- @.claude/rules/design-system.md — 设计 Token、组件像素规范、暗色主题
- @.claude/rules/product-scope.md — 功能模块、数据结构、API 接口、外链逻辑

## 核心工作流程

### 创建新组件时
1. 读取 @.claude/rules/design-system.md
2. 使用 CSS 变量（不得硬编码颜色）
3. 必须支持暗色主题（变量系统自动处理）
4. 必须响应式（Tailwind 断点）

### 创建新页面时
1. 读取 @.claude/rules/tech-stack.md（目录规范）
2. 读取 @.claude/rules/product-scope.md（该页面功能需求）
3. 读取 @.claude/rules/design-system.md（该页面布局规范）

### 操作数据库时
1. 读取 @.claude/rules/product-scope.md（D1 表结构）
2. 所有查询通过 Cloudflare Worker（`workers/api.ts`）
3. 高频查询先查 KV 缓存

### 修改样式时
1. 只修改 CSS 变量值或 Tailwind utility class
2. 不得新增 inline style（除非动态值）
3. 暗色模式通过 CSS 变量自动处理，无需 `dark:` 前缀

## 关键约定

### 文件命名
- 页面：`pages/tools/[category]/[slug].vue`
- 组件：`components/tool/ToolCard.vue`（PascalCase）
- Composables：`composables/useTools.ts`（camelCase，use 前缀）
- Worker：`workers/api.ts`（kebab-case）

### 颜色使用规则
- **禁止**硬编码颜色（`#4f46e5`、`rgba(...)`）
- **必须**使用 CSS 变量（`var(--color-accent)`）
- 唯一例外：徽章/标签的透明背景色（已在 design-system.md 中定义为具名变量）

### TypeScript
- 所有 `.ts` 文件必须有类型定义
- 工具数据类型定义在 `types/tool.ts`
- 禁止使用 `any`

### Nuxt Content 查询
- 使用 `queryCollection('tools')` 而非直接读文件
- 必须带 `.where('status', '==', 'active')` 过滤

## 项目目录结构（顶层）

```
aifindr.org/
├── CLAUDE.md                 ← 本文件
├── .claude/
│   └── rules/
│       ├── tech-stack.md
│       ├── design-system.md
│       └── product-scope.md
├── pages/
├── components/
├── composables/
├── content/tools/            ← 工具 Markdown 文件
├── workers/
├── assets/css/
├── types/
└── nuxt.config.ts
```

## 外链激励体系（核心产品逻辑）

提交工具后，提交者自动获得：
1. **GitHub 外链**（DA 100）：`content/tools/[category]/[slug].md` 文件中的 `submitter_site` 字段
2. **工具详情页外链**：详情页右侧 "Submitted by" 区域的 dofollow 链接
3. **贡献者页外链**：`/contributors/[github-username]` 页面中的个人网站链接

**这是产品的核心增长飞轮，任何相关功能开发都不得删除或改为 nofollow。**

## 常用命令

```bash
# 本地开发
pnpm dev

# 构建
pnpm build

# 同步 Markdown 到 D1
pnpm run sync-d1

# 类型检查
pnpm typecheck
```
