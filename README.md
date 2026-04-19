# SmartWardrobe

SmartWardrobe 是一个网页版电子衣橱项目。当前版本已经完成可运行的 Web MVP，并以三预设身份登录替换了早期的单一 demo 登录。

## 当前真实状态

- 登录方式：`Luna`、`Nova`、`Iris` 三个预设身份，点击即可进入
- 数据隔离：三个身份各自拥有独立衣橱、独立图片和独立会话
- 核心能力：
  - 服装图片导入
  - 自动分类
  - 手动修正分类
  - 衣橱列表与详情查看
  - 搜索、筛选、排序
  - 单件删除
- 仓储模式：
  - `本地预设模式`：默认运行模式，适合本地开发和离线验证
  - `Supabase`：当环境变量齐全时自动启用

## 公开访问地址

- 生产地址：[https://smartwardrobe-nu.vercel.app/login](https://smartwardrobe-nu.vercel.app/login)

## 本地运行

```bash
npm install
npm run dev
```

启动后访问：

- [http://localhost:3000/login](http://localhost:3000/login)

## 环境变量

项目默认不依赖远端服务也可运行。本地预设模式下，未配置 Supabase 环境变量时会自动使用仓库忽略目录 `.smartwardrobe-data/` 保存数据。

如果要切换到 Supabase，请在 `.env.local` 中配置：

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SMARTWARDROBE_SUPABASE_BUCKET=garment-images
SMARTWARDROBE_DATA_DIR=.smartwardrobe-data
```

说明：

- `SUPABASE_URL`：Supabase 项目地址
- `SUPABASE_SERVICE_ROLE_KEY`：服务端密钥，只能用于服务端环境
- `SMARTWARDROBE_SUPABASE_BUCKET`：可选，默认 `garment-images`
- `SMARTWARDROBE_DATA_DIR`：可选，本地预设模式数据目录

## 本地检查

常用检查命令：

```bash
npm run lint
npm run test
npm run build
npm run smoke
```

完整链路：

```bash
npm run full-check
```

`full-check` 会依次执行：

- 生产构建
- 启动 `next start`
- 等待 `/login` 就绪
- 执行真实浏览器烟测

## CI 口径

当前仓库已经落地 GitHub Actions 工作流，门禁与本地检查口径一致：

- `lint`
- `test`
- `build`
- `full-check -- --skip-build`

## 文档索引

- `docs/product/`：产品需求、字段字典、分类规则、验收标准
- `docs/engineering/`：技术设计、测试策略、CI 和 RLS 说明
- `docs/plans/`：阶段计划和当前状态
- `docs/logs/`：产品、前端、后端、测试工作日志
