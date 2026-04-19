import type {
  GarmentRecord,
  OutfitInput,
  OutfitRecord,
  OutfitSlotSelection,
  ResolvedOutfitRecord,
} from "@/lib/types";

const ACCESSORY_CATEGORIES = new Set(["accessories", "bags"]);
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

export type OutfitPersistencePayload = OutfitSlotSelection & {
  generatedName: string;
  name: string;
  nameSource: "generated" | "manual";
};

function normalizeOptional(value?: string) {
  return value?.trim() ?? "";
}

function dedupeAccessoryIds(accessoryGarmentIds: string[]) {
  return [...new Set(accessoryGarmentIds.map((value) => value.trim()).filter(Boolean))];
}

function getSelectedGarments(garmentsById: Map<string, GarmentRecord>, input: OutfitSlotSelection) {
  return {
    top: input.topGarmentId ? garmentsById.get(input.topGarmentId) ?? null : null,
    bottom: input.bottomGarmentId ? garmentsById.get(input.bottomGarmentId) ?? null : null,
    dress: input.dressGarmentId ? garmentsById.get(input.dressGarmentId) ?? null : null,
    outerwear: input.outerwearGarmentId
      ? garmentsById.get(input.outerwearGarmentId) ?? null
      : null,
    shoes: input.shoesGarmentId ? garmentsById.get(input.shoesGarmentId) ?? null : null,
    accessories: dedupeAccessoryIds(input.accessoryGarmentIds)
      .map((id) => garmentsById.get(id) ?? null)
      .filter((garment): garment is GarmentRecord => Boolean(garment)),
  };
}

function resolveCategory(garment: GarmentRecord) {
  return garment.category || SUBCATEGORY_CATEGORY_FALLBACK[garment.subcategory] || "";
}

function assertCategory(
  garment: GarmentRecord | null,
  allowedCategories: string[],
  label: string,
) {
  if (!garment) {
    return;
  }

  if (!allowedCategories.includes(resolveCategory(garment))) {
    throw new Error(`${label} 只能选择 ${allowedCategories.join(" / ")} 分类的衣物。`);
  }
}

export function validateOutfitInput(
  garments: GarmentRecord[],
  rawInput: OutfitInput,
): OutfitSlotSelection {
  const garmentsById = new Map(garments.map((garment) => [garment.id, garment]));
  const normalized: OutfitSlotSelection = {
    topGarmentId: normalizeOptional(rawInput.topGarmentId),
    bottomGarmentId: normalizeOptional(rawInput.bottomGarmentId),
    dressGarmentId: normalizeOptional(rawInput.dressGarmentId),
    outerwearGarmentId: normalizeOptional(rawInput.outerwearGarmentId),
    shoesGarmentId: normalizeOptional(rawInput.shoesGarmentId),
    accessoryGarmentIds: dedupeAccessoryIds(rawInput.accessoryGarmentIds ?? []),
  };

  const selected = getSelectedGarments(garmentsById, normalized);
  const allSelectedIds = [
    normalized.topGarmentId,
    normalized.bottomGarmentId,
    normalized.dressGarmentId,
    normalized.outerwearGarmentId,
    normalized.shoesGarmentId,
    ...normalized.accessoryGarmentIds,
  ].filter((id): id is string => Boolean(id));

  if (allSelectedIds.length < 2) {
    throw new Error("至少选择 2 件衣物才能保存搭配。");
  }

  if (!normalized.dressGarmentId && !normalized.topGarmentId && !normalized.bottomGarmentId) {
    throw new Error("搭配至少需要一件主体衣物：连衣裙、上装或下装。");
  }

  if (normalized.dressGarmentId && (normalized.topGarmentId || normalized.bottomGarmentId)) {
    throw new Error("选择连衣裙后，不能再同时选择上装或下装。");
  }

  assertCategory(selected.top, ["tops"], "上装");
  assertCategory(selected.bottom, ["bottoms"], "下装");
  assertCategory(selected.dress, ["dresses"], "连衣裙");
  assertCategory(selected.outerwear, ["outerwear"], "外套");
  assertCategory(selected.shoes, ["shoes"], "鞋子");

  for (const accessory of selected.accessories) {
    if (!ACCESSORY_CATEGORIES.has(accessory.category)) {
      throw new Error("配饰槽位只能选择配饰或包袋。");
    }
  }

  const unresolvedIds = allSelectedIds.filter((id) => !garmentsById.has(id));
  if (unresolvedIds.length > 0) {
    throw new Error("所选衣物必须全部属于当前身份。");
  }

  return normalized;
}

