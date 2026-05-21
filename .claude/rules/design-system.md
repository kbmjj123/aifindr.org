# Rules: Design System

> 读取时机：创建或修改任何 UI 组件、页面样式时

---

## 一、设计原则

本设计系统基于以下核心美学方向，所有组件必须严格遵守：

- **字体哲学**：标题使用 `Syne`（几何感、高权重），正文使用 `DM Mono`（等宽、工程感）。禁止使用 Inter、Space Grotesk、Roboto 等通用 SaaS 字体。
- **强调色**：亮黄绿 `#c8ff00` 为唯一主强调色（夜间）/ `#5a7a00` 为日间变体，严禁使用紫蓝渐变。
- **背景质感**：夜间模式使用全页扫描线（scanlines）纹理，日间模式使用极浅纸质纹理。
- **极度克制**：无花哨装饰，所有颜色使用必须有语义意义。
- **暗色优先**：夜间为默认体验，日间为可选切换。

---

## 二、CSS 变量（复制到 `assets/css/main.css`）

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;600;700;800&display=swap');

/* ───────────────────────────────────────────
   夜间模式（默认）
─────────────────────────────────────────── */
:root,
[data-theme="dark"] {

  /* 背景层级 */
  --color-bg-base:        #080808;   /* 页面底层背景，近纯黑 */
  --color-bg-surface:     #0f0f0f;   /* 卡片背景 */
  --color-bg-elevated:    #161616;   /* 悬浮层、弹窗、侧边栏 */
  --color-bg-input:       #111111;   /* 输入框背景 */

  /* 边框 */
  --color-border:         #1e1e1e;   /* 默认边框 */
  --color-border-hover:   #2a2a2a;   /* 悬浮边框 */
  --color-border-active:  #c8ff00;   /* 激活/选中边框（主色调） */

  /* 文字 */
  --color-text-primary:   #f0f0f0;   /* 主要文字 */
  --color-text-secondary: #666666;   /* 次要文字、描述 */
  --color-text-muted:     #404040;   /* 弱化文字、占位符 */
  --color-text-link:      #a3c400;   /* 链接色（accent 偏暗） */

  /* 主强调色（亮黄绿系）*/
  --color-accent:         #c8ff00;   /* 主强调色 */
  --color-accent-dim:     rgba(200, 255, 0, 0.08);  /* 激活背景 */
  --color-accent-border:  rgba(200, 255, 0, 0.20);  /* 激活边框 */
  --color-accent-glow:    rgba(200, 255, 0, 0.12);  /* 焦点光晕 */

  /* 功能色 */
  --color-success:        #22c55e;
  --color-warning:        #ff9500;
  --color-danger:         #ef4444;
  --color-new:            #00d4ff;

  /* 徽章：Featured（橙） */
  --color-featured-bg:      rgba(255, 149, 0, 0.08);
  --color-featured-text:    #ff9500;
  --color-featured-border:  rgba(255, 149, 0, 0.20);

  /* 徽章：Verified（绿） */
  --color-verified-bg:      rgba(34, 197, 94, 0.08);
  --color-verified-text:    #22c55e;
  --color-verified-border:  rgba(34, 197, 94, 0.20);

  /* 徽章：New（青） */
  --color-new-bg:           rgba(0, 212, 255, 0.08);
  --color-new-text:         #00d4ff;
  --color-new-border:       rgba(0, 212, 255, 0.20);

  /* 定价标签 */
  --color-pricing-free-bg:       rgba(34, 197, 94, 0.08);
  --color-pricing-free-text:     #22c55e;
  --color-pricing-free-border:   rgba(34, 197, 94, 0.20);
  --color-pricing-freemium-bg:   rgba(0, 212, 255, 0.08);
  --color-pricing-freemium-text: #00d4ff;
  --color-pricing-freemium-border: rgba(0, 212, 255, 0.20);
  --color-pricing-paid-bg:       rgba(167, 139, 250, 0.08);
  --color-pricing-paid-text:     #a78bfa;
  --color-pricing-paid-border:   rgba(167, 139, 250, 0.20);

  /* 阴影 */
  --shadow-card:   0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px var(--color-border);
  --shadow-hover:  0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px var(--color-border-hover);
  --shadow-active: 0 0 0 2px var(--color-accent-glow), 0 0 0 1px var(--color-accent);
  --shadow-modal:  0 25px 60px rgba(0,0,0,0.7);

  /* 页面背景纹理 */
  --bg-texture: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.012) 2px,
    rgba(255,255,255,0.012) 4px
  );
}

