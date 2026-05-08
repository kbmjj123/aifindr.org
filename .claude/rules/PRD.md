# aifindr.org 产品需求文档（PRD）

> 版本：v1.2
> 域名：aifindr.org
> 定位：开源、社区驱动的 AI 工具目录站 → 内容反链自动化平台
> 技术栈：Nuxt 4 + Tailwind CSS + Cloudflare（Pages / D1 / Workers / R2 / Turnstile）
> 部署方式：SSG（核心页面）+ ISR（工具详情页），免服务器

---

## 一、产品概述

### 1.1 产品定位

aifindr.org 是一个**开源、社区驱动**的 AI 工具目录站，同时也是一个**内容反链自动化平台**。用户可以在站点上搜索和发现 AI 工具，工具作者和站长可以通过 GitHub PR 或在线表单提交工具，提交成功后自动获得多条高权重外链作为激励。

**产品进化路径：**

```
Level 1  工具收录站（MVP）
    └── 工具目录 + 基础分类 + 静态评分

Level 2  智能推荐 + 内容生成（数据积累后）
    └── AI 推荐 + 工具组合配方 + AI 文章生成 + 多平台发布插件

Level 3  行业数据权威（持续运营后）
    └── 效果追踪 + 行业数据报告 + 诊断服务

Level 4  垂直 Agent 平台（终极形态）
    └── 自动化 SEO 执行 + GEO 可见性追踪
```

### 1.2 核心价值

- **对访客**：快速找到适合场景的 AI 工具，内容深度、原创、有参考价值
- **对提交者**：免费获得来自 GitHub、aifindr.org、贡献者页面的多条 dofollow 外链
- **对付费用户**：AI 生成多平台文章内容 + 浏览器插件一键发布，低成本获取高质量反链
- **对项目**：社区驱动内容生产，降低运营成本；开源代码吸引开发者生态

### 1.3 竞品差异化定位

当前主流竞品（Futurepedia、FutureTools 等）的共同短板：

| 竞品现状 | aifindr.org 差异化 |
|:---|:---|
| 只做"工具展示"，停在静态收录层 | 工具收录 + AI 智能推荐 + 执行辅助 |
| 没有真实用户效果反馈 | 提交效果追踪 + 真实用户评分 |
| 没有工具组合推荐 | 场景化"工具配方"推荐 |
| AI 能力仅用于搜索 | 深度 AI 诊断 + 内容生成 |
| 平台数据没有被利用 | 行业数据报告对外输出 |
| 无内容发布辅助 | 浏览器插件一键多平台发布 |

**核心定位差异：** 竞品做"工具的黄页"，aifindr.org 做"工具的参谋"——不只告诉用户有什么工具，还告诉用户该用哪个、怎么用、用完效果如何。

### 1.4 商业模式

采用 **Open Core** 模式：

| 功能 | 是否免费 |
|:---|:---:|
| 基础收录（工具详情页 + 2条外链） | ✅ 免费 |
| Featured 首页置顶展示 | 💰 付费 |
| 加速审核（24小时内上线） | 💰 付费 |
| Editor's Pick 徽章 | 💰 付费 |
| Verified 认证标签 | 💰 付费 |
| 访问数据统计（点击量/曝光量） | 💰 付费 |
| AI 文章生成（单平台，每月3次） | ✅ 免费 |
| AI 文章生成（多平台适配，无限次） | 💰 付费 |
| 浏览器插件基础版 | ✅ 免费 |
| 浏览器插件付费版（多平台 + 追踪） | 💰 付费 |
| Newsletter 推广位 | 💰 付费 |
| API 数据访问权限 | 💰 付费（后期） |

---

## 二、用户角色

### 2.1 访客（Visitor）
- 搜索和浏览 AI 工具
- 按分类、定价、功能筛选
- 查看工具详情、对比工具
- 查看工具组合配方

### 2.2 提交者（Submitter）
- 通过 GitHub PR 提交工具（技术用户）
- 通过在线表单提交工具（普通用户）
- 目标：获得外链和曝光

### 2.3 内容发布者（Publisher）—— 新增角色
- 使用 AI 文章生成功能，为自己的站点生成高质量外链文章
- 通过浏览器插件将生成内容一键发布到 Medium、Dev.to 等平台
- 目标：低成本获取高质量反链，提升自身站点权重

### 2.4 站长/管理员（Admin）
- 审核提交内容
- 管理 Featured / Verified 标签
- 触发站点重新构建

---

## 三、功能模块

### 3.1 首页

**Hero 区**
- 站点标题 + 一句话定位描述
- 搜索框（全局搜索，支持工具名、描述、标签）
- 数据统计展示：已收录工具数量、分类数量、贡献者数量

**Trending 区**
- 展示 8 个当前热门工具（按点击量排序）
- 工具卡片：Logo + 名称 + 一句话描述

