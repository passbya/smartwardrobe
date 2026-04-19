import { describe, expect, it } from "vitest";
import { lunaSession } from "../helpers/preset-identity-fixtures";
import { outfitFixtureGarmentMap, outfitFixtureGarments } from "../helpers/outfit-fixtures";

type OutfitRulesModule = typeof import("@/lib/outfit-rules");

async function loadOutfitRules(): Promise<OutfitRulesModule> {
  return import("@/lib/outfit-rules");
}

describe("outfit rules", () => {
  it("generates a stable name from the first two populated core slots", async () => {
    const { generateOutfitName } = await loadOutfitRules();

    expect(
      generateOutfitName(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          bottomGarmentId: outfitFixtureGarments.bottom.id,
          outerwearGarmentId: outfitFixtureGarments.outerwear.id,
          accessoryGarmentIds: [],
        },
        outfitFixtureGarmentMap,
      ),
    ).toBe("Nebula Shirt + Midnight Skirt\u7b493\u4ef6");
  });

  it("uses the first accessory name to complete a single-piece generated name", async () => {
    const { generateOutfitName } = await loadOutfitRules();

    expect(
      generateOutfitName(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          accessoryGarmentIds: [outfitFixtureGarments.bag.id, outfitFixtureGarments.accessory.id],
        },
        outfitFixtureGarmentMap,
      ),
    ).toBe("Nebula Shirt + Silver Handbag");
  });

  it("rejects dress selections that conflict with separate top or bottom slots", async () => {
    const { validateOutfitSelection } = await loadOutfitRules();

    expect(
      validateOutfitSelection(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          dressGarmentId: outfitFixtureGarments.dress.id,
          accessoryGarmentIds: [],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: false,
      errors: ["dress-conflicts-with-separates"],
    });
  });

  it("accepts bags inside the accessories slot and rejects garments from invalid categories", async () => {
    const { validateOutfitSelection } = await loadOutfitRules();

    expect(
      validateOutfitSelection(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          bottomGarmentId: outfitFixtureGarments.bottom.id,
          accessoryGarmentIds: [outfitFixtureGarments.bag.id, outfitFixtureGarments.accessory.id],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: true,
      errors: [],
    });

    expect(
      validateOutfitSelection(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          bottomGarmentId: outfitFixtureGarments.bottom.id,
          accessoryGarmentIds: [outfitFixtureGarments.shoes.id],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: false,
      errors: ["invalid-accessory-garment"],
    });
  });

  it("rejects foreign garments and incomplete outfits", async () => {
    const { validateOutfitSelection } = await loadOutfitRules();

    expect(
      validateOutfitSelection(
        {
          topGarmentId: outfitFixtureGarments.top.id,
          accessoryGarmentIds: [],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: false,
      errors: ["minimum-garments"],
    });

    expect(
      validateOutfitSelection(
        {
          accessoryGarmentIds: [outfitFixtureGarments.accessory.id, outfitFixtureGarments.bag.id],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: false,
      errors: ["missing-primary-slot"],
    });

    expect(
      validateOutfitSelection(
        {
          topGarmentId: outfitFixtureGarments.foreign.id,
          bottomGarmentId: outfitFixtureGarments.bottom.id,
          accessoryGarmentIds: [],
        },
        outfitFixtureGarmentMap,
        lunaSession.userId,
      ),
    ).toEqual({
      valid: false,
      errors: ["foreign-garment"],
    });
  });
});