/* ───────────────────────────────────────────
   日间模式
─────────────────────────────────────────── */
[data-theme="light"] {

  /* 背景层级 */
  --color-bg-base:        #f5f4f0;   /* 页面底层，极浅暖米白 */
  --color-bg-surface:     #ffffff;   /* 卡片背景 */
  --color-bg-elevated:    #f0efe9;   /* 悬浮层、弹窗 */
  --color-bg-input:       #f8f7f3;   /* 输入框背景 */

  /* 边框 */
  --color-border:         #e4e3de;
  --color-border-hover:   #d0cfc9;
  --color-border-active:  #5a7a00;

  /* 文字 */
  --color-text-primary:   #141414;
  --color-text-secondary: #6b6a66;
  --color-text-muted:     #a09f9a;
  --color-text-link:      #4d6a00;

  /* 主强调色（日间用深黄绿）*/
  --color-accent:         #5a7a00;
  --color-accent-dim:     rgba(90, 122, 0, 0.08);
  --color-accent-border:  rgba(90, 122, 0, 0.20);
  --color-accent-glow:    rgba(90, 122, 0, 0.12);

  /* 功能色 */
  --color-success:        #16a34a;
  --color-warning:        #d97706;
  --color-danger:         #dc2626;
  --color-new:            #0891b2;

  /* 徽章：Featured */
  --color-featured-bg:      rgba(217, 119, 6, 0.08);
  --color-featured-text:    #d97706;
  --color-featured-border:  rgba(217, 119, 6, 0.20);

  /* 徽章：Verified */
  --color-verified-bg:      rgba(22, 163, 74, 0.08);
  --color-verified-text:    #16a34a;
  --color-verified-border:  rgba(22, 163, 74, 0.20);

  /* 徽章：New */
  --color-new-bg:           rgba(8, 145, 178, 0.08);
  --color-new-text:         #0891b2;
  --color-new-border:       rgba(8, 145, 178, 0.20);

  /* 定价标签 */
  --color-pricing-free-bg:       rgba(22, 163, 74, 0.08);
  --color-pricing-free-text:     #16a34a;
  --color-pricing-free-border:   rgba(22, 163, 74, 0.20);
  --color-pricing-freemium-bg:   rgba(8, 145, 178, 0.08);
  --color-pricing-freemium-text: #0891b2;
  --color-pricing-freemium-border: rgba(8, 145, 178, 0.20);
  --color-pricing-paid-bg:       rgba(109, 40, 217, 0.08);
  --color-pricing-paid-text:     #7c3aed;
  --color-pricing-paid-border:   rgba(109, 40, 217, 0.20);

  /* 阴影（日间用更浅的阴影） */
  --shadow-card:   0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--color-border);
  --shadow-hover:  0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px var(--color-border-hover);
  --shadow-active: 0 0 0 2px var(--color-accent-glow), 0 0 0 1px var(--color-accent);
  --shadow-modal:  0 25px 60px rgba(0,0,0,0.20);

  /* 页面背景纹理（日间用极细纸纹） */
  --bg-texture: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f5f4f0'/%3E%3Crect x='0' y='0' width='1' height='1' fill='rgba(0,0,0,0.018)'/%3E%3C/svg%3E");
}

