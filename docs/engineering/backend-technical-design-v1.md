# SmartWardrobe 后端技术设计 v1

## 目标

后端负责三预设身份会话、服装数据、图片存储、规则分类，以及本地与 Supabase 双模式仓储切换。

## 当前架构

### 1. 本地预设模式

- 默认模式
- 数据写入仓库忽略目录 `.smartwardrobe-data/`
- 预设身份固定为 `Luna`、`Nova`、`Iris`
- 适合本地运行、回归和离线验证

### 2. Supabase 模式

- 在 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY` 同时存在时启用
- 使用 `Postgres + Storage`
- 与本地模式共用同一套仓储接口
- profile 记录按固定预设身份 `id` 创建和读取

## 环境变量

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SMARTWARDROBE_SUPABASE_BUCKET=garment-images
SMARTWARDROBE_DATA_DIR=.smartwardrobe-data
```

## 关键数据对象

### `profiles`

- `id uuid primary key`
- `display_name text not null`
- `is_demo boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

说明：当前实现继续复用历史表结构中的 `is_demo` 字段，但业务上已不再依赖该字段识别用户。

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

## Storage 约定

- bucket：`garment-images`
- 推荐对象路径：`preset/{userId}/{garmentId}/{fileName}`
- 删除服装时需要同步清理对应对象

## 服务接口

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

## 约束

- 本地预设模式与 Supabase 必须可切换，不可互相污染
- 所有读写都必须以当前身份的 `userId` 为边界
- 图片上传失败时不能留下半成品服装记录
- 若 Supabase 配置缺失或不可用，系统应继续保持本地预设模式可用
