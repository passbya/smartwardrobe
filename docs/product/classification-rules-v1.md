# SmartWardrobe 分类规则 v1

## 1. 文档信息
- 版本：v1.0
- 状态：冻结
- 更新日期：2026-04-18

## 2. 规则目标
首版分类规则用于在导入服装后，根据用户选择的 `subcategory` 自动补全 `category`，并在部分场景下补充默认 `season`。

## 3. 优先级规则
- 用户在导入表单中明确填写的值优先。
- 规则只补全空字段。
- 用户在详情页手动修改后的值优先级最高。
- 手动修改后，`classification_source` 必须更新为 `manual`。

## 4. 子类到一级分类映射

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

## 5. 行为规则
- 若 `subcategory` 命中规则且 `category` 为空，则写入规则提供的 `category`。
- 若 `subcategory` 命中规则且 `season` 为空，则写入规则提供的 `defaultSeason`。
- 若未命中规则，则保留用户原输入，`category` 和 `season` 可为空。
- 首版不做模糊匹配，不做拼写纠正。
- 首版不根据图片内容推断分类。

## 6. 前端展示规则
- 导入成功后，详情页应显示当前分类结果。
- 若分类来自规则，应标注“系统自动分类”。
- 若分类经过人工修改，应标注“手动调整”。

## 7. 工程实现要求
- 规则表首版可写在代码配置中。
- 规则 ID 必须稳定，便于日志与调试。
- 规则配置应可被单元测试覆盖。