**Featured 区**
- 付费置顶工具，最多展示 6 个
- 带 Featured 标签标识，视觉区分

**分类导航区**
- 按功能分类展示，每个分类展示 5 个代表工具 Logo
- 点击跳转对应分类页

**最新收录区**
- 最新上线的 20 个工具列表
- 支持分页或无限滚动

**提交入口 CTA 区**
- 突出外链激励说明
- 两个按钮：GitHub PR 提交 / 在线表单提交

### 3.2 工具列表页（/tools）

**筛选面板（左侧或顶部）**
- 分类筛选（多选）
- 定价筛选：Free / Freemium / Paid
- 平台筛选：Web / Desktop / Mobile / API
- 标签筛选
- 排序：最新 / 最热 / Featured 优先

**工具卡片**
- Logo（32×32）
- 封面图（可选，列表卡片模式下展示）
- 工具名
- 一句话描述
- 分类标签
- 定价标识
- Featured / Verified / New 徽章（如有）
- 视频标识（如有 Demo 视频则展示 ▶ 图标）
- 点击量展示（可选）

**分页**
- 每页 24 个
- 支持页码导航

### 3.3 分类页（/tools/[category]）

- 分类标题 + 描述
- 该分类下所有工具（同列表页卡片）
- 分类相关的 Roundup Blog 文章推荐（侧边栏）
- SEO：Title = "[分类名] AI Tools – Find the Best [分类] Tools | aifindr.org"

**分类体系**

| 分类 slug | 显示名称 |
|:---|:---|
| `image` | Image & Design |
| `writing` | Writing & Content |
| `video` | Video & Animation |
| `audio` | Audio & Music |
| `code` | Code & Developer |
| `productivity` | Productivity |
| `marketing` | Marketing & SEO |
| `data` | Data & Analytics |
| `education` | Education & Learning |
| `business` | Business & Finance |
| `research` | Research & Search |
| `other` | Other |

### 3.4 工具详情页（/tools/[category]/[slug]）

**页面结构（从上到下）**

```
面包屑导航
工具 Logo + 名称 + 一句话定位 + 访问按钮
Featured / Verified / New 徽章
───────────────────────────────────
左侧主内容区（70%）：
  ## 媒体画廊
  封面图/截图画廊（最多展示 5 张，支持切换）
  Demo 视频嵌入（YouTube / Vimeo，优先展示）
  其他视频列表（教程、评测等）

  ## What is [工具名]?
  正文 Markdown 内容（富文本）

  ## Key Features
  功能列表

  ## Pros & Cons
  优缺点对比

  ## Who is it for?
  适合人群

  ## Pricing Details
  定价详情

  ## Alternatives
  推荐 3-5 个同类工具（内链）

右侧信息栏（30%）：
  定价类型
  官网链接（带外链）
  分类
  平台支持
  上线时间
  最后更新时间
  提交者信息 + 提交者网站链接（外链）
  分享按钮
───────────────────────────────────
底部：相关工具推荐（同分类 6 个）
```

**SEO 配置**
- Title：`[工具名] – [一句话定位] | aifindr.org`
- Meta Description：从 D1 元数据读取，150字以内
- OG Image：优先使用工具自定义 OG 图，fallback 自动生成
- Schema：SoftwareApplication 结构化数据，含 `image` 和 `video` 字段

### 3.5 提交页（/submit）

**双轨提交入口**

**方式一：GitHub PR（推荐，获得最高外链价值）**
- 说明 GitHub PR 流程
- 附 fork 仓库链接
- 展示 Markdown 模板预览
- 强调可获得的外链：github.com 外链（DA 100）

**方式二：在线表单**
- 基础字段：工具名、官网 URL、分类、定价类型、定价说明、一句话描述、详细描述、平台支持、提交者网站 URL、提交者 GitHub（选填）
- 媒体字段：封面图 URL、截图（最多5张）、Demo 视频 URL、附加视频（最多3个）
- Cloudflare Turnstile 验证（防垃圾）
- 提交后提示：预计 3-7 个工作日审核，付费可加速至 24 小时

**外链激励说明区**
- 清晰展示提交后可获得的 3 条外链
- 每条外链注明来源域名和 DA 值

### 3.6 贡献者页（/contributors）

**贡献者列表**
- 按贡献工具数量排序
- 每个贡献者：GitHub 头像 + 用户名 + 贡献数量 + 网站链接

**贡献者详情页（/contributors/[github-username]）**
- GitHub 头像 + 用户名
- 个人网站链接（dofollow 外链）
- 该用户提交的所有工具列表
- 贡献时间线

### 3.7 Blog 页（/blog）

**列表页**
- 文章卡片：标题 + 摘要 + 日期 + 分类标签

**文章详情页（/blog/[slug]）**
- Markdown 全文渲染
- 文章内自然推荐相关工具（内链到工具详情页）
- 右侧：相关工具推荐侧边栏

