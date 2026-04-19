export type UserSession = {
  userId: string;
  displayName: string;
  slug: string;
};

export type PresetIdentity = {
  userId: string;
  displayName: string;
  slug: string;
  description: string;
  themeKey?: string;
};

export type GarmentInput = {
  name: string;
  subcategory: string;
  color?: string;
  season?: string;
  brand?: string;
  notes?: string;
};

export type GarmentRecord = {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  category: string;
  subcategory: string;
  color: string;
  season: string;
  brand: string;
  notes: string;
  source: string;
  classification_source: "rule" | "manual";
  created_at: string;
  updated_at: string;
};

export type OutfitSlotSelection = {
  topGarmentId?: string;
  bottomGarmentId?: string;
  dressGarmentId?: string;
  outerwearGarmentId?: string;
  shoesGarmentId?: string;
  accessoryGarmentIds: string[];
};

export type OutfitInput = OutfitSlotSelection & {
  name?: string;
};

export type OutfitRecord = {
  id: string;
  user_id: string;
  name: string;
  generated_name: string;
  name_source: "generated" | "manual";
  top_garment_id: string | null;
  bottom_garment_id: string | null;
  dress_garment_id: string | null;
  outerwear_garment_id: string | null;
  shoes_garment_id: string | null;
  accessory_garment_ids: string[];
  created_at: string;
  updated_at: string;
};

export type ResolvedOutfitRecord = OutfitRecord & {
  topGarment: GarmentRecord | null;
  bottomGarment: GarmentRecord | null;
  dressGarment: GarmentRecord | null;
  outerwearGarment: GarmentRecord | null;
  shoesGarment: GarmentRecord | null;
  accessoryGarments: GarmentRecord[];
  coverImageUrl: string;
};

export type ClassificationResult = {
  category: string;
  subcategory: string;
  season: string;
  confidence: "high" | "medium";
  ruleId: string;
};
