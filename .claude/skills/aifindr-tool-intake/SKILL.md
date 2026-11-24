---
name: aifindr-tool-intake
description: 为 aifindr.org 逐个工具编写内容文档。当用户提到"帮我做一个工具"、"录入工具"、"制作工具文档"、"我要提交工具"、"写工具页面"、"验证这个工具"，或者直接给出一个工具名称/域名时，必须触发本 skill。本 skill 串起本地验证流水线 L1→L2→L3（确定性筛查、零 LLM 取证、真实浏览器实操），以本地实测证据为事实源、联网只做补充，产出 data/tool-pages/<host>.md 供后台对照录入。绝不允许把 UNVERIFIED 写成 VERIFIED。
description_zh: 用本地实测证据为 aifindr.org 逐个工具编写内容文档，串起 L1/L2/L3 验证流水线。
---

# aifindr Tool Intake Skill

为 aifindr.org 逐个工具编写内容文档。**事实源是本地实测证据，不是官网文案，不是模型想象。**

## 铁律（违反即作废）

1. **UNVERIFIED 永远不能写成 VERIFIED。** "跑不通"就如实写"跑不通"。一旦编数据，整套系统的信用归零。
2. **本地证据优先**：`reports/evidence/<host>.json` 与截图是事实源；联网（官网定价页 / PAA / Reddit / G2）只补充证据里没有的字段，且不得与实测冲突。
3. **claim_vs_actual 只能来自实测**：官网自称与实测差异，必须用 L3 记录，不能推测。
4. **不写 D1、不传 R2**：本 skill 只产出本地 `data/tool-pages/<host>.md`。发布由后台人工完成。

## 输入

- 工具域名（必须；若用户只给名称，先联网确认官网域名再开始）
- 分类 / 定价 / 名称 / 描述（可选；缺省时联网判定并用于 L1）

## 分类与子分类对照表

**必须从以下预置值中选择，不能自行发明：**

| category | sub_category 可选值 |
|---|---|
| image | image-generation / image-upscaling / background-removal / logo-branding / illustration |
| writing | ai-writing / essay-longform / copywriting / blog-seo / paraphrasing / email-writing / product-description |
| video | video-generation / video-editing / video-enhancement / avatar-talking-head / subtitles-captions / animation |
| audio | music-generation / text-to-speech / voice-cloning / transcription / audio-enhancement |
| code | ai-coding-assistants / code-generation / code-review / sql-database / testing / documentation / code-explanation / utilities |
| productivity | meeting-notes / pdf-document / workflow-automation / calendar-scheduling / task-management / inbox-email / time-tracking |
| marketing | seo-tools / social-media / ad-copy / landing-pages / content-repurposing / competitor-analysis / youtube-video-seo |
| data | data-analysis / charts-visualization / spreadsheets / dashboards-bi / reports |
| education | homework-tutoring / math / flashcards-quizzes / summarization / study-planning / language-learning / course-creation |
| business | business-planning / legal-contracts / finance-invoicing / pitch-presentations / hr-recruiting / customer-support / crm-sales |
| research | ai-search-engines / academic-research / paper-summarization / citation-references / fact-checking / knowledge-base / web-scraping / academic-writing |
| other | ai-directory / open-source-tools / ai-for-students / ai-for-small-business / ai-for-freelancers / ai-for-creators |

一个工具只属于一个 sub_category，选最匹配的主场景。

---

## 执行步骤

### Step 0：确定域名

用户给的是名称时，联网搜索确认官网域名（`web_search "<名称> official site"`），以域名作为整个流水线的主键。向用户确认无误后再继续。

### Step 1：L1 确定性筛查

```bash
node scripts/audit-submissions.mjs \
  --domain=<host> --name="<名称>" --website=<完整URL> \
  --category=<分类> --pricing=<free|freemium|paid> --desc="<一句话描述>" \
  --author=<PR作者GitHub login> --pr=<PR编号>
```

- 读 `reports/submissions-triage.json` 中 `pr` 以 `domain:` 开头的那条记录；`author` 写入草稿 `submitter_github`，`--pr` 写入 `pr_number` / `pr_url`，供后续 `POST /api/admin/publish-pr` 发布与追溯
- PR 模式下 `--author` / `--pr` 自动取自 PR，无需手填；无 PR 来源时两者省略
- `REJECT` → **停止**，记录理由，不写内容文件，向用户说明
- `PASS` / `MANUAL` → 继续；`MANUAL` 必须在最终文档里标注不确定点

> 单工具模式会把结果合并进存量 triage，不会覆盖 45 个存量 PR 记录。

### Step 2：L2 零 LLM 取证

```bash
node scripts/probe-evidence.mjs --host=<host>
```

- 读 `reports/evidence-probe.json` 中该 host 的 `facts`（正文词数、法务页、analytics、robots、ToS、og 标题等）
- `REJECT` → 停止；`MANUAL` → 标注不确定，继续但不得写 VERIFIED

### Step 3：L3 真实浏览器实操

```bash
node scripts/try-tool.mjs --only=<host>
```

