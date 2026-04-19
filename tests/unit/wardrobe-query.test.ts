import { describe, expect, it } from "vitest";
import type { GarmentRecord } from "@/lib/types";
import { queryWardrobe } from "@/lib/wardrobe-query";

const garments: GarmentRecord[] = [
  {
    id: "g-001",
    user_id: "demo",
    image_url: "/api/uploads/demo/g-001-blue-shirt.png",
    name: "Blue Shirt",
    category: "tops",
    subcategory: "shirt",
    color: "blue",
    season: "spring",
    brand: "North Demo",
    notes: "Office weekday layer",
    source: "manual_import",
    classification_source: "rule",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "g-002",
    user_id: "demo",
    image_url: "/api/uploads/demo/g-002-black-coat.png",
    name: "Black Coat",
    category: "outerwear",
    subcategory: "coat",
    color: "black",
    season: "winter",
    brand: "Moon Tailor",
    notes: "Night city outer layer",
    source: "manual_import",
    classification_source: "manual",
    created_at: "2026-01-03T00:00:00.000Z",
    updated_at: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "g-003",
    user_id: "demo",
    image_url: "/api/uploads/demo/g-003-white-tee.png",
    name: "White Tee",
    category: "tops",
    subcategory: "tshirt",
    color: "white",
    season: "summer",
    brand: "Daylight",
    notes: "Soft cotton basic",
    source: "manual_import",
    classification_source: "rule",
    created_at: "2026-01-02T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  },
];

describe("wardrobe query", () => {
  it("matches partial text across name, brand, and notes", () => {
    expect(queryWardrobe(garments, { q: "shirt" }).map((garment) => garment.id)).toEqual([
      "g-001",
    ]);
    expect(queryWardrobe(garments, { q: "moon" }).map((garment) => garment.id)).toEqual([
      "g-002",
    ]);
    expect(queryWardrobe(garments, { q: "cotton" }).map((garment) => garment.id)).toEqual([
      "g-003",
    ]);
  });

  it("trims and normalizes search input", () => {
    expect(queryWardrobe(garments, { q: "  BLUE  " }).map((garment) => garment.id)).toEqual([
      "g-001",
    ]);
  });

  it("combines search and filters", () => {
    expect(
      queryWardrobe(garments, {
        q: "layer",
        category: "outerwear",
        color: "black",
        season: "winter",
      }).map((garment) => garment.id),
    ).toEqual(["g-002"]);
  });

  it("supports all sort modes", () => {
    expect(queryWardrobe(garments, { sort: "newest" }).map((garment) => garment.id)).toEqual([
      "g-002",
      "g-003",
      "g-001",
    ]);
    expect(queryWardrobe(garments, { sort: "oldest" }).map((garment) => garment.id)).toEqual([
      "g-001",
      "g-003",
      "g-002",
    ]);
    expect(queryWardrobe(garments, { sort: "name-asc" }).map((garment) => garment.id)).toEqual([
      "g-002",
      "g-001",
      "g-003",
    ]);
    expect(queryWardrobe(garments, { sort: "name-desc" }).map((garment) => garment.id)).toEqual([
      "g-003",
      "g-001",
      "g-002",
    ]);
  });

  it("does not mutate the original array", () => {
    const originalIds = garments.map((garment) => garment.id);

    queryWardrobe(garments, { sort: "name-asc" });

    expect(garments.map((garment) => garment.id)).toEqual(originalIds);
  });
});
