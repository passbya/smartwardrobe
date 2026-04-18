# SmartWardrobe CI 工作流说明 v1

## 目标

把当前本地全检口径固化成可复用的 CI 门禁，为后续 PR 和发布提供统一判断标准。

## 已落地工作流

- 工作流文件已提交到 `.github/workflows/release-ready.yml`
- 触发条件是 `push` 到 `main` 和所有 `pull_request`
- `ubuntu-latest` 与 `windows-latest` 都会执行同一套门禁

## 建议流程

### PR / Push 门禁

1. 安装依赖
2. 执行 `npm run lint`
3. 执行 `npm run test`
4. 执行 `npm run build`

### 发布前检查

1. 先完成 PR / push 门禁
2. 再执行 `npm run full-check`
3. 只在浏览器烟测通过后进入预览或发布

## 说明

- 当前仓库已经有实际工作流，文档和实现口径应保持一致
- `full-check` 内部会先构建、再启动生产服务、等待 `/login` 就绪，然后执行浏览器烟测
- `smoke` 适合作为发布前最终检查，由 `full-check` 统一编排
- Supabase 迁移分支应额外校验环境变量、bucket 和迁移 SQL 是否可用