- 依赖本机 Chrome（`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`，可用 `CHROME_PATH` 覆盖）
- **CDP 模式（推荐，降低被 Cloudflare 判成自动化）**：另开终端启动带调试端口的 Chrome，再用 `--cdp` 连接，复用真实 profile / 登录态：
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --remote-debugging-port=9200 --user-data-dir=/tmp/aifindr-cdp-profile
  node scripts/try-tool.mjs --cdp=9200 --only=<host>
  ```
  CDP 模式只关本次打开的页、不关闭用户的浏览器；验证码红线不变。不传 `--cdp` 则退回默认 headless 路径。
- 产物：`reports/evidence/<host>/01-landing.png`、`02-result.png`、`artifact-*`、`reports/evidence/<host>.json`
- 读 `<host>.json` 的 `verdict` / `reasons` / `observed` / `evidence`
  - `VERIFIED` + 有可归因产物 → 可写 VERIFIED
  - `PARTIAL` / `UNVERIFIED` / `BLOCKED_*` / `FAILED` → 如实标注，绝不写 VERIFIED
- **复核截图**：确认产物确实来自上传的素材，而不是站点自己的示例图（历史上 `photogenerai.com` 曾因 8KB 营销图被误判 VERIFIED，后被降级）

### Step 4：联网补充（只补证据没有的）

仅在本地证据不足以填以下字段时联网：

1. `/pricing` 页：价格层级（用于 `price_tiers`）
2. `{工具名} reddit review`、`{工具名} alternative`、`site:g2.com {工具名}`：真实用户痛点与对比对象
3. 搜索结果 People Also Ask：FAQ 真实问题（5-8 条，禁止编造）

**FAQ 分级规则：**

| 工具类型 | 判断标准 | FAQ 策略 |
|---|---|---|
| 高知名度 | PAA 问题 5 条以上 | 必加 5-8 条 |
| 中等知名度 | PAA 3-4 条 | 选加 3-5 条 |
| 小众/新工具 | PAA 少于 3 条 | 不加，`faq` 字段填空数组 `[]` |

FAQ 问题必须有真实来源（PAA / Reddit / G2），不得自行编造。

### Step 5：L4 写内容

读 `references/output-template.md` 了解格式，`references/tag-library.md` 选择标签，写出 `data/tool-pages/<host>.md`。

**frontmatter 字段：**

| 字段 | 规范 |
|---|---|
| `name` | 工具官方名称 |
| `slug` | 小写英文 + 连字符，如 `stable-diffusion` |
| `website` | 完整 URL，含 https:// |
| `category` / `pricing` | 来自对照表 / `free|freemium|paid` |
| `short_description` | 英文 ≤80 字符，覆盖核心场景；不以工具名开头、不用官网 slogan |
| `meta_description` | 英文 ≤150 字符，含核心痛点词 |
| `status` | 固定 `pending`（内容产出后由后台发布） |
| `data_source` | 固定 `evidence_probe` |
| `evidence_level` | L3 的 verdict：`VERIFIED` / `UNVERIFIED` / `PARTIAL` / `BLOCKED_*` |
| `submitter_github` | PR 作者 GitHub login，取自 L1 triage 记录的 `author`；无 PR 来源填空字符串 |
| `pr_number` / `pr_url` | PR 编号与链接，取自 L1 `--pr`；无 PR 来源填空字符串 |
| `last_verified` | L3 `observed_at` 的日期 `YYYY-MM-DD` |

**正文六段结构（顺序固定，见 output-template.md）：**

1. `## What the site says` — 官网自述，明确标注"未核实"
2. `## What we checked` — L2 facts（词数、法务页、analytics、robots、ToS 等具体数字）
3. `## Hands-on run` — L3 实际操作：界面元素、注入的合成素材、点击、观察到的产物（含时间与尺寸）
4. `## Verification status` — verdict + 理由；若从 VERIFIED 降级，必须说明原判依据与降级原因
5. `## FAQ` — 按分级规则；每个问题必须能被证据或真实用户反馈支撑
6. `## Evidence` — 本地路径清单（`reports/evidence/<host>/...`）

**price_tiers 规则（仅当联网拿到定价页时填）：**

| 场景 | type | 必填字段 |
|---|---|---|
| 完全免费 | `free` | name, type |
| 月付/年付订阅 | `subscription` | name, type, price, period('month'/'year') |
| 一次性买断 | `subscription` | name, type, price, period:'one-time' |
| 按 credits | `credits` | name, type, price, credits |
| 按用量 | `usage` | name, type, price, unit |
| 企业询价 | `custom` | name, type |

`features` 每档 2-4 个简短特性，来自定价页套餐说明。

---

## 输出前自检清单

- [ ] 已按顺序跑完 L1→L2→L3，且每步产物真实存在
- [ ] `evidence_level` 与 L3 JSON 的 verdict 一致，**没有把 UNVERIFIED 写成 VERIFIED**
- [ ] `Verification status` 段说明了判定依据；若降级，说明了原因
- [ ] `What we checked` 的每项事实都能在 `reports/evidence-probe.json` 找到
- [ ] `Hands-on run` 的每项观察都能在 `reports/evidence/<host>.json` 或截图找到
- [ ] FAQ 问题有真实来源（PAA / Reddit / G2），非编造；数量符合分级规则
- [ ] `short_description` ≤80 字符、`meta_description` ≤150 字符
- [ ] `status: pending`、`data_source: evidence_probe`
- [ ] `submitter_github` 与 L1 triage 的 `author` 一致（无 PR 来源则为空）
- [ ] `pr_number` / `pr_url` 与 L1 `--pr` 一致（无 PR 来源则为空）
- [ ] `Evidence` 段路径与本地实际文件一致
- [ ] 文件写入 `data/tool-pages/<host>.md`，未写 D1、未传 R2
