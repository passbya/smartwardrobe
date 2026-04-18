# SmartWardrobe 研发交接说明 v1

## 1. 交接说明
本文件用于把冻结版产品需求交给前端、后端、测试工程师执行。研发过程中一切页面、字段、规则、验收判断，以本批产品文档为准。

关联文档：
- `docs/product/prd-v1.md`
- `docs/product/field-dictionary-v1.md`
- `docs/product/classification-rules-v1.md`
- `docs/product/acceptance-criteria-v1.md`

## 2. 工程最小交付范围
### 前端
- 实现 `/login`、`/wardrobe`、`/import`、`/garment/[id]`
- 实现中文界面和基础响应式布局
- 实现导入表单、列表卡片、详情编辑、筛选交互

### 后端
- 实现 `profiles`、`garments` 和 `garment-images` bucket 相关能力
- 实现演示会话创建能力
- 实现服装创建、读取、更新能力
- 实现规则分类服务

### 测试
- 根据验收标准转成单元、集成、E2E 测试
- 覆盖正常流程与核心异常态

## 3. 最小接口清单
- `createDemoSession`
- `createGarment`
- `listGarments`
- `getGarmentById`
- `updateGarment`
- `classifyGarmentByRules`

## 4. 实现边界
- 不增加批量导入。
- 不增加真实认证。
- 不增加 AI 图像识别。
- 不增加穿搭推荐和扩展业务模块。
- 不增加未在字段字典中出现的新字段。

## 5. 联调基准
- 前后端联调时，以字段字典中的对象定义为准。
- 分类结果以规则表为准。
- 验收判断以验收标准文档为准。

## 6. 缺口处理机制
- 若研发中发现字段、规则或页面说明缺失，先在产品文档中补齐，再进入实现。
- 若研发提出产品优化建议，默认不进入当前 MVP 范围，除非产品经理明确修订冻结版文档。

