# SmartWardrobe 后端技术设计 v1

## 目标

后端为 Web MVP 提供演示会话、服装数据、图片存储和规则分类能力。当前默认实现是 `local demo`，`Supabase` 只是在下一阶段启用的迁移目标。

## 发布硬化信号

- 当前没有单独的 `/health` API
- 本地/CI 的“就绪”判断是由 `full-check` 启动生产服务后探测 `/login` 完成的
- 当前后端运行模式是否切到 `Supabase`，由前端共享的运行时模式提示展示出来，便于人工确认

## 双模式数据源

### `local demo`

- 默认模式
- 数据写入仓库忽略目录
- 适合本地运行、回归和离线验证

### `Supabase`

- 通过 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY` 自动启用
- 使用 `Postgres + Storage`
- 与本地仓储共用同一服务接口

## 环境变量

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SMARTWARDROBE_SUPABASE_BUCKET=garment-images
SMARTWARDROBE_DATA_DIR=.smartwardrobe-data
```

- `SUPABASE_URL`：Supabase 项目地址。
- `SUPABASE_SERVICE_ROLE_KEY`：服务端密钥，只能放在服务端环境。
- `SMARTWARDROBE_SUPABASE_BUCKET`：可选，默认 `garment-images`。
- `SMARTWARDROBE_DATA_DIR`：可选，本地 demo 数据目录。

## 表结构

### `profiles`

- `id uuid primary key`
- `display_name text not null`
- `is_demo boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `garments`

- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `image_url text not null`
- `name text not null`
- `category text not null default ''`
- `subcategory text not null`
- `color text`
- `season text`
- `brand text`
- `notes text`
- `source text not null default 'manual_import'`
- `classification_source text not null default 'rule'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Storage

- bucket：`garment-images`
- 推荐对象路径：`demo/{userId}/{garmentId}/{fileName}`
- 目标是把上传图片和服装记录一一对应

## 服务接口

- `createDemoSession`
- `createGarment`
- `listGarments`
- `getGarmentById`
- `updateGarment`
- `classifyGarmentByRules`

## 迁移约束

- `local demo` 和 `Supabase` 必须可切换，不可互相污染。
- 图片上传失败时不能写入半成品服装记录。
- 读取必须以当前用户为边界，不跨用户访问或修改。
- 如果 Supabase 配置缺失，系统必须继续保持本地 demo 可用。

## M4 关注点

- 统一本地全检与 CI 的后端门禁。
- 让运行时模式提示和就绪探测保持稳定，不把迁移状态误判成可发布状态。
- 在真实 Supabase 环境中确认 bucket、schema 和读写权限。
- 迁移期间保持本地 demo 作为兜底运行模式。