**内容策略（深度写作框架）**

| 框架 | 说明 | 更新频率 |
|:---|:---|:---|
| 横向对比框架 | 同类工具完整对比，统一评测维度，真实测试数据 | 月更 |
| 场景驱动框架 | 从用户实际问题出发，工具是解决方案而非主角 | 周更 |
| 数据实测框架 | 自己动手测试，真实数据说话，难以被 AI 批量复制 | 月更 |
| 知识体系框架 | 构建完整知识体系，单篇覆盖某一层，系列成护城河 | 持续 |
| 平台数据洞察 | 基于站内提交/使用数据生成，独家数据天然具备独特性 | 月更 |

### 3.8 搜索功能

- 全局搜索框（首页 + 顶部导航）
- 搜索范围：工具名、描述、标签、分类（查询 D1）
- 搜索结果实时展示，支持键盘导航（⌘K 快捷键）
- 早期使用 D1 LIKE 查询；流量增大后可平滑接入 Algolia / Fuse.js

### 3.9 AI 文章生成（/generate）—— 新模块

#### 3.9.1 核心定位

用户输入自己的站点 URL + 目标平台，AI 结合 aifindr.org 工具数据库，生成量身定制的多平台文章内容。

与通用 AI 写作工具的核心差异：**工具数据库 + 场景专精**，通用工具无法复制。

#### 3.9.2 用户操作流程

```
第一步：输入站点 URL + 选择主题方向 + 选择目标平台
        ↓
第二步：AI 生成内容（结合工具库数据，非通用写作）
        ↓
第三步：用户预览 + 微调
        ↓
第四步：点击"发布到 [平台]"→ 浏览器插件接管
        ↓
第五步：插件自动回传发布链接 → 平台记录效果
```

#### 3.9.3 支持的目标平台及内容风格

| 平台 | 内容风格 | 反链价值 |
|:---|:---|:---:|
| Medium | 故事性强，偏叙述，适合泛读者 | ⭐⭐⭐⭐⭐ |
| Dev.to | 技术感，代码友好，适合开发者 | ⭐⭐⭐⭐⭐ |
| Hashnode | 教程风格，步骤清晰 | ⭐⭐⭐⭐ |
| LinkedIn | 专业简洁，适合职场传播 | ⭐⭐⭐⭐ |
| Quora | 问答形式，自然植入链接 | ⭐⭐⭐⭐ |
| Reddit | 社区语气，避免明显推广感 | ⭐⭐⭐ |

#### 3.9.4 免费版 vs 付费版

| 功能 | 免费版 | 付费版 |
|:---|:---:|:---:|
| 单平台文章生成 | ✅（每月3次） | ✅ 无限 |
| 多平台适配版本 | ❌ | ✅ |
| 链接锚文本优化建议 | ❌ | ✅ |
| 配套社交媒体摘要 | ❌ | ✅ |
| 后续选题建议 | ❌ | ✅ |
| 发布效果追踪 | ❌ | ✅ |

### 3.10 浏览器插件（aifindr Publisher）—— 新模块

#### 3.10.1 产品定位

浏览器插件作为**独立产品**运营，同时作为 aifindr.org 主站的流量入口。插件本身是一个完整的内容发布助手，即使用户不使用主站，也具备独立使用价值。

**双入口导流逻辑：**

```
主站入口：用户有明确需求 → 来主站生成内容 → 用插件发布
插件入口：用户随手安装 → 日常使用中发现主站价值 → 转化为主站用户
```

#### 3.10.2 核心功能

**功能一：一键填充发布（与主站联动）**

```
主站生成文章内容
        ↓
用户点击"发布到 Medium"
        ↓
插件自动在新 Tab 打开 Medium 编辑器
        ↓
自动填充：标题 / 正文 / 标签 / 配图
        ↓
用户确认后点击 Medium 的"发布"按钮
        ↓
插件检测发布成功 → 自动回传发布链接到主站
        ↓
主站记录反链，用于效果追踪
```

用户全程仅需两次点击，其余全部自动完成。

**功能二：自有内容辅助发布（独立使用）**

用户写好自己的文章时，唤起插件：
- SEO 优化建议（标题 / 关键词 / 结构）
- 一键适配多平台格式（Markdown / 富文本互转）
- 自动生成标签建议
- 批量发布到多个平台

**功能三：旧内容再利用**

用户已有一篇旧文章：
- 插件读取内容
- AI 重写为不同平台风格（避免重复内容惩罚）
- 批量分发到新平台

**功能四：反链机会自动发现（核心独立价值）**

用户浏览任意网站时，插件后台静默检测当前页面是否存在：
- 资源收录页 / 目录提交入口
- 友链申请入口
- Guest Post 机会
- Awesome List 贡献入口

检测到后自动气泡提示："此页面可提交反链 →"，一键跳转主站完成提交。

**功能五：已发布内容监控**

