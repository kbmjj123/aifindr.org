# Rules: Design System

> 读取时机：创建或修改任何 UI 组件、页面样式时

---

## 一、CSS 变量（复制到 `assets/css/main.css`）

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* 背景层级 */
  --color-bg-base:       #0a0a0a;
  --color-bg-surface:    #111111;
  --color-bg-elevated:   #1a1a1a;
  --color-bg-input:      #141414;

  /* 边框 */
  --color-border:        #222222;
  --color-border-hover:  #333333;
  --color-border-active: #4f46e5;

  /* 文字 */
  --color-text-primary:  #f0f0f0;
  --color-text-secondary:#888888;
  --color-text-muted:    #555555;
  --color-text-link:     #818cf8;

  /* 强调色 */
  --color-accent:        #4f46e5;
  --color-accent-light:  #818cf8;
  --color-accent-glow:   rgba(79, 70, 229, 0.15);

  /* 功能色 */
  --color-success:       #22c55e;
  --color-warning:       #f59e0b;
  --color-danger:        #ef4444;
  --color-new:           #06b6d4;

  /* 徽章色 */
  --color-featured-bg:     rgba(245, 158, 11, 0.1);
  --color-featured-text:   #f59e0b;
  --color-featured-border: rgba(245, 158, 11, 0.3);
  --color-verified-bg:     rgba(34, 197, 94, 0.1);
  --color-verified-text:   #22c55e;
  --color-verified-border: rgba(34, 197, 94, 0.3);
  --color-new-bg:          rgba(6, 182, 212, 0.1);
  --color-new-text:        #06b6d4;
  --color-new-border:      rgba(6, 182, 212, 0.3);

  /* 阴影 */
  --shadow-card:   0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px var(--color-border);
  --shadow-hover:  0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px var(--color-border-hover);
  --shadow-active: 0 0 0 2px var(--color-accent-glow), 0 0 0 1px var(--color-accent);
  --shadow-glow:   0 0 20px var(--color-accent-glow);

  /* 圆角 */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* 字体 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 二、响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| 默认 | < 640px | 单列，侧边栏收起 |
| sm | 640px+ | 2列卡片网格 |
| md | 768px+ | 侧边栏可展开 |
| lg | 1024px+ | 固定侧边栏，3列网格 |
| xl | 1280px+ | 4列网格 |
| 2xl | 1536px+ | 最大宽度 1400px，居中 |

---

## 三、整体页面框架

```
顶部导航（fixed, h-14, z-50）
├── 主内容区（ml-60 桌面 / ml-0 移动，max-w-[1160px]）
└── 左侧边栏（fixed, w-60, top-14，桌面端）
```

---

## 四、顶部导航栏（AppHeader）

- 高度 56px，`position: fixed; top: 0; z-index: 50`
- 背景 `rgba(10,10,10,0.85)`，`backdrop-filter: blur(12px)`
- 底部 `1px solid var(--color-border)`

**布局（左→右）**：Logo区 | 搜索框（280px，居中）| Submit Tool 按钮 | GitHub 图标

**Logo 区**
- 图标 16×16，`border-radius: 4px`
- 站名：`aifindr`（Inter 600，14px，`var(--color-text-primary)`）
- `.org` 后缀：`var(--color-text-muted)`

**搜索框**（桌面内联）
- `height: 36px; width: 280px`
- `background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px`
- `padding: 0 12px 0 36px`（左留图标）；`font-size: 13px`
- `placeholder`：`Search 500+ AI tools...`；右侧 `⌘K` 提示
- `:focus` → `border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-glow)`

**Submit Tool 按钮**
- `background: var(--color-accent); color: white; height: 32px; padding: 0 12px; border-radius: 6px; font-size: 13px; font-weight: 500`
- `:hover` → `filter: brightness(1.1); transition: 150ms`

**GitHub 图标**：20×20，`var(--color-text-secondary)`，hover → `var(--color-text-primary)`

---

## 五、左侧边栏（AppSidebar）

