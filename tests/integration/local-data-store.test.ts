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
});
