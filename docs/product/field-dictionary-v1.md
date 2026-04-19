# SmartWardrobe 字段字典 v1

## 文档信息

- 版本：v1.0
- 状态：冻结
- 更新日期：2026-04-19

## 对象：`UserSession`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前身份的稳定唯一标识 |
| `displayName` | string | 是 | 页面展示名称 |
| `slug` | string | 是 | 预设身份标识，如 `luna` |

## 对象：`PresetIdentity`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 预设身份绑定的稳定用户 id |
| `displayName` | string | 是 | 身份展示名称 |
| `slug` | string | 是 | 稳定路由/会话标识 |
| `description` | string | 是 | 登录页展示说明 |
| `themeKey` | string | 否 | 用于视觉主题扩展 |

## 对象：`GarmentInput`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `imageFile` | File | 是 | 用户上传的图片文件 |
| `name` | string | 是 | 服装名称 |
| `subcategory` | string | 是 | 自动分类主输入 |
| `color` | string | 否 | 服装主颜色 |
| `season` | string | 否 | 适用季节 |
| `brand` | string | 否 | 品牌 |
| `notes` | string | 否 | 备注 |

## 对象：`GarmentRecord`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 服装唯一标识 |
| `user_id` | string | 是 | 所属身份 id |
| `image_url` | string | 是 | 图片访问地址 |
| `name` | string | 是 | 服装名称 |
| `category` | string | 是 | 一级品类 |
| `subcategory` | string | 是 | 二级品类 |
| `color` | string | 否 | 颜色 |
| `season` | string | 否 | 季节 |
| `brand` | string | 否 | 品牌 |
| `notes` | string | 否 | 备注 |
| `source` | string | 是 | 数据来源，首版固定为 `manual_import` |
| `classification_source` | string | 是 | 分类来源，取值为 `rule` 或 `manual` |
| `created_at` | string | 是 | 创建时间 |
| `updated_at` | string | 是 | 更新时间 |

## 对象：`ClassificationResult`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `category` | string | 是 | 系统映射出的一级品类 |
| `subcategory` | string | 是 | 输入或最终保留的子类 |
| `season` | string | 否 | 系统映射出的默认季节 |
| `confidence` | string | 是 | 匹配置信度 |
| `ruleId` | string | 是 | 命中的规则 id |
