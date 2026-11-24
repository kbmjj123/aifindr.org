# 输出文档模板：`data/tool-pages/<host>.md`

所有字段与段落顺序固定。以 `data/tool-pages/photogenerai.com.md` 为参考样例。

## 模板

```markdown
---
name: "<工具官方名称>"
slug: "<小写英文-连字符>"
website: "<https:// 完整URL>"
category: "<12 分类之一>"
pricing: "<free | freemium | paid>"
short_description: "<≤80 字符，覆盖核心场景，不以工具名开头>"
meta_description: "<≤150 字符，含核心痛点词>"
status: "pending"
data_source: "evidence_probe"
evidence_level: "<VERIFIED | UNVERIFIED | PARTIAL | BLOCKED_CAPTCHA | BLOCKED_PAYWALL | BLOCKED_LOGIN | FAILED>"
submitter_github: "<PR 作者 GitHub login，取自 triage.author；无 PR 来源时留空>"
pr_number: "<PR 编号；无 PR 来源时留空>"
pr_url: "<https://github.com/kbmjj123/aifindr.org/pull/<编号>；无 PR 来源时留空>"
last_verified: "<YYYY-MM-DD>"
---

## What the site says

> The following is the site's own description. It has not been verified by us.

<官网自述的客观转述，2-4 句。明确标注未核实。>

## What we checked

- <L2 facts：正文词数、链接数、法务/定价页是否存在>
- <analytics / GA property>
- <robots.txt / ToS 检查结果>

## Hands-on run

<L3 实操叙述：界面元素数量、注入的合成素材（类型+大小）、点击的按钮、观察到的产物（类型+尺寸+耗时）。
若 verdict 非 VERIFIED，在此说明卡在哪一步（登录墙/付费墙/无产物）。>

## Verification status

**<VERDICT>.** <判定理由。若从 VERIFIED 降级，说明原判依据（如"8KB 产物超过阈值"）与降级原因（如"实际是站点自己的示例图"）。>

## FAQ

**<来自 PAA / Reddit / G2 的真实问题？>**
<简洁回答，50-120 字符。答案必须能被证据或真实反馈支撑。>

<小众工具此段可省略，frontmatter 中证据等级如实填写。>

## Evidence

- `reports/evidence/<host>/01-landing.png`
- `reports/evidence/<host>/02-result.png`
- `reports/evidence/<host>.json`
```

## 字段约束速查

| 字段 | 硬约束 |
|---|---|
| `short_description` | ≤80 字符，不以工具名开头，不用官网 slogan，主动句式 |
| `meta_description` | ≤150 字符，含核心痛点词 |
| `slug` | 小写英文 + 连字符 |
| `status` | 固定 `pending` |
| `data_source` | 固定 `evidence_probe` |
| `evidence_level` | 必须与 `reports/evidence/<host>.json` 的 `verdict` 一致 |
| `submitter_github` | PR 提交者 GitHub login，取自 `reports/submissions-triage.json` 的 `author`；无 PR 来源留空字符串 |
| `pr_number` / `pr_url` | PR 编号与链接，取自 L1 的 `--pr` 参数；无 PR 来源留空字符串 |
| `last_verified` | 取 L3 JSON `observed_at` 日期部分 |

## 严禁

- 把 `UNVERIFIED` / `PARTIAL` / `BLOCKED_*` 写成 `VERIFIED`
- 编造 FAQ 问题（必须来自 PAA / Reddit / G2）
- 把站点自己的示例图/营销图当作实测产物
- 写 D1、上传 R2（本 skill 只产出本地 MD）
