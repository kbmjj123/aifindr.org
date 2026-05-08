# Rules: SEO & OG Image

> 适用：创建新页面、修改 SEO 元数据、自定义 OG 图片时读取本文件

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| SEO 模块 | `@nuxtjs/seo` | 集成 7 个子模块（sitemap/robots/og-image/schema-org/link-checker/seo-utils/site-config） |
| OG 渲染 | Satori | 构建时生成 PNG，无需运行时依赖 |
| 自定义钩子 | `usePageSeo()` composable | 统一 title/description/og-image |

## 二、nuxt.config.ts 配置

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://aifindr.org',
    name: 'aifindr.org – Discover AI Tools',
  },

  ogImage: {
    zeroRuntime: true,          // 构建时生成，不运行时渲染
  },

  robots: {
    allow: ['/'],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },
})
```

## 三、usePageSeo() — 标准 SEO composable

**路径：** `composables/usePageSeo.ts`

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 首页否，其他页是 | 页面标题（不含站点后缀） |
| `description` | string | 否 | 页面描述，默认 158 字符截断 |
| `descMax` | number | 否 | 描述字数上限，默认 158 |
| `template` | `'default'\|'category'\|'tool'\|'blog'\|'prefix'` | 否 | 标题格式模板，默认 `'default'` |
| `category` | string | 否 | 分类名（`category` 模板专用） |
| `subtitle` | string | 否 | 子标题（`tool` 模板专用） |

### 标题模板

| 模板 | 格式 | 适用页面 |
|------|------|---------|
| `default` | `aifindr.org — {TAGLINE}` | 首页 `/` |
| `prefix` | `{title} \| aifindr.org` | 列表页、提交页、贡献者页 |
| `category` | `Best {category} AI Tools in 2026 \| aifindr.org` | 分类页 `/tools/[category]` |
| `tool` | `{title} — {subtitle} \| aifindr.org` | 工具详情页 `/tools/[category]/[slug]` |
| `blog` | `{title} \| aifindr.org Blog` | 博客页 `/blog/*` |

### 使用方式（普通页面）

```typescript
// 静态值
usePageSeo({
  title: 'All AI Tools',
  template: 'prefix',
  description: 'Browse 500+ AI tools...',
})

// 动态值（传入 getter）
usePageSeo(() => ({
  title: name.value,
  template: 'tool',
  subtitle: meta_description,
  description: meta_description,
}))
```

### 自动生成的内容

调用 `usePageSeo` 后自动设置：
- `<title>`（按模板格式）
- `<meta name="description">`
- `<meta property="og:title">` / `og:description`
- `<meta name="twitter:card">` / `twitter:title` / `twitter:description`
- **OG Image**（调用 `defineOgImage('AppOgImage', ...)`）

## 四、自定义 OG 图片组件

**路径：** `components/og/AppOgImage.vue`

### 组件 Props

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 大标题文字 |
| `description` | string | 否 | 副标题/描述 |
| `type` | string | 否 | 页面类型徽章（HOME / CATEGORY / AI TOOL / BLOG / PAGE） |

### 页面单独覆盖 OG 图片

需要自定义时，在页面 `<script setup>` 中覆盖：

```typescript
defineOgImage('AppOgImage', {
  title: '自定义标题',
  description: '自定义描述',
  type: 'CUSTOM',
})
```

**优先级：** 页面中后调用的 `defineOgImage` 会覆盖 `usePageSeo` 中的默认调用。

### OG 图片设计规范

- 尺寸：1200×630px（标准 OG 图比例）
- 背景：#080808
- 强调色：#c8ff00
- 左侧固定：Logo + 站名 + 装饰线 + 底部 tagline
- 右侧动态：页面类型徽章 + 大标题 + 描述
- 字体：Inter（OG 渲染时由 nuxi-og-image 自动加载）

## 五、新页面添加 SEO 的步骤

1. 在 `<script setup>` 中调用 `usePageSeo()`
2. 选择合适的 `template` 类型
3. 传入页面相关的 `title` 和 `description`
4. 如工具详情页，额外传入 `subtitle`
5. 如需覆盖 OG 图片，在 `usePageSeo` 之后另调 `defineOgImage`

## 六、字数控制规范

| 字段 | 上限 | 规则 |
|------|------|------|
| `<title>` | ~60 字符 | 模板自动生成，超出部分在模板中自然截断 |
| `<meta description>` | 158 字符 | `formatDescription()` 自动截断，末尾加 `…` |
| OG image 标题 | ~80 字符 | 组件中 `-webkit-line-clamp: 3` 截断 |
| OG image 描述 | ~120 字符 | 组件中 `-webkit-line-clamp: 2` 截断 |

## 七、相关文件索引

| 文件 | 作用 |
|------|------|
| `composables/usePageSeo.ts` | 统一 SEO composable |
| `components/og/AppOgImage.vue` | OG 图片模板组件 |
| `nuxt.config.ts` | SEO 模块配置 |
