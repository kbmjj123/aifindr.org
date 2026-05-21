# aifindr.org SEO 关键词策略

> 版本：v1.0
> 基于：composables/usePageSeo.ts 当前实现
> 最后更新：2026-05-14

---

## 一、首页核心关键词

**主打词（高意图，竞争适中）：**
- `AI tools directory`
- `best AI tools 2026`
- `free AI tools`
- `find AI tools`

**Title：**
`aifindr.org – Discover 500+ AI Tools, Free & Open Source`

> 由 `usePageSeo()` 默认模板自动输出，无需传参。

**Meta Description：**
`Find the best AI tools for any task. Open-source AI tools directory with 500+ tools across 12 categories. Submit your tool, get free backlinks.`

> 当前 `pages/index.vue` 的 description 可优化为此版本（包含搜索意图前置词）。

---

## 二、分类页关键词

### Title 模板

`Best [Category] AI Tools in 2026 | aifindr.org`

> 已在 `composables/usePageSeo.ts` 的 `category` 模板中实现。

### 各分类关键词表

| 分类 | Title 核心词 | 长尾词（用于 description） |
|:---|:---|:---|
| Image & Design | `best AI image generator tools` | `free AI image generator`, `AI art tools` |
| Writing & Content | `best AI writing tools` | `AI content generator`, `AI copywriting tool` |
| Video & Animation | `best AI video generator` | `AI video maker free`, `text to video AI` |
| Audio & Music | `best AI music generator` | `AI voice generator`, `AI audio tools` |
| Code & Developer | `best AI coding tools` | `AI code assistant`, `GitHub Copilot alternatives` |
| Productivity | `best AI productivity tools` | `AI automation tools`, `AI workflow tools` |
| Marketing & SEO | `best AI marketing tools` | `AI SEO tools`, `AI social media tools` |
| Data & Analytics | `best AI data tools` | `AI analytics tools`, `AI data visualization` |
| Education | `best AI education tools` | `AI learning tools`, `AI tutoring` |
| Business | `best AI business tools` | `AI for startups`, `AI business automation` |
| Research | `best AI research tools` | `AI literature review`, `AI search tools` |

### 分类页 Description 建议

当前 `pages/tools/[category]/index.vue` 的 description：

```
Browse the best [Category] AI tools. Compare pricing, read reviews, and find the perfect tool.
```

可加强为模板化的长尾覆盖，例如 Image 分类：

```
Browse the best AI image generator tools. Find free AI art tools, text-to-image generators, and AI design assistants. Compare pricing and features.
```

---

## 三、工具详情页关键词（最大长尾流量来源）

### 目标关键词类型

- `[工具名] review`
- `[工具名] pricing`
- `[工具名] alternatives`
- `[工具名] vs [竞品]`
- `is [工具名] free`

### 实现要求

这些词不应塞进 `<title>`，而是通过页面正文覆盖：

- 正文 H2/H3 中包含 "Pricing"、"Alternatives to [工具名]"、"Key Features" 等标题
- `meta_description` 包含工具名 + 核心功能 + 定价类型
- Markdown frontmatter 的 `meta_description` 字段质量直接影响 SEO

### SoftwareApplication Schema（缺失，需实现）

详情页需添加 JSON-LD 结构化数据：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "工具名",
  "url": "官网 URL",
  "image": "封面图 URL",
  "applicationCategory": "分类",
  "offers": {
    "@type": "Offer",
    "price": "起步价",
    "priceCurrency": "USD"
  }
}
```

---

## 四、提交页关键词

**目标搜索意图：**
- `submit AI tool directory`
- `get backlinks for AI tool`
- `free AI tool listing`
- `AI tools directory submission`

**Title：**
`Submit Your AI Tool – Get Free Backlinks | aifindr.org`

> 当前 `pages/submit.vue` title 为 `"Submit Your AI Tool | aifindr.org"`，可加入 "Get Free Backlinks" 提高搜索命中率。

**Meta Description：**
`Get 3 free dofollow backlinks when you submit your AI tool to aifindr.org. Open source, no account needed.`

> 当前已接近此版本，保持即可。

---

## 五、URL Slug 关键词策略

### 原则

Slug 中应同时包含工具名和品类词，例如：

| 工具名 | 差的 Slug | 好的 Slug |
|--------|----------|-----------|
| Midjourney | `midjourney` | `midjourney-ai-image-generator` |
| Jasper | `jasper` | `jasper-ai-writing-assistant` |
| Runway | `runway` | `runway-ai-video-generator` |

### 当前实现

Worker `handleSubmit` 中 `slugify(name)` 仅取工具名。要实现带品类词的 slug，需在生成逻辑中加入 category 后缀，或在前端提交时提供 slug 建议。

---

## 六、图片 Alt Text 规范

| 图片类型 | Alt 格式 |
|---------|--------|
| 工具 Logo | `[工具名] logo` |
| 功能截图 | 描述画面内容，如 `Midjourney Discord prompt interface with generated artwork` |
| 封面图 | `[工具名] cover image — AI [category] tool` |

---

## 七、分页 & 筛选 URL 索引策略

### 需要独立索引的排序

- `/tools` — 默认（Latest）
- `/tools?sort=trending` — Trending（按点击量）
- `/tools?sort=featured` — Featured 优先

### Canonical 配置

- 分页参数 `?page=2` 不应产生独立索引（或加 canonical 指向 page 1）
- 筛选参数组合（`?category=image&pricing=free`）需评估是否要独立索引
- 若不需要参数页面被索引，在 `robots.txt` 中排除包含 `?` 的 URL

---

## 八、MVP SEO 最低配置清单

| # | 项目 | 状态 | 文件 |
|---|------|------|------|
| 1 | `robots.txt` 允许爬虫，排除 `/api/*` | ⚠️ 未排除 /api | `nuxt.config.ts` |
| 2 | `sitemap.xml` 覆盖所有页面 | ✅ 已有 | `nuxt.config.ts` |
| 3 | 每页 `<title>` 唯一 ≤ 60 字符 | ✅ 已有 | 各页面 `usePageSeo` |
| 4 | 每页 `<meta description>` 唯一 130-155 字符 | ⚠️ 详情页依赖内容 | 各页面 `usePageSeo` |
| 5 | `og:title` / `og:description` / `og:image` | ✅ 已有 | `usePageSeo` + `defineOgImage` |
| 6 | 工具详情页 `SoftwareApplication` Schema | ❌ 缺失 | `pages/tools/[category]/[slug].vue` |
| 7 | Canonical URL | ❌ 缺失 | 分页/筛选页 |
| 8 | Google Search Console 验证 + 提交 sitemap | 待上线 | 运营操作 |

---

## 九、优先实施建议

**上线前必须：** 首页 description 优化、提交页 title 强化、详情页 Schema、robots.txt 排除 API

**上线后第二周：** 分页 canonical、筛选参数索引策略、GSC 提交

**长期运营：** 工具 slug 含品类词、图片 alt 规范、详情页内容长尾词覆盖
