import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  irisSession,
  lunaSession,
  novaSession,
} from "../helpers/preset-identity-fixtures";

type DataStoreModule = typeof import("@/lib/data-store");
type UploadRouteModule = typeof import("@/app/api/uploads/[userId]/[fileName]/route");
type OutfitEnabledDataStore = DataStoreModule & {
  listOutfits(userId: string): Promise<
    Array<{
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
    }>
  >;
  getOutfitById(
    userId: string,
    outfitId: string,
  ): Promise<{
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
  } | null>;
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
  ): Promise<{
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
  }>;
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
  ): Promise<{
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
  } | null>;
  deleteOutfitRecord(
    userId: string,
    outfitId: string,
  ): Promise<{
    id: string;
    user_id: string;
    name: string;
  } | null>;
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

describe("local data store flow", () => {
  let tempDir = "";
  let originalDataDir = "";
  let dataStore: DataStoreModule;
  let uploadRoute: UploadRouteModule;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "smartwardrobe-qa-"));
    originalDataDir = process.env.SMARTWARDROBE_DATA_DIR ?? "";
    process.env.SMARTWARDROBE_DATA_DIR = tempDir;
    vi.resetModules();
    dataStore = await import("@/lib/data-store");
    uploadRoute = await import("@/app/api/uploads/[userId]/[fileName]/route");
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

  it("persists uploads, classification, and manual overrides for the selected preset identity", async () => {
    const uploadedPath = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-001",
      createUploadFile("Summer Shirt!.png"),
    );

    expect(uploadedPath).toBe(
      `/api/uploads/${lunaSession.userId}/garment-001-summer-shirt.png`,
    );

    const uploadedFileResponse = await uploadRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({
        userId: lunaSession.userId,
        fileName: "garment-001-summer-shirt.png",
      }),
    });

    expect(uploadedFileResponse.status).toBe(200);
    expect(uploadedFileResponse.headers.get("Content-Type")).toBe("image/png");
    expect(await uploadedFileResponse.text()).toBe("image-bytes");

    const garment = await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        name: "Linen Shirt",
        subcategory: "shirt",
        color: "white",
        brand: "Moon Label",
        notes: "Lightweight and breathable",
      },
      uploadedPath,
    );

    expect(garment).toMatchObject({
      id: "garment-001",
      user_id: lunaSession.userId,
      category: "tops",
      subcategory: "shirt",
      season: "spring",
      classification_source: "rule",
      source: "manual_import",
    });

    const updatedGarment = await dataStore.updateGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        category: "outerwear",
        subcategory: "jacket",
        color: "black",
        season: "winter",
        brand: "Moon Label",
        notes: "Manually corrected after import",
      },
    );

    expect(updatedGarment).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      subcategory: "jacket",
      season: "winter",
      classification_source: "manual",
    });

    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-001")).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      subcategory: "jacket",
      season: "winter",
      classification_source: "manual",
    });
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-001")).toBeNull();
    expect(await dataStore.listGarments(novaSession.userId)).toEqual([]);

    const garmentsJson = await readFile(path.join(tempDir, "json", "garments.json"), "utf8");
    expect(JSON.parse(garmentsJson)).toHaveLength(1);
  });

  it("keeps wardrobes isolated when the user switches between preset identities", async () => {
    const lunaImageUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-luna",
      createUploadFile("Moon Cardigan.png", "luna-bytes"),
    );
    const novaImageUrl = await dataStore.saveUpload(
      novaSession.userId,
      "garment-nova",
      createUploadFile("Night Blazer.png", "nova-bytes"),
    );

    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-luna",
      {
        name: "Moon Cardigan",
        subcategory: "cardigan",
        color: "blue",
      },
      lunaImageUrl,
    );
    await dataStore.createGarmentRecord(
      novaSession.userId,
      "garment-nova",
      {
        name: "Night Blazer",
        subcategory: "jacket",
        color: "black",
      },
      novaImageUrl,
    );

    expect((await dataStore.listGarments(lunaSession.userId)).map((garment) => garment.id)).toEqual([
      "garment-luna",
    ]);
    expect((await dataStore.listGarments(novaSession.userId)).map((garment) => garment.id)).toEqual([
      "garment-nova",
    ]);
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-nova")).toBeNull();
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-luna")).toBeNull();

    const lunaUpload = await uploadRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({
        userId: lunaSession.userId,
        fileName: "garment-luna-moon-cardigan.png",
      }),
    });
    const novaUpload = await uploadRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({
        userId: novaSession.userId,
        fileName: "garment-nova-night-blazer.png",
      }),
    });

    expect(await lunaUpload.text()).toBe("luna-bytes");
    expect(await novaUpload.text()).toBe("nova-bytes");
  });

  it("rejects unsafe upload paths", async () => {
    const response = await uploadRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({
        userId: "../escape",
        fileName: "photo.png",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("orders the wardrobe by newest first for each preset identity", async () => {
    vi.useFakeTimers();
    const uploadFile = createUploadFile("Wardrobe Photo.png");

    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        name: "Daily Tee",
        subcategory: "tshirt",
        season: "all-season",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-001", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:01.000Z"));
    await dataStore.createGarmentRecord(
      irisSession.userId,
      "garment-900",
      {
        name: "Weekend Coat",
        subcategory: "coat",
      },
      await dataStore.saveUpload(irisSession.userId, "garment-900", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-002",
      {
        name: "Layered Jacket",
        subcategory: "jacket",
      },
      await dataStore.saveUpload(lunaSession.userId, "garment-002", uploadFile),
    );

    const garments = await dataStore.listGarments(lunaSession.userId);

    expect(garments.map((garment) => garment.id)).toEqual(["garment-002", "garment-001"]);
    expect(garments[1]).toMatchObject({
      category: "tops",
      season: "all-season",
      classification_source: "rule",
    });
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-900")).toBeNull();
    expect(await dataStore.getGarmentById(irisSession.userId, "garment-900")).toMatchObject({
      id: "garment-900",
      user_id: irisSession.userId,
      category: "outerwear",
      season: "winter",
    });
  });

  it("deletes a garment record and removes only that identity's local upload", async () => {
    const uploadFile = createUploadFile("Delete Me.png", "delete-bytes");
    const lunaImageUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-001",
      uploadFile,
    );
    const novaImageUrl = await dataStore.saveUpload(
      novaSession.userId,
      "garment-002",
      createUploadFile("Keep Me.png", "keep-bytes"),
    );

    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-001",
      {
        name: "Delete Me",
        subcategory: "shirt",
      },
      lunaImageUrl,
    );
    await dataStore.createGarmentRecord(
      novaSession.userId,
      "garment-002",
      {
        name: "Keep Me",
        subcategory: "shirt",
      },
      novaImageUrl,
    );

    const deleted = await dataStore.deleteGarmentRecord(lunaSession.userId, "garment-001");

    expect(deleted).toMatchObject({
      id: "garment-001",
      name: "Delete Me",
    });
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-001")).toBeNull();
    expect(await dataStore.listGarments(lunaSession.userId)).toEqual([]);
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-002")).toMatchObject({
      id: "garment-002",
      name: "Keep Me",
    });
    await expect(
      access(path.join(tempDir, "uploads", lunaSession.userId, "garment-001-delete-me.png")),
    ).rejects.toThrow();
    await expect(
      access(path.join(tempDir, "uploads", novaSession.userId, "garment-002-keep-me.png")),
    ).resolves.toBeUndefined();

    await expect(dataStore.deleteGarmentRecord(irisSession.userId, "garment-001")).resolves.toBeNull();
  });

  it("persists outfit CRUD, generated naming, and identity isolation for manual combinations", async () => {
    const outfitDataStore = dataStore as OutfitEnabledDataStore;
    const uploadFile = createUploadFile("Outfit Source.png");

    const lunaTopUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-top-001",
      uploadFile,
    );
    const lunaBottomUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-bottom-001",
      uploadFile,
    );
    const lunaOuterwearUrl = await dataStore.saveUpload(
      lunaSession.userId,
      "garment-outerwear-001",
      uploadFile,
    );
    const novaDressUrl = await dataStore.saveUpload(
      novaSession.userId,
      "garment-dress-001",
      uploadFile,
    );

    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-top-001",
      {
        name: "Nebula Shirt",
        subcategory: "shirt",
      },
      lunaTopUrl,
    );
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-bottom-001",
      {
        name: "Midnight Skirt",
        subcategory: "skirt",
      },
      lunaBottomUrl,
    );
    await dataStore.createGarmentRecord(
      lunaSession.userId,
      "garment-outerwear-001",
      {
        name: "Aurora Coat",
        subcategory: "coat",
      },
      lunaOuterwearUrl,
    );
    await dataStore.createGarmentRecord(
      novaSession.userId,
      "garment-dress-001",
      {
        name: "Nova Dress",
        subcategory: "dress",
      },
      novaDressUrl,
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
      top_garment_id: "garment-top-001",
      bottom_garment_id: "garment-bottom-001",
      dress_garment_id: null,
      accessory_garment_ids: [],
    });

    const updated = await outfitDataStore.updateOutfitRecord(lunaSession.userId, created.id, {
      name: "Moonlight Commute",
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      outerwearGarmentId: "garment-outerwear-001",
      accessoryGarmentIds: [],
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Moonlight Commute",
      generated_name: "Nebula Shirt + Midnight Skirt\u7b493\u4ef6",
      name_source: "manual",
      outerwear_garment_id: "garment-outerwear-001",
    });

    expect(await outfitDataStore.getOutfitById(lunaSession.userId, created.id)).toMatchObject({
      id: created.id,
      name: "Moonlight Commute",
      name_source: "manual",
    });
    expect(await outfitDataStore.getOutfitById(novaSession.userId, created.id)).toBeNull();
    expect((await outfitDataStore.listOutfits(lunaSession.userId)).map((outfit) => outfit.id)).toEqual([
      created.id,
    ]);
    expect(await outfitDataStore.listOutfits(novaSession.userId)).toEqual([]);

    const deleted = await outfitDataStore.deleteOutfitRecord(lunaSession.userId, created.id);

    expect(deleted).toMatchObject({
      id: created.id,
      name: "Moonlight Commute",
      user_id: lunaSession.userId,
    });
    expect(await outfitDataStore.getOutfitById(lunaSession.userId, created.id)).toBeNull();
    expect(await dataStore.getGarmentById(lunaSession.userId, "garment-top-001")).toMatchObject({
      id: "garment-top-001",
      name: "Nebula Shirt",
    });
    expect(await dataStore.getGarmentById(novaSession.userId, "garment-dress-001")).toMatchObject({
      id: "garment-dress-001",
      name: "Nova Dress",
    });
  });
});
