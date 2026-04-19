import { describe, expect, it } from "vitest";
import { classifyGarmentByRules } from "@/lib/classification";

describe("classifyGarmentByRules", () => {
  it.each([
    ["tshirt", "tops", "summer", "high", "rule-top-001"],
    ["shirt", "tops", "spring", "high", "rule-top-002"],
    ["jeans", "bottoms", "all-season", "high", "rule-bottom-001"],
    ["coat", "outerwear", "winter", "high", "rule-outer-002"],
    ["dress", "dresses", "spring", "medium", "rule-dress-001"],
    ["hat", "accessories", "summer", "medium", "rule-accessory-001"],
  ])(
    "maps %s to the expected category, season, and rule id",
    (subcategory, category, season, confidence, ruleId) => {
      expect(classifyGarmentByRules(subcategory)).toEqual({
        category,
        subcategory,
        season,
        confidence,
        ruleId,
      });
    },
  );

  it("returns null for unknown subcategories", () => {
    expect(classifyGarmentByRules("unknown-item")).toBeNull();
  });

  it("uses the exact rule match without guessing", () => {
    expect(classifyGarmentByRules("Tshirt")).toBeNull();
  });
});
