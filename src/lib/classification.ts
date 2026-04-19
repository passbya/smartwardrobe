import type { ClassificationResult } from "@/lib/types";

type Rule = {
  ruleId: string;
  subcategory: string;
  category: string;
  defaultSeason: string;
  confidence: "high" | "medium";
};

const CLASSIFICATION_RULES: Rule[] = [
  { ruleId: "rule-top-001", subcategory: "tshirt", category: "tops", defaultSeason: "summer", confidence: "high" },
  { ruleId: "rule-top-002", subcategory: "shirt", category: "tops", defaultSeason: "spring", confidence: "high" },
  { ruleId: "rule-top-003", subcategory: "sweater", category: "tops", defaultSeason: "autumn", confidence: "high" },
  { ruleId: "rule-bottom-001", subcategory: "jeans", category: "bottoms", defaultSeason: "all-season", confidence: "high" },
  { ruleId: "rule-bottom-002", subcategory: "shorts", category: "bottoms", defaultSeason: "summer", confidence: "high" },
  { ruleId: "rule-bottom-003", subcategory: "skirt", category: "bottoms", defaultSeason: "spring", confidence: "medium" },
  { ruleId: "rule-outer-001", subcategory: "jacket", category: "outerwear", defaultSeason: "autumn", confidence: "high" },
  { ruleId: "rule-outer-002", subcategory: "coat", category: "outerwear", defaultSeason: "winter", confidence: "high" },
  { ruleId: "rule-dress-001", subcategory: "dress", category: "dresses", defaultSeason: "spring", confidence: "medium" },
  { ruleId: "rule-shoe-001", subcategory: "sneakers", category: "shoes", defaultSeason: "all-season", confidence: "high" },
  { ruleId: "rule-shoe-002", subcategory: "boots", category: "shoes", defaultSeason: "winter", confidence: "high" },
  { ruleId: "rule-bag-001", subcategory: "handbag", category: "bags", defaultSeason: "all-season", confidence: "medium" },
  { ruleId: "rule-accessory-001", subcategory: "hat", category: "accessories", defaultSeason: "summer", confidence: "medium" },
];

export function classifyGarmentByRules(
  subcategory: string,
): ClassificationResult | null {
  const matchedRule = CLASSIFICATION_RULES.find(
    (rule) => rule.subcategory === subcategory,
  );

  if (!matchedRule) {
    return null;
  }

  return {
    category: matchedRule.category,
    subcategory: matchedRule.subcategory,
    season: matchedRule.defaultSeason,
    confidence: matchedRule.confidence,
    ruleId: matchedRule.ruleId,
  };
}