/* ───────────────────────────────────────────
   圆角系统（两套主题共享）
─────────────────────────────────────────── */
:root {
  --radius-sm:    4px;
  --radius-md:    6px;    /* 按钮、输入框 */
  --radius-lg:    10px;   /* 卡片 */
  --radius-xl:    14px;   /* 弹窗、大卡片 */
  --radius-full:  9999px; /* 胶囊形徽章、标签 */

  /* 字体 */
  --font-sans:  'Syne', -apple-system, sans-serif;          /* 标题专用 */
  --font-body:  'DM Mono', 'Fira Code', monospace;          /* 正文、UI文字 */
  --font-mono:  'DM Mono', 'Fira Code', monospace;          /* 代码块 */
}
```

### 主题切换实现（Vue / Nuxt）

```typescript
// composables/useTheme.ts
export const useTheme = () => {
  const theme = useCookie<'dark' | 'light'>('theme', { default: () => 'dark' })

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  const init = () => {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return { theme, toggle, init }
}
```

`app.vue` 中在 `<html>` 标签添加 `:data-theme="theme"` 并在 `onMounted` 调用 `init()`。

---

## 三、字体使用规范

| 用途 | 字体 | 字重 | 说明 |
|:---|:---|:---|:---|
| 页面主标题、区块标题、Logo 站名、卡片工具名 | `Syne` | 700 / 800 | 几何感强，字间距 `-0.5px` 以上 |
| 正文、描述、标签、按钮文字、导航项、输入框 | `DM Mono` | 400 / 500 | 等宽字体营造工具感 |
| 代码块 | `DM Mono` | 400 | 同正文字体，保持统一 |

**禁止使用**：Inter、Roboto、Space Grotesk、Arial、system-ui 等通用字体作为主字体。

---

## 四、响应式断点

| 断点 | 宽度 | 布局 |
|:---|:---|:---|
| 默认 | < 640px | 单列，侧边栏收起，底部 Tab 栏 |
| sm | 640px+ | 2列卡片网格 |
| md | 768px+ | 侧边栏可展开 |
| lg | 1024px+ | 固定侧边栏，3列网格 |
| xl | 1280px+ | 4列网格 |
| 2xl | 1536px+ | 最大宽度 1400px，居中 |

---

## 五、全局背景纹理

```css
/* assets/css/main.css — body 级别应用 */
body {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--bg-texture);
  pointer-events: none;
  z-index: 0;
}

/* 所有内容层级必须高于纹理层 */
#app { position: relative; z-index: 1; }
```

---

## 六、整体页面框架

```
顶部导航（fixed, h-[52px], z-50）
├── 左侧边栏（fixed, w-[220px], top-[52px]，桌面端）
└── 主内容区（pl-[220px] 桌面 / pl-0 移动，max-w 自适应，padding 24px）
```

移动端：侧边栏隐藏，顶部导航保留搜索图标，底部固定 Tab 栏。

---

## 七、顶部导航栏（AppHeader）

- 高度 `52px`，`position: fixed; top: 0; z-index: 50`
- 背景 `rgba(8,8,8,0.92)` 夜间 / `rgba(245,244,240,0.92)` 日间
- `backdrop-filter: blur(20px)`
- 底部 `1px solid var(--color-border)`

**布局（左→右）**：Logo 区 | 搜索框（340px，居中） | Submit Tool 按钮 | 主题切换图标 | GitHub 图标

### Logo 区

```css
.logo-icon {
  width: 28px; height: 28px;
  background: var(--color-accent);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-sans);
  font-weight: 800; font-size: 13px;
  color: #000;                        /* 永远黑色，无论模式 */
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.logo-text {
  font-family: var(--font-sans);
  font-weight: 700; font-size: 15px;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.logo-text .org { color: var(--color-text-muted); font-weight: 400; }
```

### 搜索框（桌面内联）

```css
.header-search {
  flex: 1; max-width: 340px; height: 34px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; cursor: text;
  transition: border-color 0.15s;
  margin: 0 auto;
}
.header-search:hover { border-color: var(--color-border-hover); }

.header-search .search-icon { width: 13px; height: 13px; stroke: var(--color-text-muted); }
.header-search .placeholder { font-family: var(--font-body); font-size: 12px; color: var(--color-text-muted); flex: 1; }
.header-search .kbd {
  font-size: 10px; color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 3px; padding: 1px 5px;
  font-family: var(--font-body);
}
```

移动端：点击搜索图标展开全屏覆盖层（见第十五节）。

### Submit Tool 按钮

```css
.btn-header-submit {
  height: 30px; padding: 0 12px;
  background: var(--color-accent);
  color: #000;                        /* 永远黑色 */
  font-family: var(--font-body);
  font-size: 11px; font-weight: 500;
  border: none; border-radius: var(--radius-md);
  cursor: pointer; white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-header-submit:hover { opacity: 0.82; }
```

### 主题切换按钮

```css
.btn-theme-toggle {
  width: 28px; height: 28px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--color-text-secondary);
  transition: all 0.15s;
}
.btn-theme-toggle:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}
/* 图标：夜间显示 ☀️ 图标（切换到日间），日间显示 🌙 图标（切换到夜间） */
```

**GitHub 图标**：`20×20`，`color: var(--color-text-secondary)`，hover → `var(--color-text-primary)`

---

## 八、左侧边栏（AppSidebar）

```css
.sidebar {
  width: 220px;
  position: fixed; left: 0; top: 52px; bottom: 0;
  background: var(--color-bg-base);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 20px 12px;
}
```

### 顶部统计区

```css
.sidebar-stats {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: var(--color-border);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 20px;
}
.stat-item {
  background: var(--color-bg-surface);
  padding: 10px 10px 8px;
}
.stat-item:last-child { grid-column: 1 / -1; }

