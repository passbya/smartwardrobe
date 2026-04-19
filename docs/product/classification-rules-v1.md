# SmartWardrobe 分类规则 v1

## 文档信息

- 版本：v1.0
- 状态：冻结
- 更新日期：2026-04-19

## 规则目标

导入服装后，系统根据用户填写的 `subcategory` 自动补全 `category`，并在部分场景下补充默认 `season`。

## 优先级规则

- 用户在导入表单中显式填写的值优先
- 规则只补全空字段
- 用户在详情页手动修改后的值优先级最高
- 手动修改后，`classification_source` 更新为 `manual`

## 子类到一级分类映射

| ruleId | subcategory | category | defaultSeason | confidence |
| --- | --- | --- | --- | --- |
| `rule-top-001` | `tshirt` | `tops` | `summer` | `high` |
| `rule-top-002` | `shirt` | `tops` | `spring` | `high` |
| `rule-top-003` | `sweater` | `tops` | `autumn` | `high` |
| `rule-bottom-001` | `jeans` | `bottoms` | `all-season` | `high` |
| `rule-bottom-002` | `shorts` | `bottoms` | `summer` | `high` |
| `rule-bottom-003` | `skirt` | `bottoms` | `spring` | `medium` |
| `rule-outer-001` | `jacket` | `outerwear` | `autumn` | `high` |
| `rule-outer-002` | `coat` | `outerwear` | `winter` | `high` |
| `rule-dress-001` | `dress` | `dresses` | `spring` | `medium` |
| `rule-shoe-001` | `sneakers` | `shoes` | `all-season` | `high` |
| `rule-shoe-002` | `boots` | `shoes` | `winter` | `high` |
| `rule-bag-001` | `handbag` | `bags` | `all-season` | `medium` |
| `rule-accessory-001` | `hat` | `accessories` | `summer` | `medium` |