插件持续监测已发布的文章：
- 文章是否仍在线
- 链接是否有效（防止反链失效）
- 基础互动数据（评论数、点赞数）
- 自动同步回主站效果追踪模块

#### 3.10.3 支持平台

| 平台 | 填充可行性 | 说明 |
|:---|:---:|:---|
| Medium | ⭐⭐⭐⭐⭐ | 编辑器结构清晰，DOM 可操作性强 |
| Dev.to | ⭐⭐⭐⭐⭐ | 支持 Markdown，填充最简单 |
| Hashnode | ⭐⭐⭐⭐⭐ | 类似 Dev.to，Markdown 友好 |
| LinkedIn | ⭐⭐⭐ | 编辑器相对封闭，基本填充可行 |
| Quora | ⭐⭐⭐ | 答题框可填充，难度中等 |
| Reddit | ⭐⭐⭐⭐ | 文本框简单，填充容易 |

#### 3.10.4 付费分层

**免费版**
- 单平台内容填充
- 基础格式适配
- 每月限量发布 5 次
- 反链机会提示（基础版）

**付费版**
- 多平台同步发布
- AI 内容优化建议
- 反链机会自动发现（完整版）
- 发布效果追踪 + 失效提醒
- 与主站数据完整打通
- 无限发布次数

#### 3.10.5 技术实现要点

**内容填充机制**
- 检测当前页面是否为目标平台编辑器
- 从主站服务端拉取对应的文章内容（需用户已登录主站）
- 通过 DOM 操作填充到编辑器各字段
- 模拟人工操作节奏（加入适当延迟），降低平台自动化检测风险

**发布链接回传**
- 插件监听目标平台的发布成功事件（URL 变更 / 特定 DOM 出现）
- 自动提取已发布文章 URL
- 回传至主站 `/api/links` 接口
- 主站记录并展示在效果追踪面板

**安全说明**
- 插件仅在用户已登录平台的状态下操作
- 不获取用户密码或 token，仅做 DOM 操作
- 需在插件说明页面清晰告知用户，消除顾虑

#### 3.10.6 Chrome 插件商店分发

- 关键词定向：「SEO publishing tool」「backlink builder」「content auto-fill」
- 免费版上架 Chrome Web Store，形成独立流量入口
- 插件商店页面包含 aifindr.org 链接（额外外链）
- 插件内固定展示"Powered by aifindr.org"入口

---

## 四、外链生态体系

### 4.1 提交者外链（核心激励）

| 外链来源 | 域名 | 链接位置 | 链接类型 |
|:---|:---|:---|:---|
| GitHub 主站仓库 | github.com（DA 100） | content/tools/category/slug.md | dofollow |
| GitHub 插件仓库 | github.com（DA 100） | extension README | dofollow |
| 工具详情页 | aifindr.org | 详情页右侧"Submitted by" | dofollow |
| 贡献者页面 | aifindr.org/contributors/username | 贡献者详情页 | dofollow |

### 4.2 API / SDK 外链矩阵（规划中）

通过开放 API 文档和 SDK，吸引开发者引用，形成高质量技术类反链：

```
用户项目 GitHub README  → aifindr.org
npm 包页面              → aifindr.org
PyPI 包页面             → aifindr.org
APIs.guru 目录          → aifindr.org
RapidAPI 目录           → aifindr.org
Dev.to 教程文章         → aifindr.org
Chrome 插件商店页面     → aifindr.org
```

**执行路径：**
1. 发布 OpenAPI / Swagger 文档站（`api.aifindr.org/docs`），提交到 APIs.guru、RapidAPI
2. 发布 npm 包（`aifindr-sdk`）和 PyPI 包，README 含主站链接
3. 在 Product Hunt 发布 API 版本
4. Dev.to / Medium 发布"如何使用 aifindr API"教程

### 4.3 Awesome List 联动策略

**三层关联方式：**

**第一层：直接提交（本周可做）**
找 5-10 个现有 Awesome List 提 PR，将 aifindr.org 收录进 awesome-seo、awesome-ai-tools、awesome-apis 等仓库。

**第二层：API/SDK 作为切入点（下个月）**
- awesome-apis ← 收录 aifindr API
- awesome-seo-tools ← 收录 aifindr.org
- awesome-python ← 收录 Python SDK
- awesome-javascript ← 收录 JS SDK

**第三层：自建 awesome-ai-tools 列表（长期运营）**

```
创建 awesome-ai-tools GitHub 仓库
├── 收录业界所有相关工具（aifindr.org 位置显眼）
├── 做好 SEO，仓库自然排名
└── 与主站数据双向打通：
    awesome 仓库（YAML 格式）
          ↕ GitHub Actions 自动同步
    aifindr.org D1 数据库
    用户在站点提交工具 → 自动发起 awesome 仓库 PR
```

徽章互挂：
- awesome 仓库顶部放 aifindr.org 徽章
- aifindr.org 每个工具旁显示"✓ Also in awesome-ai-tools"

