# SmartWardrobe 测试策略 v1

## 测试层级

- 单元测试：规则分类、字段校验、辅助函数
- 集成测试：导入链路、数据读写、模式切换
- E2E 烟测：登录、导入、详情编辑、列表回跳

## 当前基线

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke`

## 发布硬化层

- `npm run full-check` 是当前推荐的本地发布前入口
- 它会先执行 `build`，再启动 `next start`，等待 `/login` 可访问，然后跑浏览器烟测
- `--skip-build` 只用于 CI 或已有构建产物的复用场景
- 当前没有独立的健康 API，服务就绪由 `/login` 访问成功来代表

## 核心场景

1. 用户进入登录页并进入衣橱
2. 用户导入一件服装并看到详情页
3. 系统自动生成分类结果
4. 用户手动修改分类并刷新后仍保持
5. 用户返回列表并看到最新数据

## 异常场景

- 缺少图片无法提交
- 缺少名称无法提交
- 上传失败时不应留下半成品记录
- 详情页访问不存在记录时应有明确反馈

## CI 口径

- PR / push 执行 `lint + test + build + full-check -- --skip-build`
- `smoke` 作为最终浏览器验证，由 `full-check` 间接触发
- Supabase 迁移分支需要额外确认环境变量、bucket 和 schema

## 工具建议

- `Vitest`：单元与集成测试
- `Playwright`：浏览器烟测
- `ESLint`：静态检查
