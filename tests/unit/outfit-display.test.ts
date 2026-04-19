import { describe, expect, it } from "vitest";
import { getOutfitDisplayItems } from "@/components/outfit-collage";
import type { ResolvedOutfitRecord } from "@/lib/types";
import { lunaSession } from "../helpers/preset-identity-fixtures";
import { outfitFixtureGarments } from "../helpers/outfit-fixtures";

function createResolvedOutfit(
  overrides: Partial<ResolvedOutfitRecord> = {},
): ResolvedOutfitRecord {
  return {
    id: "outfit-001",
    user_id: lunaSession.userId,
    name: "Moonlight Commute",
    generated_name: "Moonlight Commute",
    name_source: "manual",
    top_garment_id: outfitFixtureGarments.top.id,
    bottom_garment_id: outfitFixtureGarments.bottom.id,
    dress_garment_id: null,
    outerwear_garment_id: outfitFixtureGarments.outerwear.id,
    shoes_garment_id: outfitFixtureGarments.shoes.id,
    accessory_garment_ids: [
      outfitFixtureGarments.bag.id,
      outfitFixtureGarments.accessory.id,
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    topGarment: outfitFixtureGarments.top,
    bottomGarment: outfitFixtureGarments.bottom,
    dressGarment: null,
    outerwearGarment: outfitFixtureGarments.outerwear,
    shoesGarment: outfitFixtureGarments.shoes,
    accessoryGarments: [
      outfitFixtureGarments.bag,
      outfitFixtureGarments.accessory,
    ],
    coverImageUrl: outfitFixtureGarments.top.image_url,
    ...overrides,
  };
}

describe("outfit display collage inputs", () => {
  it("builds display items in stable slot priority for separate outfits", () => {
    const items = getOutfitDisplayItems(createResolvedOutfit());

    expect(items.map((item) => item.garment.name)).toEqual([
      "Nebula Shirt",
      "Midnight Skirt",
      "Aurora Coat",
      "Comet Boots",
      "Silver Handbag",
      "Star Hat",
    ]);

    expect(items.map((item) => item.label)).toEqual([
      "上装",
      "下装",
      "外套",
      "鞋子",
      "配饰",
      "配饰 2",
    ]);
  });

  it("puts the dress first and keeps secondary garments after it", () => {
    const items = getOutfitDisplayItems(
      createResolvedOutfit({
        top_garment_id: null,
        bottom_garment_id: null,
        dress_garment_id: outfitFixtureGarments.dress.id,
        topGarment: null,
        bottomGarment: null,
        dressGarment: outfitFixtureGarments.dress,
      }),
    );

    expect(items.map((item) => item.garment.name)).toEqual([
      "Moon Dress",
      "Aurora Coat",
      "Comet Boots",
      "Silver Handbag",
      "Star Hat",
    ]);
  });

  it("keeps garments without images in the display order so the placeholder tile can render", () => {
    const items = getOutfitDisplayItems(
      createResolvedOutfit({
        topGarment: {
          ...outfitFixtureGarments.top,
          image_url: "",
        },
      }),
    );

    expect(items[0]).toMatchObject({
      key: `top-${outfitFixtureGarments.top.id}`,
      garment: {
        id: outfitFixtureGarments.top.id,
        image_url: "",
      },
    });
    expect(items).toHaveLength(6);
  });
});