.stat-num {
  font-family: var(--font-sans);
  font-weight: 800; font-size: 18px;
  color: var(--color-accent);
  line-height: 1; letter-spacing: -0.5px;
}
.stat-label {
  font-size: 9px; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-top: 2px; font-family: var(--font-body);
}
```

### 导航项

```css
.nav-section-title {
  font-size: 9px; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.12em;
  padding: 0 8px; margin-bottom: 4px; margin-top: 16px;
  font-family: var(--font-body);
}

.nav-item {
  display: flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 8px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 12px; font-weight: 400;
  color: var(--color-text-muted);
  cursor: pointer; border-left: 2px solid transparent;
  transition: all 0.12s ease;
}
.nav-item:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}
.nav-item.active {
  background: var(--color-accent-dim);
  color: var(--color-text-primary);
  border-left-color: var(--color-accent);
}
.nav-item .nav-count {
  margin-left: auto;
  font-size: 10px; color: var(--color-text-muted);
}
```

**主导航列表**：🏠 Home / 🔥 Trending / ⭐ Featured / 🆕 New / 🔍 All Tools

**分类导航**：🖼️ Image & Design / ✍️ Writing / 🎬 Video / 🎵 Audio / 💻 Code / ⚡ Productivity / 📈 Marketing / 📊 Data / 📚 Education / 💼 Business / 🔬 Research / ··· Other（各带数量徽章）

**底部链接**：Submit a Tool / Open Source on GitHub / Blog（同 `.nav-item` 样式，font-size 11px）

---

## 九、工具卡片（ToolCard）— 核心组件

### 卡片容器

```css
.tool-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px; cursor: pointer;
  transition: all 0.18s ease;
  position: relative; overflow: hidden;
}
.tool-card::after {
  content: ''; position: absolute; inset: 0;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  pointer-events: none;
  transition: border-color 0.18s;
}
.tool-card:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}
.tool-card:hover::after {
  border-color: var(--color-accent-dim);
}
```

### 内部布局

```
┌──────────────────────────────────────────────────────┐
│  [Logo 36×36]  [工具名 Syne 13px/600]   [徽章] [↗]  │
│                [描述 DM Mono 11px，2行截断]           │
│                [标签1] [标签2] [定价标签]            │
└──────────────────────────────────────────────────────┘
```

### Logo

```css
.tool-logo {
  width: 36px; height: 36px;
  border-radius: 7px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  object-fit: cover; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-sans); font-weight: 700;
  font-size: 11px; color: var(--color-text-muted);
}
```

### 工具名

```css
.tool-name {
  font-family: var(--font-sans);
  font-weight: 600; font-size: 13px;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
```

### 描述

```css
.tool-desc {
  font-family: var(--font-body);
  font-size: 11px; color: var(--color-text-secondary); line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  margin-bottom: 10px;
}
```

### 外链箭头（右上角）

```css
.card-ext-link { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-ext-link svg { width: 11px; height: 11px; stroke: var(--color-text-muted); fill: none; stroke-width: 2; }
.tool-card:hover .card-ext-link svg { stroke: var(--color-accent); }
```

### 卡片网格

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
```

---

## 十、标签 & 徽章

### 通用分类标签（ToolTag）

```css
.tag {
  height: 18px; padding: 0 7px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-body); font-size: 9px;
  color: var(--color-text-secondary);
  text-transform: lowercase; letter-spacing: 0.03em;
  display: inline-flex; align-items: center;
  white-space: nowrap;
}
```

### 定价标签

```css
/* 使用 CSS 变量，自动适配日夜间 */
.tag-free      { background: var(--color-pricing-free-bg);      color: var(--color-pricing-free-text);      border: 1px solid var(--color-pricing-free-border); }
.tag-freemium  { background: var(--color-pricing-freemium-bg);  color: var(--color-pricing-freemium-text);  border: 1px solid var(--color-pricing-freemium-border); }
.tag-paid      { background: var(--color-pricing-paid-bg);      color: var(--color-pricing-paid-text);      border: 1px solid var(--color-pricing-paid-border); }
```

共用容器：`height: 18px; padding: 0 7px; border-radius: var(--radius-full); font-family: var(--font-body); font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; align-items: center;`

### 徽章（ToolBadge）

```css
/* 共用容器 */
.badge {
  height: 16px; padding: 0 6px;
  border-radius: var(--radius-full);
  font-family: var(--font-body); font-size: 9px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.06em;
  display: inline-flex; align-items: center; gap: 3px;
  border: 1px solid;
}

.badge-featured { background: var(--color-featured-bg); color: var(--color-featured-text); border-color: var(--color-featured-border); }
.badge-verified { background: var(--color-verified-bg); color: var(--color-verified-text); border-color: var(--color-verified-border); }
.badge-new      { background: var(--color-new-bg);      color: var(--color-new-text);      border-color: var(--color-new-border); }
```

---

## 十一、按钮系统

```css
/* Primary — 强调色背景，永远黑色文字 */
.btn-primary {
  background: var(--color-accent);
  color: #000;                          /* 固定黑色，无论模式 */
  height: 36px; padding: 0 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  border: none; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn-primary:hover  { opacity: 0.82; }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Secondary — 描边按钮 */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  height: 36px; padding: 0 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  border: 1px solid var(--color-border); cursor: pointer;
  transition: all 0.15s;
}
.btn-secondary:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-hover);
}

/* Ghost — 文字按钮 */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  height: 30px; padding: 0 10px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 11px;
  border: none; cursor: pointer;
  transition: all 0.12s;
}
.btn-ghost:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}
```

---

## 十二、表单元素

### Input / Textarea / Select

```css
.input {
  height: 40px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  font-family: var(--font-body); font-size: 13px;
  color: var(--color-text-primary);
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: var(--color-text-muted); }
.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-glow);
  outline: none;
}
.input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
}

/* Textarea */
.textarea { /* 同 .input */ height: 120px; resize: vertical; padding: 12px; }

/* Select */
.select { /* 同 .input */ appearance: none; padding-right: 32px; /* 右侧自定义箭头 */ cursor: pointer; }
```

---

## 十三、分类筛选 Tab

```css
.filter-tabs { display: flex; gap: 4px; overflow-x: auto; /* 移动端滚动 */ }

.filter-tab {
  height: 30px; padding: 0 12px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 11px; font-weight: 500;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer; white-space: nowrap;
  transition: all 0.12s;
}
.filter-tab:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}
.filter-tab.active {
  background: var(--color-accent-dim);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}
```

---

## 十四、分页组件

```css
.page-btn {
  width: 32px; height: 32px;
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.12s;
}
.page-btn:hover { background: var(--color-bg-elevated); color: var(--color-text-primary); }
.page-btn.active {
  background: var(--color-accent);
  color: #000;                          /* 固定黑色 */
  border-color: transparent;
}
```

上一页/下一页使用 `.btn-secondary` 样式，居中对齐。

---

## 十五、面包屑导航

```css
.breadcrumb { font-family: var(--font-body); font-size: 11px; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
.breadcrumb a { color: var(--color-text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--color-text-primary); }
.breadcrumb .sep { color: var(--color-text-muted); }
.breadcrumb .current { color: var(--color-text-primary); }
```

---

## 十六、⌘K 全局搜索弹窗（SearchModal）

**触发**：点击搜索框 / `⌘K`（Mac）/ `Ctrl+K`（Win）；**关闭**：ESC / 点击遮罩

```css
/* 遮罩 */
.search-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
}

/* 弹窗 */
.search-modal {
  position: fixed; top: 18%; left: 50%; transform: translateX(-50%);
  width: min(600px, 90vw);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-modal);
}

/* 搜索输入区 */
.search-modal-input {
  height: 54px; font-family: var(--font-body); font-size: 15px;
  padding: 0 20px 0 50px;   /* 左侧留搜索图标位 */
  border: none; background: transparent; outline: none;
  color: var(--color-text-primary); width: 100%;
  border-bottom: 1px solid var(--color-border);
}
.search-modal-input::placeholder { color: var(--color-text-muted); }

/* 结果列表 */
.search-results { max-height: 380px; overflow-y: auto; padding: 6px; }

/* 结果项 */
.search-result-item {
  height: 52px; padding: 0 14px;
  display: flex; align-items: center; gap: 10px;
  border-radius: var(--radius-md); cursor: pointer;
  transition: background 0.1s;
}
.search-result-item:hover,
.search-result-item.active { background: var(--color-bg-surface); }

/* Logo 32×32, 名称 Syne 13px/600, 分类 DM Mono 11px/muted, 定价标签右侧 */

/* 底部提示行 */
.search-modal-footer {
  height: 34px; border-top: 1px solid var(--color-border);
  padding: 0 14px; display: flex; align-items: center;
  font-family: var(--font-body); font-size: 10px; color: var(--color-text-muted);
  gap: 14px;
}
/* 内容：↑↓ navigate  ↵ open  esc close */
```

---

## 十七、Markdown 正文渲染（`assets/css/markdown.css`）

```css
.markdown { font-family: var(--font-body); }

.markdown h2 {
  font-family: var(--font-sans); font-size: 18px; font-weight: 700;
  color: var(--color-text-primary); letter-spacing: -0.3px;
  margin-top: 32px; margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border); padding-bottom: 8px;
}
.markdown h3 {
  font-family: var(--font-sans); font-size: 15px; font-weight: 600;
  color: var(--color-text-primary); letter-spacing: -0.2px;
  margin-top: 24px; margin-bottom: 8px;
}
.markdown p  { font-size: 13px; line-height: 1.75; color: var(--color-text-primary); margin-bottom: 12px; }
.markdown ul, .markdown ol { margin-left: 20px; margin-bottom: 12px; }
.markdown li { font-size: 13px; line-height: 1.65; margin-bottom: 4px; color: var(--color-text-primary); }
.markdown a  { color: var(--color-text-link); text-decoration: none; }
.markdown a:hover { text-decoration: underline; }
.markdown code {
  font-family: var(--font-mono); font-size: 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); padding: 2px 6px;
  color: var(--color-accent);
}
.markdown pre {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 14px;
  overflow-x: auto; margin-bottom: 16px;
}
.markdown pre code { background: none; border: none; padding: 0; color: var(--color-text-primary); }
```

---

## 十八、页面级布局规范

### 18.1 首页（/）

**Hero 区**（`padding: 48px 0 36px`）

```css
.hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 0 10px;
  background: var(--color-accent-dim); border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-full);
  font-family: var(--font-body); font-size: 10px; color: var(--color-accent);
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-bottom: 16px;
}
.hero-tag::before { content: ''; width: 5px; height: 5px; background: var(--color-accent); border-radius: 50%; }

h1.hero-title {
  font-family: var(--font-sans); font-weight: 800;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.05; letter-spacing: -1.5px;
  color: var(--color-text-primary); margin-bottom: 10px;
}
h1.hero-title em { font-style: normal; color: var(--color-accent); }

.hero-sub { font-family: var(--font-body); font-size: 13px; color: var(--color-text-secondary); line-height: 1.65; max-width: 480px; margin-bottom: 20px; }
```

搜索框（Hero 版）：`max-width: 560px; height: 48px; font-size: 14px; border-radius: var(--radius-lg)`，含搜索图标和 `⌘K` 提示。

**Trending 区**：标题 `🔥 Trending`（Syne 15px/700）+ 副标题 `Most viewed this week`（DM Mono 11px/muted）+ 工具卡片网格（桌面 4列，移动横向滚动，卡片宽 180px）

**Featured 区**：标题 `⭐ Featured Tools` + 右侧 `Sponsored`（DM Mono 10px/muted）；桌面 2 列，移动 1 列；卡片 `border-left: 2px solid var(--color-featured-text)` + `background: linear-gradient(135deg, rgba from --color-featured-bg 0%, transparent 60%)`

**分类导航区**：`Browse by Category`（Syne 15px/700）；`grid grid-cols-2 lg:grid-cols-3 gap-2`；每张分类卡 `height: 64px; display: flex; align-items: center; gap: 10px`，含 emoji(18px) + 分类名(Syne 12px/600) + 数量(DM Mono 10px/muted)

**最新收录区**：`🆕 Recently Added`（Syne 15px/700）；标准卡片网格；显示最近 20 个；底部 `View all tools →`（ghost 链接）

**提交 CTA 区**

```css
.cta-section {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-xl); padding: 32px; text-align: center;
  position: relative; overflow: hidden;
}
.cta-section::before {
  content: ''; position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 150px;
  background: radial-gradient(ellipse, var(--color-accent-glow) 0%, transparent 70%);
  pointer-events: none;
}
```

标题：Syne 20px/800，字间距 -0.5px；副标题：DM Mono 12px/muted；三条外链横向排列（✓圆形图标 + 域名 + DA 值）；按钮组：Primary `Submit via GitHub PR` + Secondary `Submit via Form`

---

### 18.2 工具列表页（/tools）

顶部：`All AI Tools (500+)`（Syne 24px/800）+ 分类筛选 Tab + Filter 按钮 + 定价快筛（All/Free/Freemium/Paid）→ 工具卡片网格 → 底部分页

**筛选面板（展开）**：`background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 20px`；含分类多选、定价、平台、标签；底部 Clear Filters + Apply

---

### 18.3 工具详情页（/tools/[category]/[slug]）

**双栏（桌面）**：左侧主内容（flex-1）+ 右侧信息栏（270px，`position: sticky; top: 68px`）

**工具头部**

```css
.tool-detail-logo { width: 64px; height: 64px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
/* 移动端 48×48 */

.tool-detail-name {
  font-family: var(--font-sans); font-weight: 800; font-size: 26px;
  letter-spacing: -1px; color: var(--color-text-primary);
}
/* 移动端 20px */
```

**右侧信息栏**

```css
.detail-sidebar {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 18px;
}
.detail-sidebar-label {
  font-family: var(--font-body); font-size: 9px; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;
}
.detail-sidebar-value { font-family: var(--font-body); font-size: 13px; color: var(--color-text-primary); margin-bottom: 12px; }
```

- `Visit Website ↗` Primary 全宽按钮（height 38px）
- 分割线：`1px solid var(--color-border); margin: 14px 0`
- 提交者区：GitHub 头像(20×20 圆形) + 用户名 + 网站链接（**dofollow**，`color: var(--color-text-link)`）

**Alternatives 区**：`Looking for Alternatives to [工具名]?`（Syne 15px/700）+ 6张精简卡片网格

---

### 18.4 提交页（/submit）

最大宽度 720px 居中；桌面双栏：表单（flex-1）+ 右侧激励卡片（280px，sticky）

**激励说明卡片**

```css
.incentive-card {
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-lg); padding: 20px;
  background: var(--color-bg-surface);
}
```

标题：`🎁 What You Get`（Syne 16px/700）；三条外链带分割线（github.com DA 100 / aifindr.org / contributors页）；底部：`Free forever. No account needed.`（DM Mono 11px/muted）

**表单双轨 Tab**：`⎇ GitHub PR` | `📝 Online Form`（使用 `.filter-tab` 样式）

- GitHub PR 标签页：步骤 1-4（数字圆圈序号）+ DM Mono 代码预览框 + `Fork & Submit on GitHub →`
- Online Form 字段：Tool Name* / Website URL* / Category*(Select) / Pricing Type*(Radio) / Pricing Details* / One-line Description*(max 80) / Detailed Description*(Textarea min 100词) / Platforms(Checkbox) / Your Website / Your GitHub + Turnstile + Primary 全宽 `Submit for Review` + 底部审核时间说明

---

### 18.5 贡献者页（/contributors）

**列表**：`Contributors`（Syne 24px/800）+ 副标题（DM Mono 12px/muted）；排行榜表格（序号|头像|用户名|贡献数|个人网站|加入时间）；前三名 🥇🥈🥉

**详情页**：GitHub 头像（80×80 圆形）+ 用户名（Syne 22px/700）+ 个人网站链接（**dofollow**，`color: var(--color-text-link)`）+ 贡献数统计（DM Mono）+ 该用户工具卡片网格

---

## 十九、交互动画

```css
/* 全局过渡（仅必要属性，避免 all） */
*, *::before, *::after {
  transition-property: background-color, border-color, color, opacity, transform, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 卡片悬浮 */
.tool-card:hover { transform: translateY(-1px); transition-duration: 200ms; }

/* 页面进入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter-active { animation: fadeIn 200ms ease; }

/* 主题切换（防止闪烁） */
[data-theme-transitioning] * {
  transition-duration: 250ms !important;
}
```

---

## 二十、骨架屏

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 25%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
  border-radius: var(--radius-sm);
}
```

---

## 二十一、Toast 通知

```css
.toast {
  position: fixed; bottom: 16px; right: 16px; z-index: 300;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 11px 14px; min-width: 220px;
  font-family: var(--font-body); font-size: 12px;
  color: var(--color-text-primary);
  box-shadow: var(--shadow-hover);
}
.toast.success { border-left: 3px solid var(--color-success); }
.toast.error   { border-left: 3px solid var(--color-danger); }
```

进入：`translateX(110%) → translateX(0)`，280ms ease；退出：opacity → 0，280ms；3秒后自动消失。

---

## 二十二、空状态

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; gap: 10px;
}
.empty-state .icon   { font-size: 28px; }
.empty-state h3      { font-family: var(--font-sans); font-weight: 700; font-size: 16px; letter-spacing: -0.3px; color: var(--color-text-primary); }
.empty-state p       { font-family: var(--font-body); font-size: 12px; color: var(--color-text-muted); text-align: center; }
```

内容：🔍 图标 + `No tools found`（h3）+ 描述文字 + `.btn-secondary` 按钮 `Browse All Tools`

---

## 二十三、移动端适配

### 底部 Tab 栏（移动端专属）

```css
.mobile-tabbar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
  display: flex; align-items: flex-start;
}
.mobile-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding-top: 10px; gap: 3px;
  font-family: var(--font-body); font-size: 9px; color: var(--color-text-muted);
  cursor: pointer; transition: color 0.12s;
}
.mobile-tab svg { width: 20px; height: 20px; }
.mobile-tab.active { color: var(--color-accent); }
```

5个 Tab：Home / Browse / Trending / Submit / More

### 移动端侧边栏（抽屉式）

```css
.sidebar-drawer {
  width: 280px; max-width: 82vw;
  position: fixed; left: 0; top: 0; bottom: 0; z-index: 150;
  background: var(--color-bg-elevated);
  transform: translateX(-100%);
  transition: transform 250ms ease;
  border-right: 1px solid var(--color-border);
}
.sidebar-drawer.open { transform: translateX(0); }
```

右侧遮罩：`rgba(0,0,0,0.6)` 夜间 / `rgba(0,0,0,0.3)` 日间，点击关闭。顶部含 Logo + 关闭按钮。

### 移动端卡片调整

- Logo 缩为 `32×32px`
- 工具名：Syne 12px
- 描述：DM Mono 10px
- 标签高度：`16px`，字号 `9px`

---

## 二十四、SEO Meta 模板

```
首页：   title「aifindr.org – Discover 500+ AI Tools, Free & Open Source」
分类页： title「Best [Category] AI Tools in 2026 – aifindr.org」
详情页： title「[Tool Name] – [One-line Description] | aifindr.org」（description 取 meta_description 字段）
博客：   title「[文章标题] | aifindr.org Blog」
```

---

## 二十五、可访问性

- **对比度**：正文 AA（4.5:1），大标题 AA（3:1）；日间模式下 accent `#5a7a00` 对白背景满足 AA 级
- **键盘导航**：所有可交互元素可 Tab；搜索结果支持 ↑↓；弹窗 ESC 关闭；主题切换按钮可聚焦
- **语义化 HTML**：工具卡片 `<article>`，侧边栏 `<nav>`，主体 `<main>`，工具名 `<h2>`（详情页 `<h1>`）
- **图片**：所有 `<img>` 带 `alt`；Logo 的 alt 为 `[工具名] logo`
- **主题偏好**：通过 `prefers-color-scheme` 检测系统偏好作为初始值，但以用户手动选择优先

```typescript
// 初始化主题时：系统偏好作为 fallback
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const savedTheme = useCookie('theme').value
const initialTheme = savedTheme ?? (prefersDark ? 'dark' : 'light')
document.documentElement.setAttribute('data-theme', initialTheme)
```