# SmartWardrobe 研发交接说明 v1

## 交接说明

本文件用于把当前冻结需求交给前端、后端、测试工程师执行。实现应以当前真实产品口径为准，而不是早期单一 demo 登录方案。

关联文档：

- `docs/product/prd-v1.md`
- `docs/product/field-dictionary-v1.md`
- `docs/product/classification-rules-v1.md`
- `docs/product/acceptance-criteria-v1.md`

## 最小交付范围

### 前端

- 实现 `/login`、`/wardrobe`、`/import`、`/garment/[id]`
- 提供三预设身份登录与身份切换
- 提供中文界面与基础响应式布局

### 后端

- 实现 `profiles`、`garments` 和 `garment-images` bucket 相关能力
- 实现预设身份会话创建与读取
- 实现服装创建、读取、更新、删除
- 实现规则分类服务

### 测试

- 覆盖三预设身份登录
- 覆盖身份隔离
- 覆盖导入、分类、编辑、删除主流程

## 最小接口清单

- `getCurrentSession`
- `requireSession`
- `createPresetSession`
- `clearSession`
- `createGarment`
- `listGarments`
- `getGarmentById`
- `updateGarment`
- `deleteGarment`
- `classifyGarmentByRules`
