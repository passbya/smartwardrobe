export type DemoSession = {
  userId: string;
  displayName: string;
  isDemo: boolean;
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

export type ClassificationResult = {
  category: string;
  subcategory: string;
  season: string;
  confidence: "high" | "medium";
  ruleId: string;
};
