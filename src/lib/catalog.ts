export const CATEGORY_LABELS: Record<string, string> = {
  "": "待分类",
  tops: "上装",
  bottoms: "下装",
  outerwear: "外套",
  dresses: "连衣裙",
  shoes: "鞋子",
  bags: "包袋",
  accessories: "配饰",
};

export const SEASON_LABELS: Record<string, string> = {
  "": "未设置",
  spring: "春季",
  summer: "夏季",
  autumn: "秋季",
  winter: "冬季",
  "all-season": "四季皆宜",
};

export const COLOR_OPTIONS = [
  { value: "", label: "全部颜色" },
  { value: "white", label: "白色" },
  { value: "black", label: "黑色" },
  { value: "gray", label: "灰色" },
  { value: "blue", label: "蓝色" },
  { value: "brown", label: "棕色" },
  { value: "green", label: "绿色" },
  { value: "red", label: "红色" },
  { value: "beige", label: "米色" },
];

export const CATEGORY_OPTIONS = [
  { value: "", label: "全部品类" },
  { value: "tops", label: "上装" },
  { value: "bottoms", label: "下装" },
  { value: "outerwear", label: "外套" },
  { value: "dresses", label: "连衣裙" },
  { value: "shoes", label: "鞋子" },
  { value: "bags", label: "包袋" },
  { value: "accessories", label: "配饰" },
];

export const EDITABLE_CATEGORY_OPTIONS = CATEGORY_OPTIONS.filter(
  (option) => option.value !== "",
);

export const SEASON_OPTIONS = [
  { value: "", label: "全部季节" },
  { value: "spring", label: "春季" },
  { value: "summer", label: "夏季" },
  { value: "autumn", label: "秋季" },
  { value: "winter", label: "冬季" },
  { value: "all-season", label: "四季皆宜" },
];

export const EDITABLE_SEASON_OPTIONS = SEASON_OPTIONS.filter(
  (option) => option.value !== "",
);

export const SUBCATEGORY_OPTIONS = [
  { value: "tshirt", label: "T 恤" },
  { value: "shirt", label: "衬衫" },
  { value: "sweater", label: "针织衫" },
  { value: "jeans", label: "牛仔裤" },
  { value: "shorts", label: "短裤" },
  { value: "skirt", label: "裙装" },
  { value: "jacket", label: "夹克" },
  { value: "coat", label: "大衣" },
  { value: "dress", label: "连衣裙" },
  { value: "sneakers", label: "运动鞋" },
  { value: "boots", label: "靴子" },
  { value: "handbag", label: "手提包" },
  { value: "hat", label: "帽子" },
];

export const SUBCATEGORY_LABELS = Object.fromEntries(
  SUBCATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

export function getCategoryLabel(value: string) {
  return CATEGORY_LABELS[value] ?? value;
}

export function getSeasonLabel(value: string) {
  return SEASON_LABELS[value] ?? value;
}

export function getSubcategoryLabel(value: string) {
  return SUBCATEGORY_LABELS[value] ?? value;
}

export function getColorLabel(value: string) {
  return COLOR_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