export function generateOutfitName(garments: GarmentRecord[], input: OutfitSlotSelection) {
  const garmentsById = new Map(garments.map((garment) => [garment.id, garment]));
  const selected = getSelectedGarments(garmentsById, input);
  const coreNames = [
    selected.dress?.name,
    selected.top?.name,
    selected.bottom?.name,
    selected.outerwear?.name,
    selected.shoes?.name,
  ].filter((value): value is string => Boolean(value));

  if (coreNames.length >= 2) {
    const prefix = `${coreNames[0]} + ${coreNames[1]}`;
    return coreNames.length > 2 ? `${prefix}等${coreNames.length}件` : prefix;
  }

  if (coreNames.length === 1) {
    const firstAccessory = selected.accessories[0]?.name;
    if (firstAccessory) {
      return `${coreNames[0]} + ${firstAccessory}`;
    }

    return coreNames[0];
  }

  return "未命名搭配";
}

export function createOutfitPersistencePayload(
  garments: GarmentRecord[],
  input: OutfitInput,
  existing?: OutfitRecord,
): OutfitPersistencePayload {
  const validated = validateOutfitInput(garments, input);
  const generatedName = generateOutfitName(garments, validated);
  const manualName = normalizeOptional(input.name);
  const keepManual = Boolean(manualName && manualName !== generatedName);
  const inheritedManual =
    !manualName && existing?.name_source === "manual" ? existing.name.trim() : "";
  const nameSource = keepManual || inheritedManual ? "manual" : "generated";
  const name =
    nameSource === "manual"
      ? manualName || inheritedManual || generatedName
      : generatedName;

  return {
    ...validated,
    generatedName,
    name,
    nameSource,
  };
}

export function resolveOutfitRecord(
  outfit: OutfitRecord,
  garments: GarmentRecord[],
): ResolvedOutfitRecord {
  const garmentsById = new Map(garments.map((garment) => [garment.id, garment]));
  const topGarment = outfit.top_garment_id
    ? garmentsById.get(outfit.top_garment_id) ?? null
    : null;
  const bottomGarment = outfit.bottom_garment_id
    ? garmentsById.get(outfit.bottom_garment_id) ?? null
    : null;
  const dressGarment = outfit.dress_garment_id
    ? garmentsById.get(outfit.dress_garment_id) ?? null
    : null;
  const outerwearGarment = outfit.outerwear_garment_id
    ? garmentsById.get(outfit.outerwear_garment_id) ?? null
    : null;
  const shoesGarment = outfit.shoes_garment_id
    ? garmentsById.get(outfit.shoes_garment_id) ?? null
    : null;
  const accessoryGarments = outfit.accessory_garment_ids
    .map((id) => garmentsById.get(id) ?? null)
    .filter((garment): garment is GarmentRecord => Boolean(garment));

  const coverImageUrl =
    dressGarment?.image_url ||
    topGarment?.image_url ||
    outerwearGarment?.image_url ||
    shoesGarment?.image_url ||
    accessoryGarments[0]?.image_url ||
    "";

  return {
    ...outfit,
    topGarment,
    bottomGarment,
    dressGarment,
    outerwearGarment,
    shoesGarment,
    accessoryGarments,
    coverImageUrl,
  };
}

export function getOutfitSummary(outfit: ResolvedOutfitRecord) {
  return [
    outfit.dressGarment?.name,
    outfit.topGarment?.name,
    outfit.bottomGarment?.name,
    outfit.outerwearGarment?.name,
    outfit.shoesGarment?.name,
    ...outfit.accessoryGarments.map((garment) => garment.name),
  ].filter((value): value is string => Boolean(value));
}