### 4.4 AI 文章生成反链（新增）

用户通过主站生成文章，自行发布到 Medium / Dev.to 等平台，文章内含指向用户站点的反链。aifindr.org 作为工具提供方在文章末尾自然被提及，间接获得引用曝光。

---

## 五、数据结构

### 5.1 架构概述：元数据与正文分离

| 数据类型 | 存储位置 | 用途 |
|:---|:---|:---|
| 工具元数据 | Cloudflare D1（tools 表） | 列表页、筛选、搜索、排序、统计 |
| 工具媒体 | D1（tool_images / tool_videos）+ R2 | 详情页媒体画廊 |
| 工具正文 | GitHub content/ 目录 | 详情页内容渲染 |
| 表单提交 | D1（status = pending） | 待审核队列 |
| 生成文章记录 | D1（generated_articles 表） | 效果追踪 |
| 已发布反链记录 | D1（published_links 表） | 反链追踪 |

### 5.2 D1 表结构

#### 工具主表（tools）

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
  platforms        TEXT DEFAULT '',
  status           TEXT DEFAULT 'active'
                   CHECK(status IN ('active','beta','discontinued','pending')),
  launched         TEXT,
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
  submitter_site   TEXT,
  submitter_github TEXT,
  content_path     TEXT
);

CREATE INDEX idx_tools_category    ON tools(category);
CREATE INDEX idx_tools_pricing     ON tools(pricing);
CREATE INDEX idx_tools_status      ON tools(status);
CREATE INDEX idx_tools_featured    ON tools(featured);
CREATE INDEX idx_tools_submitted   ON tools(submitted_at DESC);
CREATE INDEX idx_tools_clicks      ON tools(click_count DESC);
CREATE INDEX idx_tools_cat_status  ON tools(category, status);
```

#### 标签表（tool_tags）

```sql
CREATE TABLE tool_tags (
  tool_id  INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (tool_id, tag)
);
CREATE INDEX idx_tool_tags_tag ON tool_tags(tag);
```

#### 图片表（tool_images）

```sql
CREATE TABLE tool_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id     INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT DEFAULT '',
  caption     TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  image_type  TEXT DEFAULT 'screenshot'
              CHECK(image_type IN ('cover','screenshot','logo','banner','og')),
  width       INTEGER,
  height      INTEGER,
  created_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_images_tool_id ON tool_images(tool_id, sort_order);
