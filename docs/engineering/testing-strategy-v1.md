# SmartWardrobe 测试策略 v1

## 测试层级

- 单元测试：分类规则、字段校验、预设身份配置、辅助函数
- 集成测试：导入链路、数据读写、仓储模式切换、身份隔离
- E2E 烟测：预设身份登录、导入、详情编辑、删除、列表回跳

## 当前基线

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke`
- `npm run full-check`

## 核心场景

1. 用户选择任一预设身份后进入衣橱
2. 身份 A 导入服装后，身份 B 看不到该记录
3. 系统根据 `subcategory` 自动生成分类结果
4. 用户手动修改分类后刷新仍保留
5. 删除操作只影响当前身份的数据

## 异常场景

- 缺少图片无法提交
- 缺少名称或子类无法提交
- 上传失败时不应留下半成品记录
- 访问不存在的服装详情时显示明确提示

## CI 口径

- PR / push 执行 `lint + test + build + full-check -- --skip-build`
- `smoke` 作为最终浏览器验证，由 `full-check` 统一触发
