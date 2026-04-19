import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  lunaSession,
  novaSession,
} from "../helpers/preset-identity-fixtures";

vi.mock("@/lib/classification", () => ({
  classifyGarmentByRules: (subcategory: string) =>
    subcategory === "mocked-subcategory"
      ? {
          category: "tops",
          subcategory,
          season: "spring",
          confidence: "high",
          ruleId: "mock-rule-001",
        }
      : null,
}));

type DataStoreModule = typeof import("@/lib/data-store");
type OutfitEnabledDataStore = DataStoreModule & {
  listOutfits(userId: string): Promise<Array<{ id: string; user_id: string; name: string; generated_name: string; name_source: "generated" | "manual" }>>;
  getOutfitById(
    userId: string,
    outfitId: string,
  ): Promise<{ id: string; user_id: string; name: string; generated_name: string; name_source: "generated" | "manual" } | null>;
  createOutfitRecord(
    userId: string,
    input: {
      name?: string;
      topGarmentId?: string;
      bottomGarmentId?: string;
      dressGarmentId?: string;
      outerwearGarmentId?: string;
      shoesGarmentId?: string;
      accessoryGarmentIds: string[];
    },
  ): Promise<{ id: string; user_id: string; name: string; generated_name: string; name_source: "generated" | "manual" }>;
  updateOutfitRecord(
    userId: string,
    outfitId: string,
    input: {
      name?: string;
      topGarmentId?: string;
      bottomGarmentId?: string;
      dressGarmentId?: string;
      outerwearGarmentId?: string;
      shoesGarmentId?: string;
      accessoryGarmentIds: string[];
    },
  ): Promise<{ id: string; user_id: string; name: string; generated_name: string; name_source: "generated" | "manual" } | null>;
};

function createUploadFile(name: string, contents = "image-bytes") {
  return {
    name,
    size: contents.length,
    async arrayBuffer() {
      return new TextEncoder().encode(contents).buffer;
    },
  } as File;
}

describe("data store repository", () => {
  let tempDir = "";
  let originalDataDir = "";
  let dataStore: DataStoreModule;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "smartwardrobe-repo-"));
    originalDataDir = process.env.SMARTWARDROBE_DATA_DIR ?? "";
    process.env.SMARTWARDROBE_DATA_DIR = tempDir;
    vi.resetModules();
    dataStore = await import("@/lib/data-store");
  });

  afterEach(async () => {
    if (originalDataDir) {
      process.env.SMARTWARDROBE_DATA_DIR = originalDataDir;
    } else {
      delete process.env.SMARTWARDROBE_DATA_DIR;
    }

    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("creates garments for the chosen preset identity without requiring Supabase", async () => {
    const imageUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-001",
      createUploadFile("Mock Blazer.png"),
    );

    const garment = await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        name: "Mock Blazer",
        subcategory: "mocked-subcategory",
        color: "navy",
        season: "winter",
        brand: "Moon Label",
        notes: "Repository contract smoke test",
      },
      imageUrl,
    );

    expect(imageUrl).toBe(
      `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
    );
    expect(garment).toMatchObject({
      id: "garment-001",
      user_id: lunaSession.userId,
      image_url: imageUrl,
      category: "tops",
      subcategory: "mocked-subcategory",
      season: "winter",
      classification_source: "rule",
      source: "manual_import",
    });

    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-001")).toMatchObject({
      id: "garment-001",
      category: "tops",
      season: "winter",
    });
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-001")).toBeNull();
  });

  it("keeps list ordering stable and preserves manual overrides per preset identity", async () => {
    vi.useFakeTimers();
    const uploadFile = createUploadFile("Wardrobe Photo.png");

    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        name: "Daily Blazer",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-001", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:01.000Z"));
    await dataStore.createGarmentRecord(
      novaSession.userId,
      "garment-900",
      {
        name: "Other User Coat",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(novaSession.userId, "garment-900", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-002",
      {
        name: "Layered Jacket",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-002", uploadFile),
    );

    const garments = await dataStore.listGarments(lunaSession.userId);

    expect(garments.map((garment) => garment.id)).toEqual([
      "garment-002",
      "garment-001",
    ]);

    const updatedGarment = await dataStore.updateGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        category: "outerwear",
        subcategory: "coat",
        color: "black",
        season: "winter",
        brand: "Moon Label",
        notes: "Manually corrected after import",
      },
    );

    expect(updatedGarment).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      subcategory: "coat",
      season: "winter",
      classification_source: "manual",
    });
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-001")).toMatchObject({
      category: "outerwear",
      subcategory: "coat",
      season: "winter",
      classification_source: "manual",
    });
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-900")).toBeNull();
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-900")).toMatchObject({
      id: "garment-900",
      user_id: novaSession.userId,
    });
  });

  it("creates and updates manual outfits for the current preset identity", async () => {
    const outfitDataStore = dataStore as OutfitEnabledDataStore;
    const uploadFile = createUploadFile("Outfit Photo.png");

    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-top-001",
      {
        name: "Nebula Shirt",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-top-001", uploadFile),
    );
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-bottom-001",
      {
        name: "Midnight Skirt",
        subcategory: "skirt",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-bottom-001", uploadFile),
    );
    await dataStore.createGarmentRecord(
      novaSession.userId,
      "garment-foreign-001",
      {
        name: "Foreign Coat",
        subcategory: "coat",
      },
      await dataStore.saveUpload(novaSession.userId, "garment-foreign-001", uploadFile),
    );

    const created = await outfitDataStore.createOutfitRecord(lunaSession.userId, {
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      accessoryGarmentIds: [],
    });

    expect(created).toMatchObject({
      user_id: lunaSession.userId,
      name: "Nebula Shirt + Midnight Skirt",
      generated_name: "Nebula Shirt + Midnight Skirt",
      name_source: "generated",
    });
    expect(await outfitDataStore.getOutfitById(novaSession.userId, created.id)).toBeNull();

    const updated = await outfitDataStore.updateOutfitRecord(lunaSession.userId, created.id, {
      name: "Night Shift",
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      accessoryGarmentIds: [],
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Night Shift",
      generated_name: "Nebula Shirt + Midnight Skirt",
      name_source: "manual",
    });
    expect((await outfitDataStore.listOutfits(lunaSession.userId)).map((outfit) => outfit.id)).toEqual([
      created.id,
    ]);
  });
});
