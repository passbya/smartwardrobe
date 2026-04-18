# SmartWardrobe

SmartWardrobe 是一个网页端电子衣橱 MVP。当前仓库已经形成双模式架构：

- `local demo`：默认运行模式，适合本地开发、演示和离线验证
- `Supabase`：下一阶段迁移目标，代码层已预留切换入口，但真实部署仍取决于外部环境

## 当前能力

- 演示登录
- 服装图片导入
- 自动分类
- 手动修改分类
- 衣橱列表与详情查看
- 本地持久化
- Supabase 兼容的数据仓储抽象

## 发布硬化层

当前仓库已经加了一层面向发布前收口的运行时诊断和门禁，不是额外的业务功能：

- 运行时诊断：登录页和应用壳都会显示当前数据模式，明确是 `本地 demo` 还是 `Supabase`
- 就绪信号：本地全检会先启动生产构建，再等待 `/login` 返回可访问状态，最后跑浏览器烟测
- 发布门禁：`lint + test + build + smoke` 组成当前可执行的完整检查链路
- 目的：确认当前运行的是哪种数据源，避免把未完成的迁移状态误当成可发布状态

## 双模式架构

### 1. `local demo`

- 默认启用
- 数据落在仓库忽略目录 `.smartwardrobe-data/`
- 不依赖 Supabase 环境变量
- 适合本地全流程验证和回归

### 2. `Supabase`

- 仅在 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY` 同时存在时启用
- 使用 `Supabase Auth + Postgres + Storage`
- 通过同一套服务接口替换本地仓储实现
- 目前仍处于迁移准备阶段，不代表已经正式上线

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 后可直接访问 `/login` 或 `/wardrobe`。

## 本地全检

当前推荐的完整检查命令如下：

```bash
npm run lint
npm run test
npm run build
npm run smoke
```

- `lint`：静态检查
- `test`：单元与集成测试
- `build`：生产构建检查
- `smoke`：浏览器烟测，覆盖登录、导入、分类、编辑和列表回跳

`npm run full-check` 会把这条链路串起来，默认先构建、再启动 `next start`、再等待 `/login` 就绪、最后执行浏览器烟测；加上 `--skip-build` 时则可复用已构建产物，适合 CI。

## CI 口径

当前仓库已经落地了 GitHub Actions 工作流，CI 门禁和本地全检保持同一口径：

- PR / push 跑 `lint + test + build + full-check -- --skip-build`
- 工作流会先安装 Playwright 浏览器，再执行同一套全量检查
- `smoke` 是发布前的最终浏览器验证，不再只停留在文档约定
- Supabase 迁移分支需要额外验证环境变量和存储桶可用性

## Supabase 迁移阻塞

当前还不能把 Supabase 视为已完成上线，主要阻塞点是：

- 真实 Supabase 项目环境变量尚未接入到部署环境
- 需要确认 `garment-images` bucket 与最小 schema 已在目标项目中创建
- 迁移执行、连接验证和预览部署仍未在真实环境完成
- 生产级 CI / CD 工作流已落地，但还没有接通真实 Supabase 部署环境

## 文档索引

- `docs/product/`：冻结版 PRD、字段字典、分类规则、验收标准
- `docs/engineering/`：技术设计、测试策略、CI 口径说明
- `docs/plans/`：计划、状态更新和里程碑说明
- `docs/logs/`：产品、前端、后端、测试的工作日志
