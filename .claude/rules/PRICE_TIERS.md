# price_tiers JSON 格式说明

`price_tiers` 字段存储结构化价格方案，JSON 数组格式。支持 4 种定价类型。

## 类型

### 1. 订阅制（subscription）

```json
{"name": "Pro", "type": "subscription", "price": 10, "period": "month", "features": ["Unlimited", "HD quality"]}
```

| 字段 | 说明 |
|------|------|
| `period` | `"month"` / `"year"` / `"one-time"` |

### 2. 免费（free）

```json
{"name": "Free", "type": "free", "price": 0, "features": ["10 generations/day"]}
```

`price=0` 时自动识别为 free。

### 3. 积分制（credits）

```json
{"name": "Credit Pack", "type": "credits", "price": 15, "credits": 100, "features": ["Never expire"]}
```

显示为 `100 credits / $15`。

### 4. 按量计费（usage）

```json
{"name": "Pay as you go", "type": "usage", "price": 0.05, "unit": "generation", "features": ["No monthly fee"]}
```

显示为 `$0.05/generation`。

### 5. 联系报价（custom）

```json
{"name": "Enterprise", "type": "custom", "price": null, "features": ["Custom quota", "Priority support"]}
```

显示为 `Contact us`。

## 完整示例

```json
[
  {"name": "Free",       "type": "free",         "price": 0,                     "features": ["9 images/prompt", "No signup"]},
  {"name": "Pro",        "type": "subscription", "price": 10,  "period": "month", "features": ["Faster speed", "No ads"]},
  {"name": "Credit Pack", "type": "credits",      "price": 15,  "credits": 100,   "features": ["100 credits", "Never expire"]},
  {"name": "Enterprise", "type": "custom",       "price": null,                   "features": ["Custom quota", "SLA"]}
]
```
