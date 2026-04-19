# SmartWardrobe CI 工作流说明 v1

## 目标

把当前本地检查口径固化成可复用的 CI 门禁，为 PR 和发布提供统一判断标准。

## 已落地工作流

- 工作流文件：`.github/workflows/release-ready.yml`
- 触发条件：`push` 到 `main` 和所有 `pull_request`
- 当前门禁与本地 `full-check` 保持一致

## 推荐流程

### PR / Push 门禁

1. 安装依赖
2. 执行 `npm run lint`
3. 执行 `npm run test`
4. 执行 `npm run build`

### 发布前检查

1. 完成 PR / push 门禁
2. 执行 `npm run full-check`
3. 浏览器烟测通过后再进入预览或发布

## 说明

- `full-check` 会先构建，再启动生产服务，等待 `/login` 就绪，最后执行浏览器烟测
- 烟测当前覆盖三预设身份登录、身份隔离、导入、分类、详情编辑和列表回跳
- Supabase 环境下应额外确认环境变量、bucket 和迁移 SQL 已可用