```

#### 视频表（tool_videos）

```sql
CREATE TABLE tool_videos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id     INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  video_id    TEXT,
  platform    TEXT NOT NULL
              CHECK(platform IN ('youtube','vimeo','twitter','loom','direct')),
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  thumbnail   TEXT,
  duration    INTEGER,
  video_type  TEXT DEFAULT 'demo'
              CHECK(video_type IN ('demo','tutorial','review','intro')),
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_videos_tool_id ON tool_videos(tool_id, sort_order);
```

#### 生成文章记录表（generated_articles）—— 新增

```sql
CREATE TABLE generated_articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_site     TEXT NOT NULL,
  platform      TEXT NOT NULL
                CHECK(platform IN ('medium','devto','hashnode','linkedin','quora','reddit')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  status        TEXT DEFAULT 'generated'
                CHECK(status IN ('generated','published','failed')),
  published_url TEXT,
  published_at  TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_articles_user_site ON generated_articles(user_site);
CREATE INDEX idx_articles_status    ON generated_articles(status);
```

#### 反链追踪表（published_links）—— 新增

```sql
CREATE TABLE published_links (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id   INTEGER REFERENCES generated_articles(id),
  source_url   TEXT NOT NULL,
  target_url   TEXT NOT NULL,
  platform     TEXT NOT NULL,
  anchor_text  TEXT,
  is_active    INTEGER DEFAULT 1,
  last_checked TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_links_target_url ON published_links(target_url);
CREATE INDEX idx_links_is_active  ON published_links(is_active);
```

### 5.3 Markdown Frontmatter 规范

```yaml
---
# ─── 基础信息 ─────────────────────────────────
name: "Midjourney"
slug: "midjourney"
website: "https://midjourney.com"
category: "image"
tags: ["image-generation", "ai-art", "text-to-image"]

# ─── 定价 ────────────────────────────────────
pricing: "paid"
price_starting: 10
price_detail: "Basic $10/mo, Standard $30/mo, Pro $60/mo"
has_free_trial: false

# ─── 平台支持 ──────────────────────────────────
platforms: ["web", "discord"]

# ─── 工具状态 ──────────────────────────────────
status: "active"
launched: "2022-07"
last_verified: "2026-04"

# ─── SEO ──────────────────────────────────────
title: "Midjourney – AI Image Generator"
meta_description: "Midjourney is a powerful AI image generation tool..."

# ─── 媒体资源 ──────────────────────────────────
cover_image: "https://r2.aifindr.org/tools/image/midjourney/cover.webp"
og_image: "https://r2.aifindr.org/tools/image/midjourney/og.webp"

images:
  - url: "https://r2.aifindr.org/tools/image/midjourney/screenshot-01.webp"
    alt: "Midjourney prompt interface"
    caption: "Simple Discord-based prompt interface"
    type: "screenshot"
    width: 1920
    height: 1080

videos:
  - url: "https://www.youtube.com/watch?v=xxxxxxx"
    platform: "youtube"
    video_id: "xxxxxxx"
    title: "Midjourney V6 Full Demo"
    type: "demo"
    duration: 120

# ─── 提交者信息 ────────────────────────────────
submitter_site: "https://example.com"
submitter_github: "username"

# ─── 编辑标签（管理员填写）──────────────────────
featured: false
verified: false
editor_pick: false
submitted_at: "2026-04-27"
---

正文 Markdown 内容...
```

### 5.4 R2 媒体文件存储规范

```
r2.aifindr.org/
└── tools/
    └── {category}/
        └── {slug}/
            ├── cover.webp          # 1200×675px（16:9），< 200KB
            ├── logo.webp           # 512×512px，< 100KB
            ├── og.webp             # 1200×630px，< 150KB
            ├── banner.webp         # 1600×400px，< 200KB
            └── screenshots/
                ├── 01.webp         # 1280×800px，< 300KB（最多5张）
                └── ...
```

### 5.5 GitHub 仓库结构

```
aifindr.org/                        # 主站仓库
├── content/                        # 工具正文 Markdown
├── components/
├── pages/
├── workers/
│   ├── api.ts                      # 工具列表/详情/搜索 API
│   ├── submit.ts                   # 表单提交处理
│   └── generate.ts                 # AI 文章生成 API
├── scripts/
│   └── sync-to-d1.js               # GitHub Action 同步脚本
├── public/
├── .github/
│   ├── workflows/
│   │   └── sync-to-d1.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── schema/
│   └── tool.schema.json
├── CONTRIBUTING.md
├── README.md
└── package.json

aifindr-extension/                  # 浏览器插件独立仓库
├── src/
│   ├── background.ts               # Service Worker（Manifest V3）
│   ├── content/
│   │   ├── medium.ts               # Medium 编辑器填充脚本
│   │   ├── devto.ts
│   │   ├── hashnode.ts
│   │   ├── linkedin.ts
│   │   ├── quora.ts
│   │   └── reddit.ts
│   ├── popup/
│   │   └── App.vue                 # 插件弹窗 UI
│   └── detector/
│       └── backlink-opportunity.ts # 反链机会检测
├── manifest.json
└── README.md                       # 含 aifindr.org 链接（Chrome Store 外链来源）
```

---

## 六、开源策略

### 6.1 开源协议

采用 **MIT + Commons Clause** 组合：
- MIT 保证社区自由贡献和使用
- Commons Clause 禁止将代码直接商业销售或搭建竞争性商业服务
- 允许：个人学习、自托管非商业版本、贡献代码

### 6.2 CONTRIBUTING.md 核心内容

- 外链激励说明（三条外链）
- 提交流程（fork → 填写模板 → PR）
- 内容质量要求（100字以上原创描述）
- 媒体资源要求（鼓励提供封面图和 Demo 视频链接）
- 审核标准（工具真实、功能完整、信息准确）
- PR 合并后自动触发 D1 同步说明

### 6.3 PR 模板

```markdown
## Tool Submission Checklist
- [ ] New .md file created under correct /content/tools/[category]/ folder
- [ ] Filename is lowercase and hyphenated
- [ ] All required frontmatter fields filled
- [ ] Description is original (min 100 words)
- [ ] Website URL is live and accessible
- [ ] Pricing information is accurate
- [ ] Cover image provided (recommended: 1200×675px)
- [ ] Demo video URL added (if available)

## Your Backlinks (active after merge)
- GitHub: github.com/[repo]/content/tools/[category]/[slug].md
- Directory: https://aifindr.org/tools/[category]/[slug]
- Contributor: https://aifindr.org/contributors/[your-github]
```

---

## 七、技术架构

### 7.1 技术栈

| 层级 | 技术选型 | 说明 |
|:---|:---|:---|
| 框架 | Nuxt 4 | SSG + ISR 混合模式 |
| 样式 | Tailwind CSS v4 | Utility-first |
| 内容管理 | Nuxt Content v3 | 工具正文 Markdown 渲染 |
| 元数据存储 | Cloudflare D1 | 工具元数据、媒体记录、文章生成、反链追踪 |
| 缓存 | Cloudflare KV | 首页统计、热门工具等高频查询（TTL 1小时） |
| 对象存储 | Cloudflare R2 | 工具封面图、截图、Logo |
| 后端逻辑 | Cloudflare Workers | 列表/搜索 API、表单处理、AI 文章生成 |
| AI 生成 | Anthropic API（Claude） | 多平台文章内容生成 |
| 防垃圾 | Cloudflare Turnstile | 表单验证 |
| 邮件通知 | MailChannels via Worker | 新提交通知 |
| CDN + DNS | Cloudflare | 全球加速 |
| 部署 | Cloudflare Pages | Git 触发自动构建 |
| 版本控制 | GitHub | 代码 + 正文仓库 |
| 浏览器插件 | Chrome Extension Manifest V3 | Vue + TypeScript |

### 7.2 数据流转架构

```
写入层
  GitHub PR 合并  → GitHub Action → D1 UPSERT → 触发 Pages 增量构建
  在线表单提交    → CF Worker    → D1 INSERT（pending）→ 邮件通知管理员
  管理员审核通过  → D1 UPDATE（active）
  AI 文章生成     → CF Worker    → D1 INSERT（generated_articles）
  插件发布回传    → CF Worker    → D1 UPDATE（published_url）+ INSERT（published_links）

存储层
  D1    工具元数据 + 媒体记录 + 文章生成记录 + 反链追踪
  Git   工具正文 Markdown
  R2    图片文件
  KV    高频查询缓存

查询层（CF Worker /api/*）
  GET  /api/tools              列表 + 筛选 + 排序 + 分页
  GET  /api/tools/:cat/:slug   详情（含 images + videos）
  GET  /api/tools/search       全文搜索
  GET  /api/stats              首页统计
  POST /api/submit             工具表单提交
  POST /api/generate           AI 文章生成
  POST /api/links              插件回传发布链接

渲染层
  SSG 预渲染    首页、分类页、提交页、生成页
  ISR 按需渲染  工具详情页（边缘缓存 24h）

浏览器插件层
  检测编辑器页面 → 从主站拉取生成内容 → DOM 填充
  → 监听发布成功事件 → 回传链接到主站
```

### 7.3 Nuxt 路由规则

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/':           { prerender: true },
    '/tools/':     { prerender: true },
    '/tools/*/':   { prerender: true },
    '/submit':     { prerender: true },
    '/generate':   { prerender: true },
    '/tools/*/*':  { isr: 86400 },
    '/blog/*/*':   { isr: 604800 },
    '/api/**':     { cors: true },
  }
})
```

### 7.4 Cloudflare 额度评估

**免费计划（Workers Free）**

| 服务 | 免费额度 | 早期预估 | 够用 |
|:---|:---|:---|:---:|
| Pages | 无限带宽，500次构建/月 | < 100次/月 | ✅ |
| D1 读取 | 500万行/天 | < 100万行/天 | ✅ |
| D1 写入 | 10万行/天 | < 1000行/天 | ✅ |
| D1 存储 | 5GB | < 100MB | ✅ |
| Workers | 10万请求/天 | < 1万/天 | ✅ |
| R2 | 10GB，100万请求/月 | < 10万/月 | ✅ |
| Turnstile | 完全免费 | — | ✅ |

**日 UV 超 200 时升级 Workers Paid（$5/月）**

| 指标 | Paid 包含量 | 超出单价 |
|:---|:---|:---|
| D1 读取 | 250亿行/月 | $0.001 / 百万行 |
| D1 写入 | 5000万行/月 | $1.00 / 百万行 |
| D1 存储超出 5GB | — | $0.75 / GB / 月 |

---

## 八、SEO 策略

### 8.1 URL 结构

```
https://aifindr.org/                          首页
https://aifindr.org/tools/                    工具列表
https://aifindr.org/tools/[category]/         分类页
https://aifindr.org/tools/[category]/[slug]   工具详情页
https://aifindr.org/generate                  AI 文章生成
https://aifindr.org/blog/                     博客列表
https://aifindr.org/blog/[slug]               博客详情
https://aifindr.org/submit                    提交工具
https://aifindr.org/contributors/             贡献者列表
https://aifindr.org/contributors/[username]   贡献者详情
https://api.aifindr.org/docs                  API 文档站
```

### 8.2 工具详情页内容分层策略

| 层级 | 工具类型 | 内容深度 | 字数目标 | 媒体要求 |
|:---|:---|:---|:---|:---|
| 第一层 | 头部工具（前 50 个） | 完整 8 个模块 | 600-1000 字 | 封面图 + 3张截图 + 1个视频 |
| 第二层 | 中部工具（50-300 个） | 标准 5 个模块 | 300-500 字 | 封面图 + 1张截图 |
| 第三层 | 长尾工具（300+） | 基础 3 个模块 | 150-200 字 | 封面图（可选） |

### 8.3 Schema 结构化数据

```json
{
  "@type": "SoftwareApplication",
  "name": "工具名",
  "url": "官网URL",
  "image": "封面图URL",
  "applicationCategory": "分类",
  "offers": { "@type": "Offer", "price": "起步价", "priceCurrency": "USD" },
  "video": {
    "@type": "VideoObject",
    "name": "Demo 视频标题",
    "embedUrl": "https://www.youtube.com/embed/xxx",
    "thumbnailUrl": "视频封面URL"
  }
}
```

### 8.4 内容生产工作流

```
工具官网 → 爬取功能描述/定价页/截图
    ↓
