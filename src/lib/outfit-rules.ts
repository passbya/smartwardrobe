import type { GarmentRecord, OutfitSlotSelection } from "@/lib/types";

type ValidationErrorCode =
  | "minimum-garments"
  | "missing-primary-slot"
  | "dress-conflicts-with-separates"
  | "invalid-top-garment"
  | "invalid-bottom-garment"
  | "invalid-dress-garment"
  | "invalid-outerwear-garment"
  | "invalid-shoes-garment"
  | "invalid-accessory-garment"
  | "foreign-garment"
  | "missing-garment";

type GarmentMap = Record<string, GarmentRecord>;
const SUBCATEGORY_CATEGORY_FALLBACK: Record<string, string> = {
  tshirt: "tops",
  shirt: "tops",
  sweater: "tops",
  jeans: "bottoms",
  shorts: "bottoms",
  skirt: "bottoms",
  jacket: "outerwear",
  coat: "outerwear",
  dress: "dresses",
  sneakers: "shoes",
  boots: "shoes",
  handbag: "bags",
  hat: "accessories",
};

function normalizeSelection(selection: Partial<OutfitSlotSelection>): OutfitSlotSelection {
  return {
    topGarmentId: selection.topGarmentId?.trim() ?? "",
    bottomGarmentId: selection.bottomGarmentId?.trim() ?? "",
    dressGarmentId: selection.dressGarmentId?.trim() ?? "",
    outerwearGarmentId: selection.outerwearGarmentId?.trim() ?? "",
    shoesGarmentId: selection.shoesGarmentId?.trim() ?? "",
    accessoryGarmentIds: [...new Set((selection.accessoryGarmentIds ?? []).map((id) => id.trim()).filter(Boolean))],
  };
}

function getGarment(map: GarmentMap, id?: string) {
  return id ? map[id] ?? null : null;
}

function resolveCategory(garment: GarmentRecord) {
  return garment.category || SUBCATEGORY_CATEGORY_FALLBACK[garment.subcategory] || "";
}

function getCoreNames(selection: OutfitSlotSelection, map: GarmentMap) {
  return [
    getGarment(map, selection.dressGarmentId)?.name,
    getGarment(map, selection.topGarmentId)?.name,
    getGarment(map, selection.bottomGarmentId)?.name,
    getGarment(map, selection.outerwearGarmentId)?.name,
    getGarment(map, selection.shoesGarmentId)?.name,
  ].filter((value): value is string => Boolean(value));
}

export function generateOutfitName(
  selection: Partial<OutfitSlotSelection>,
  garmentMap: GarmentMap,
) {
  const normalized = normalizeSelection(selection);
  const coreNames = getCoreNames(normalized, garmentMap);

  if (coreNames.length >= 2) {
    const prefix = `${coreNames[0]} + ${coreNames[1]}`;
    return coreNames.length > 2 ? `${prefix}等${coreNames.length}件` : prefix;
  }

  if (coreNames.length === 1) {
    const firstAccessory = normalized.accessoryGarmentIds
      .map((id) => getGarment(garmentMap, id)?.name ?? "")
      .find(Boolean);

    return firstAccessory ? `${coreNames[0]} + ${firstAccessory}` : coreNames[0];
  }

  return "未命名搭配";
}

export function validateOutfitSelection(
  selection: Partial<OutfitSlotSelection>,
  garmentMap: GarmentMap,
  userId: string,
): {
  valid: boolean;
  errors: ValidationErrorCode[];
} {
  const normalized = normalizeSelection(selection);
  const errors: ValidationErrorCode[] = [];
  const selectedIds = [
    normalized.topGarmentId,
    normalized.bottomGarmentId,
    normalized.dressGarmentId,
    normalized.outerwearGarmentId,
    normalized.shoesGarmentId,
    ...normalized.accessoryGarmentIds,
  ].filter(Boolean);

  if (selectedIds.length < 2) {
    errors.push("minimum-garments");
  }

  if (!normalized.topGarmentId && !normalized.bottomGarmentId && !normalized.dressGarmentId) {
    errors.push("missing-primary-slot");
  }

  if (normalized.dressGarmentId && (normalized.topGarmentId || normalized.bottomGarmentId)) {
    errors.push("dress-conflicts-with-separates");
  }

  const top = getGarment(garmentMap, normalized.topGarmentId);
  const bottom = getGarment(garmentMap, normalized.bottomGarmentId);
  const dress = getGarment(garmentMap, normalized.dressGarmentId);
  const outerwear = getGarment(garmentMap, normalized.outerwearGarmentId);
  const shoes = getGarment(garmentMap, normalized.shoesGarmentId);

  if (normalized.topGarmentId && !top) {
    errors.push("missing-garment");
  } else if (top && top.user_id !== userId) {
    errors.push("foreign-garment");
  } else if (top && resolveCategory(top) !== "tops") {
    errors.push("invalid-top-garment");
  }

  if (normalized.bottomGarmentId && !bottom) {
    errors.push("missing-garment");
  } else if (bottom && bottom.user_id !== userId) {
    errors.push("foreign-garment");
  } else if (bottom && resolveCategory(bottom) !== "bottoms") {
    errors.push("invalid-bottom-garment");
  }

  if (normalized.dressGarmentId && !dress) {
    errors.push("missing-garment");
  } else if (dress && dress.user_id !== userId) {
    errors.push("foreign-garment");
  } else if (dress && resolveCategory(dress) !== "dresses") {
    errors.push("invalid-dress-garment");
  }

  if (normalized.outerwearGarmentId && !outerwear) {
    errors.push("missing-garment");
  } else if (outerwear && outerwear.user_id !== userId) {
    errors.push("foreign-garment");
  } else if (outerwear && resolveCategory(outerwear) !== "outerwear") {
    errors.push("invalid-outerwear-garment");
  }

  if (normalized.shoesGarmentId && !shoes) {
    errors.push("missing-garment");
  } else if (shoes && shoes.user_id !== userId) {
    errors.push("foreign-garment");
  } else if (shoes && resolveCategory(shoes) !== "shoes") {
    errors.push("invalid-shoes-garment");
  }

  for (const accessoryId of normalized.accessoryGarmentIds) {
    const accessory = getGarment(garmentMap, accessoryId);

    if (!accessory) {
      errors.push("missing-garment");
      continue;
    }

    if (accessory.user_id !== userId) {
      errors.push("foreign-garment");
      continue;
    }

    if (!["accessories", "bags"].includes(resolveCategory(accessory))) {
      errors.push("invalid-accessory-garment");
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  };
}