- `width: 240px; position: fixed; left: 0; top: 56px; bottom: 0`
- `background: var(--color-bg-base); border-right: 1px solid var(--color-border)`
- `overflow-y: auto; padding: 16px 12px`

**顶部统计区**（三列均分）
- 数字：`16px; font-weight: 700; color: var(--color-text-primary)`
- 标签：`11px; color: var(--color-text-muted)`
- 底部：`border-bottom: 1px solid var(--color-border); margin-bottom: 16px; padding-bottom: 16px`

**导航项**（高度 36px）
```css
.nav-item {
  height: 36px; padding: 0 12px; border-radius: 8px;
  font-size: 14px; font-weight: 400; color: var(--color-text-secondary);
  display: flex; align-items: center; gap: 10px; /* 图标 16px */
}
.nav-item:hover { background: var(--color-bg-elevated); color: var(--color-text-primary); transition: 150ms ease; }
.nav-item.active { background: rgba(79,70,229,0.1); color: var(--color-text-primary); border-left: 2px solid var(--color-accent); }
```

**分类标题**：`font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.1em`

**主导航列表**：🏠 Home / 🔥 Trending / ⭐ Featured / 🆕 New / 🔍 All Tools

**分类导航**：🖼️ Image / ✍️ Writing / 🎬 Video / 🎵 Audio / 💻 Code / ⚡ Productivity / 📈 Marketing / 📊 Data / 📚 Education / 💼 Business / 🔬 Research / ··· Other（各带数量）

**底部链接**：Submit a Tool / Open Source on GitHub / Blog

---

## 六、工具卡片（ToolCard）— 核心组件

**卡片容器**
```css
.tool-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px; padding: 16px; cursor: pointer;
  transition: all 200ms ease;
}
.tool-card:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-elevated);
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}
```

**内部布局（横向）**
```
[Logo 40px]  [名称 15px/600]           [徽章] [↗ 14px]
             [描述 13px，2行截断]
             [标签1] [标签2] [定价标签]
```

**Logo**：`40×40px; border-radius: 8px; border: 1px solid var(--color-border); object-fit: cover; flex-shrink: 0`；加载失败背景 `var(--color-bg-elevated)`

**工具名**：`font-size: 15px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px`

**描述**：`font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; -webkit-line-clamp: 2; margin-bottom: 10px`

**外链箭头**：`14×14px; color: var(--color-text-muted)`，hover → `var(--color-accent-light)`

**卡片网格**：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4`

---

## 七、标签 & 徽章

**通用标签（ToolTag）**
```css
{ height: 20px; padding: 0 8px; border-radius: 9999px;
  font-size: 11px; font-weight: 500; white-space: nowrap;
  background: var(--color-bg-elevated); border: 1px solid var(--color-border);
  color: var(--color-text-secondary); }
