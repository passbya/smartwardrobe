import type { GarmentRecord } from "@/lib/types";
import { lunaSession, novaSession } from "./preset-identity-fixtures";

function createGarment(overrides: Partial<GarmentRecord> & Pick<GarmentRecord, "id" | "user_id" | "name" | "category" | "subcategory">): GarmentRecord {
  return {
    id: overrides.id,
    user_id: overrides.user_id,
    image_url: overrides.image_url ?? `/api/uploads/${overrides.user_id}/${overrides.id}.png`,
    name: overrides.name,
    category: overrides.category,
    subcategory: overrides.subcategory,
    color: overrides.color ?? "",
    season: overrides.season ?? "",
    brand: overrides.brand ?? "",
    notes: overrides.notes ?? "",
    source: overrides.source ?? "manual_import",
    classification_source: overrides.classification_source ?? "manual",
    created_at: overrides.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00.000Z",
  };
}

export const outfitFixtureGarments = {
  top: createGarment({
    id: "garment-top-001",
    user_id: lunaSession.userId,
    name: "Nebula Shirt",
    category: "tops",
    subcategory: "shirt",
  }),
  bottom: createGarment({
    id: "garment-bottom-001",
    user_id: lunaSession.userId,
    name: "Midnight Skirt",
    category: "bottoms",
    subcategory: "skirt",
  }),
  dress: createGarment({
    id: "garment-dress-001",
    user_id: lunaSession.userId,
    name: "Moon Dress",
    category: "dresses",
    subcategory: "dress",
  }),
  outerwear: createGarment({
    id: "garment-outerwear-001",
    user_id: lunaSession.userId,
    name: "Aurora Coat",
    category: "outerwear",
    subcategory: "coat",
  }),
  shoes: createGarment({
    id: "garment-shoes-001",
    user_id: lunaSession.userId,
    name: "Comet Boots",
    category: "shoes",
    subcategory: "boots",
  }),
  bag: createGarment({
    id: "garment-bag-001",
    user_id: lunaSession.userId,
    name: "Silver Handbag",
    category: "bags",
    subcategory: "handbag",
  }),
  accessory: createGarment({
    id: "garment-accessory-001",
    user_id: lunaSession.userId,
    name: "Star Hat",
    category: "accessories",
    subcategory: "hat",
  }),
  foreign: createGarment({
    id: "garment-foreign-001",
    user_id: novaSession.userId,
    name: "Other User Tee",
    category: "tops",
    subcategory: "tshirt",
  }),
};

export const outfitFixtureGarmentMap = Object.fromEntries(
  Object.values(outfitFixtureGarments).map((garment) => [garment.id, garment]),
);
