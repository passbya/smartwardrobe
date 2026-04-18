# SmartWardrobe 字段字典 v1

## 1. 文档信息
- 版本：v1.0
- 状态：冻结
- 更新日期：2026-04-18

## 2. 对象：DemoSession

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前演示用户的唯一标识 |
| `displayName` | string | 是 | 页面中展示的用户名 |
| `isDemo` | boolean | 是 | 是否为演示会话 |

## 3. 对象：GarmentInput

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `imageFile` | File | 是 | 用户上传的图片文件 |
| `name` | string | 是 | 服装名称，例如“白色短袖 T 恤” |
| `subcategory` | string | 是 | 服装子类，是自动分类主输入 |
| `color` | string | 否 | 服装主颜色 |
| `season` | string | 否 | 适合季节 |
| `brand` | string | 否 | 品牌名 |
| `notes` | string | 否 | 自定义备注 |

## 4. 对象：GarmentRecord

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 服装唯一标识 |
| `user_id` | string | 是 | 所属用户 ID |
| `image_url` | string | 是 | 上传后的图片访问地址 |
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

## 5. 对象：ClassificationResult

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `category` | string | 是 | 系统映射出的一级品类 |
| `subcategory` | string | 是 | 输入或最终保留的子类 |
| `season` | string | 否 | 系统映射出的默认季节 |
| `confidence` | string | 是 | 规则匹配置信度，首版固定为 `high` 或 `medium` |
| `ruleId` | string | 是 | 命中的规则 ID |

## 6. 枚举建议
### `category`
- `tops`
- `bottoms`
- `outerwear`
- `dresses`
- `shoes`
- `bags`
- `accessories`

### `season`
- `spring`
- `summer`
- `autumn`
- `winter`
- `all-season`

### `classification_source`
- `rule`
- `manual`

## 7. 字段展示规则
- `name`、`category`、`subcategory` 为列表页必须展示字段。
- `color`、`season` 有值时在列表页展示，无值时可隐藏。
- 详情页展示字段必须覆盖 `GarmentRecord` 中所有业务字段。
- `classification_source` 用于详情页解释分类来源，不要求在列表页展示。

## 8. 校验规则
- `imageFile` 必须存在。
- `name` 不能为空，去除首尾空格后长度至少为 1。
- `subcategory` 不能为空。
- `brand`、`notes` 可为空。
- `color`、`season` 若为空，可由规则补全或保持空值。