原始信息 + aifindr.org 模板 → AI 生成原创描述
    ↓
截图处理：压缩为 WebP，上传至 R2
    ↓
填写 images / videos frontmatter 字段
    ↓
人工审核（定价准确性、功能真实性、媒体有效性）
    ↓
写入 Markdown 文件，提交 Git → 触发 D1 同步
```

---

## 九、变现路径

### 9.1 阶段规划

| 阶段 | 触发条件 | 开放功能 | 预期收入 |
|:---|:---|:---|:---|
| 第一阶段 | 上线 | 全部免费 | $0 |
| 第二阶段 | 日 UV > 200 | Featured 置顶（$19-$49/个） | $100-$500/月 |
| 第三阶段 | 日 UV > 500 | 加速审核、Verified 认证、AI 文章生成付费版 | $300-$1000/月 |
| 第四阶段 | 日 UV > 2000 | 插件付费版、Newsletter、数据统计 API | $1000+/月 |

### 9.2 Featured 付费规则

- 首页 Featured 区：最多 6 个位置
- 价格：$19/个（基础）/ $49/个（首页置顶）
- 支付：Stripe / Lemon Squeezy
- 有效期：永久收录（付费为一次性）

---

## 十、冷启动与增长计划

### 10.1 MVP 阶段（第 1 个月）

```
第 1-3 天   搭站、核心页面上线、GitHub 仓库公开、D1 初始化建表
第 4-7 天   手动收录 50 个头部 AI 工具（第一层标准，含封面图和视频）
第 2 周     提交 Google Search Console + Bing Webmaster
            找 5 个 Awesome List 提交 PR（第一批外链）
