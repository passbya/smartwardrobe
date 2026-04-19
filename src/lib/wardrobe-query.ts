import type { GarmentRecord } from "@/lib/types";

export type WardrobeSort = "newest" | "oldest" | "name-asc" | "name-desc";

export type WardrobeQuery = {
  q?: string;
  category?: string;
  color?: string;
  season?: string;
  sort?: WardrobeSort;
};

function normalizeQuery(value?: string) {
  return value?.trim().toLocaleLowerCase("zh-CN") ?? "";
}

function matchesSearch(garment: GarmentRecord, query: string) {
  if (!query) {
    return true;
  }

  return [garment.name, garment.brand, garment.notes]
    .join(" ")
    .toLocaleLowerCase("zh-CN")
    .includes(query);
}

function compareByName(left: GarmentRecord, right: GarmentRecord) {
  return left.name.localeCompare(right.name, "zh-CN");
}

function sortGarments(garments: GarmentRecord[], sort: WardrobeSort) {
  switch (sort) {
    case "oldest":
      return garments.sort((left, right) => left.created_at.localeCompare(right.created_at));
    case "name-asc":
      return garments.sort(compareByName);
    case "name-desc":
      return garments.sort((left, right) => compareByName(right, left));
    case "newest":
    default:
      return garments.sort((left, right) => right.created_at.localeCompare(left.created_at));
  }
}

export function queryWardrobe(
  garments: GarmentRecord[],
  { q = "", category = "", color = "", season = "", sort = "newest" }: WardrobeQuery,
) {
  const normalizedQuery = normalizeQuery(q);
  const filtered = garments.filter((garment) => {
    const matchesCategory = !category || garment.category === category;
    const matchesColor = !color || garment.color === color;
    const matchesSeason = !season || garment.season === season;

    return (
      matchesCategory &&
      matchesColor &&
      matchesSeason &&
      matchesSearch(garment, normalizedQuery)
    );
  });

  return sortGarments([...filtered], sort);
}