```

**定价标签**
```
Free      → bg rgba(34,197,94,0.1)   color #22c55e  border rgba(34,197,94,0.2)
Freemium  → bg rgba(6,182,212,0.1)   color #06b6d4  border rgba(6,182,212,0.2)
Paid      → bg rgba(139,92,246,0.1)  color #a78bfa  border rgba(139,92,246,0.2)
```

**徽章（ToolBadge）**
```
Featured → bg var(--color-featured-bg)  color var(--color-featured-text)  border var(--color-featured-border)  icon ⭐
Verified → bg var(--color-verified-bg)  color var(--color-verified-text)  border var(--color-verified-border)  icon ✓
New      → bg var(--color-new-bg)       color var(--color-new-text)       border var(--color-new-border)       icon 🆕
```
共用：`height: 20px; padding: 0 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; border: 1px solid`

---

## 八、按钮系统

```css
/* Primary */
.btn-primary { background: var(--color-accent); color: white; height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: all 150ms; }
.btn-primary:hover  { filter: brightness(1.1); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Secondary */
.btn-secondary { background: transparent; color: var(--color-text-primary); height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; border: 1px solid var(--color-border); cursor: pointer; }
.btn-secondary:hover { background: var(--color-bg-elevated); border-color: var(--color-border-hover); }

/* Ghost */
.btn-ghost { background: transparent; color: var(--color-text-secondary); height: 32px; padding: 0 10px; border-radius: 6px; font-size: 13px; border: none; cursor: pointer; }
.btn-ghost:hover { background: var(--color-bg-elevated); color: var(--color-text-primary); }
```

---

## 九、表单元素

**Input / Select**
```css
.input { height: 40px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; font-size: 14px; color: var(--color-text-primary); font-family: var(--font-sans); width: 100%; }
.input::placeholder { color: var(--color-text-muted); }
.input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-glow); outline: none; }
.input.error { border-color: var(--color-danger); box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
```

**Textarea**：同 Input，`height: 120px; resize: vertical; padding: 12px`

**Select**：同 Input，`appearance: none`，右侧自定义箭头图标

---

## 十、分类筛选 Tab

```css
.filter-tab { height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.filter-tab:hover  { background: var(--color-bg-elevated); color: var(--color-text-primary); }
.filter-tab.active { background: rgba(79,70,229,0.1); color: var(--color-accent-light); border-color: rgba(79,70,229,0.3); }
```

位于列表页顶部，移动端横向滚动。

---

## 十一、分页组件

```css
.page-btn { width: 32px; height: 32px; border-radius: 8px; font-size: 14px; background: transparent; border: 1px solid var(--color-border); color: var(--color-text-secondary); cursor: pointer; }
.page-btn:hover  { background: var(--color-bg-elevated); color: var(--color-text-primary); }
.page-btn.active { background: var(--color-accent); color: white; border: none; }
```

上一页/下一页使用 Secondary 按钮样式。

---

## 十二、面包屑导航

`font-size: 13px`；链接色 `var(--color-text-secondary)`；当前页 `var(--color-text-primary)`；分隔符 `/` 用 `var(--color-text-muted)`；`margin-bottom: 16px`

---

## 十三、⌘K 全局搜索弹窗（SearchModal）

**触发**：点击搜索框 / `⌘K`（Mac）/ `Ctrl+K`（Win）；**关闭**：ESC / 点击遮罩

```
遮罩：position fixed; inset 0; z-index 100
      background rgba(0,0,0,0.6); backdrop-filter blur(4px)

弹窗：position fixed; top 20%; left 50%; transform translateX(-50%)
      width min(600px, 90vw)
      background var(--color-bg-elevated); border 1px solid var(--color-border)
      border-radius 16px; overflow hidden
      box-shadow 0 25px 50px rgba(0,0,0,0.5)

搜索输入框（弹窗顶部）：
  height 56px; font-size 18px; padding 0 20px 0 52px
  border none; background transparent
  border-bottom 1px solid var(--color-border)

结果列表：max-height 400px; overflow-y auto; padding 8px
结果项（height 56px; padding 0 16px）：
  Logo 32×32 | 工具名 14px/600 + 分类 12px/muted | 定价标签
  hover/激活 → background var(--color-bg-surface)

底部提示行：height 36px; border-top 1px var(--color-border)
  font-size 12px; color var(--color-text-muted)
  「↑↓ navigate  ↵ open  esc close」
```

搜索结果下拉（内联，非弹窗版）：
`position absolute; top 100%; background var(--color-bg-elevated); border 1px solid var(--color-border); border-radius 0 0 12px 12px; max-height 400px; z-index 50`
结果项 Logo 24×24，名称 14px/500，描述 12px/muted 单行截断。

---

## 十四、页面级布局规范

### 首页（/）

**Hero 区**（`padding: 48px 0 40px`，移动居中/桌面左对齐）
- 主标题：`2.25rem/700`（移动 `1.875rem`），`line-height: 1.2`，文案：`Discover 500+ AI Tools, Handpicked for You.`
- 副标题：`16px`，`var(--color-text-secondary)`，`margin-top: 12px`，文案：`Open-source directory. Submit your tool, get free backlinks.`
- 搜索框：`max-width: 560px; height: 48px; font-size: 16px; border-radius: 12px; margin-top: 24px`，带图标和 `⌘K` 提示

**Trending 区**：标题 `🔥 Trending`（18px/600）+ 副标题 `Most viewed this week`（13px/muted）；桌面 4 列网格，移动横向滚动（卡片 180px 宽）

**Featured 区**：标题 `⭐ Featured Tools` + 右侧 `Sponsored`（11px/muted）；桌面 2 列，移动 1 列；卡片 `border-left: 2px solid var(--color-featured-text)` + 金色渐变背景

**分类导航区**：`Browse by Category`（18px/600）；桌面 2 列，移动 1 列；每张分类卡 `height: 72px`，含 emoji(24px) + 分类名(15px/600) + 工具数(12px/muted) + 右侧 5 个 Logo 堆叠(16×16)

**最新收录区**：`🆕 Recently Added`（18px/600）；标准卡片网格；显示最近 20 个；底部 `View all tools →` 链接

**提交 CTA 区**
```
background: linear-gradient(rgba(79,70,229,0.08), rgba(79,70,229,0.02))
border: 1px solid rgba(79,70,229,0.2); border-radius: 16px; padding: 40px 32px; text-align: center
标题：「Get 3 Free Backlinks for Your Tool」22px/700
副标题：「Submit your AI tool and get listed on GitHub (DA 100)...」
三条外链横向排列（✓图标 + 来源名 + DA值）
按钮组：Primary「Submit via GitHub PR」+ Secondary「Submit via Form」
```

### 工具列表页（/tools）

顶部：`All AI Tools (500+)`（28px/700）+ 筛选区（排序 Tab: Latest|Trending|Featured + Filter 按钮 + 定价快筛: All|Free|Freemium|Paid）→ 卡片网格 → 底部分页

筛选面板（展开）：`background var(--color-bg-elevated); border 1px solid var(--color-border); border-radius 12px; padding 20px`；含分类多选、定价、平台、标签；底部 `Clear Filters` + `Apply`

### 工具详情页（/tools/[category]/[slug]）

**双栏（桌面）**：左侧主内容（flex-1）+ 右侧信息栏（280px，`position: sticky; top: 72px`）

**工具头部**：Logo 64×64（移动 48×48），`border-radius: 12px; border: 1px solid var(--color-border)`；工具名 28px/700（移动 22px）；徽章行；一句话定位 16px/secondary；标签行

**Markdown 正文**（`assets/css/markdown.css`）
```css
h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
h3 { font-size: 17px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
p  { font-size: 15px; line-height: 1.7; color: var(--color-text-primary); margin-bottom: 12px; }
ul, ol { margin-left: 20px; margin-bottom: 12px; }
li { font-size: 15px; line-height: 1.6; margin-bottom: 4px; }
a  { color: var(--color-text-link); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: var(--font-mono); font-size: 13px; background: var(--color-bg-elevated); border-radius: 4px; padding: 2px 6px; }
```

**右侧信息栏**：`background var(--color-bg-surface); border 1px solid var(--color-border); border-radius 12px; padding 20px`
- `Visit Website ↗` Primary 全宽按钮（height 40px）
- 分割线：`1px var(--color-border); margin 16px 0`
- 信息项：label `11px/muted/uppercase/letter-spacing 0.08em` + value `14px/primary`
- 提交者区：GitHub 头像(20×20 圆形) + 用户名 + 网站链接（**dofollow**，`var(--color-text-link)`）

**Alternatives 区**：`Looking for Alternatives to [工具名]?` + 6张精简版卡片网格

### 提交页（/submit）

最大宽度 720px 居中；桌面双栏：表单（flex-1）+ 右侧激励卡片（300px，sticky）

**激励说明卡片**：`border: 1px solid rgba(79,70,229,0.3); border-radius: 12px; padding: 24px`；标题 `🎁 What You Get`（18px/700）；三条外链分割线展示（github.com DA100 / aifindr.org / contributors页）；底部 `Free forever. No account needed.`

**表单双轨 Tab**：`⎇ GitHub PR` | `📝 Online Form`
- GitHub PR 标签页：步骤1-4（数字圆圈序号）+ Markdown 模板预览框 + `Fork & Submit on GitHub →`
- Online Form 字段：Tool Name* / Website URL* / Category*(Select) / Pricing Type*(Radio: Free/Freemium/Paid) / Pricing Details* / One-line Description*(max 80) / Detailed Description*(Textarea min 100词) / Platforms(Checkbox: Web/Desktop/Mobile/API) / Your Website(optional) / Your GitHub Username(optional) + Turnstile + Primary 全宽 `Submit for Review` + 底部审核说明

### 贡献者页（/contributors）

列表：`Contributors`（28px/700）+ 副标题；排行榜表格（序号|头像|用户名|贡献数|个人网站|加入时间）；前三名 🥇🥈🥉

详情页：GitHub 头像（80×80 圆形）+ 用户名（24px/700）+ 个人网站链接（**dofollow**）+ 贡献数统计 + 该用户工具卡片网格

---

## 十五、交互动画

```css
/* 全局 */
* { transition-property: background-color, border-color, color, opacity, transform, box-shadow; transition-duration: 150ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

/* 卡片悬浮 */
.tool-card:hover { transform: translateY(-1px); transition-duration: 200ms; }

/* 页面进入 */
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.page-enter-active { animation: fadeIn 200ms ease; }
```

---

## 十六、骨架屏

```css
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-surface) 25%, var(--color-bg-elevated) 50%, var(--color-bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
```

---

## 十七、Toast 通知

`position: fixed; bottom: 16px; right: 16px`；`background var(--color-bg-elevated); border 1px solid var(--color-border); border-radius 10px; padding 12px 16px; min-width 240px; font-size 14px`
- 成功：`border-left: 3px solid var(--color-success)`
- 错误：`border-left: 3px solid var(--color-danger)`
- 进入：`translateX(100%) → translateX(0)`，300ms；退出：opacity → 0，300ms；3秒后自动消失

---

## 十八、空状态

居中，含 🔍 emoji + `No tools found`（18px/600）+ 描述文字 + `Browse All Tools` Secondary 按钮

---

## 十九、移动端适配

**底部 Tab 栏**（移动端专属）：`height 56px + safe-area-inset-bottom`；`background var(--color-bg-elevated); border-top 1px var(--color-border)`；5个Tab（Home/Browse/Trending/Submit/More）；图标 20px + 文字 10px；激活 `var(--color-accent)` / 未激活 `var(--color-text-muted)`

**移动端侧边栏**（抽屉式）：`width 280px; max-width 80vw; position fixed`；`translateX(-100%) → translateX(0)`，250ms ease；右侧遮罩点击关闭；顶部含 Logo + 关闭按钮

**移动端卡片**：单列，Logo 缩为 36×36，字体比桌面小 1px

---

## 二十、SEO Meta 模板

```
首页：   title「aifindr.org – Discover 500+ AI Tools, Free & Open Source」
分类页： title「Best [Category] AI Tools in 2026 – aifindr.org」
详情页： title「[Tool Name] – [One-line Description] | aifindr.org」（description 取 meta_description 字段）
博客：   title「[标题] | aifindr.org Blog」
```

---

## 二十一、可访问性

- 对比度：正文 AA（4.5:1），大标题 AA（3:1）
- 键盘：所有可交互元素可 Tab，搜索结果支持 ↑↓，弹窗 ESC 关闭
- 语义化：工具卡片 `<article>`，侧边栏 `<nav>`，主体 `<main>`，工具名 `<h2>`（详情页 `<h1>`）
- 图片：所有 `<img>` 带 `alt`，Logo 的 alt 为 `[工具名] logo`