第 3 周     Twitter/X、Reddit、Product Hunt 冷启动
第 4 周     观察自然提交情况，判断方向是否跑通
```

### 10.2 验证标准

1. 每周有 1 条以上自然工具提交
2. Google Search Console 显示有页面开始被索引
3. 至少有工具作者主动分享了自己的收录页

### 10.3 长期增长节奏

```
第 1 个月末   50 工具上线，MVP 验证
第 2 个月末   200 工具，每周有自然提交
第 3 个月末   500 工具，Google 开始给自然流量；发布 API 文档站
第 6 个月末   日 UV 500+，开放付费功能；发布浏览器插件 Beta
              升级 Workers Paid（$5/月）；发布 npm/PyPI SDK
第 9 个月末   插件正式版上线；开放 AI 文章生成付费功能
第 12 个月    日 UV 2000+，月收入 $1000+；发布行业数据报告
```

---

## 十一、风险与规避

| 风险 | 等级 | 规避方案 |
|:---|:---|:---|
| 垃圾提交泛滥 | 高 | Turnstile + 人工审核 + GitHub 账号历史检查 |
| 内容质量低导致 SEO 失效 | 高 | 严格审核标准 + 原创描述要求 + 媒体资源审核 |
| D1 免费额度超限 | 中 | 建立完善索引 + KV 缓存高频查询；日 UV>200 升级 $5/月 |
| 平台封禁插件自动填充行为 | 中 | 模拟人工操作节奏；监控各平台政策变化；敏感平台降级为半自动 |
| AI 生成内容被搜索引擎降权 | 中 | 用户需微调后发布；内容结合真实数据，非纯 AI 生成 |
| 前 6 个月无自然流量 | 中 | 同步做社区推广，不依赖单一渠道 |
| 媒体资源链接失效 | 中 | 图片统一托管至 R2；视频记录 video_id，平台迁移可重构 URL |
| 版权风险（内容/图片） | 中 | AI 生成原创描述；图片使用官网公开截图或自行截图 |
| 竞争对手抄袭开源代码 | 低 | MIT + Commons Clause 协议保护 |

---

## 附录：版本变更记录

| 版本 | 日期 | 变更内容 |
|:---|:---|:---|
| v1.0 | 2026-04 | 初始版本 |
| v1.1 | 2026-05 | 升级 D1 为核心数据层；新增 tool_images / tool_videos 表；补充 R2 媒体规范；更新技术架构为 SSG+ISR 混合模式 |
| v1.2 | 2026-05 | 新增产品进化路径（Level 1-4）；新增竞品差异化分析；新增 AI 文章生成模块（3.9）；新增浏览器插件完整规划（3.10）；新增外链生态体系章节（第四章）；新增 generated_articles / published_links D1 表；更新商业模式、变现路径、增长计划；新增 Anthropic API 至技术栈 |