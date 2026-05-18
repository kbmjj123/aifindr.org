# Verifier Scripts

定价与数据验证脚本。

## 职责
- 定价验证：抓取各工具 pricing 页面，对比核实 free/freemium/paid
- 域名存活：批量 HEAD 请求检测域名在线状态
- 内容变更检测：发现定价页/功能描述重大变化，标记需人工复核
- 输出格式：更新 Markdown YAML 的 `last_verified` 字段
