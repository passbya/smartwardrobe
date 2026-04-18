import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DataStoreModule = typeof import("@/lib/data-store");
type UploadRouteModule = typeof import("@/app/api/uploads/[userId]/[fileName]/route");

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

  it("persists a demo session, upload, classification, and manual override", async () => {
    const firstSession = await dataStore.getOrCreateDemoProfile();
    const secondSession = await dataStore.getOrCreateDemoProfile();

    expect(secondSession).toEqual(firstSession);

    const uploadFile = {
      name: "Summer Shirt!.png",
      size: 11,
      async arrayBuffer() {
        return new TextEncoder().encode("image-bytes").buffer;
      },
    } as File;

    const uploadedPath = await dataStore.saveUpload(
      firstSession.userId,
      "garment-001",
      uploadFile,
    );

    expect(uploadedPath).toBe(
      `/api/uploads/${firstSession.userId}/garment-001-summer-shirt.png`,
    );

    const uploadedFileResponse = await uploadRoute.GET(
      new Request("http://localhost"),
      {
        params: Promise.resolve({
          userId: firstSession.userId,
          fileName: "garment-001-summer-shirt.png",
        }),
      },
    );

    expect(uploadedFileResponse.status).toBe(200);
    expect(uploadedFileResponse.headers.get("Content-Type")).toBe("image/png");
    expect(await uploadedFileResponse.text()).toBe("image-bytes");

    const garment = await dataStore.createGarmentRecord(
      firstSession.userId,
      "garment-001",
      {
        name: "Linen Shirt",
        subcategory: "shirt",
        color: "white",
        brand: "Demo Label",
        notes: "Lightweight and breathable",
      },
      uploadedPath,
    );

    expect(garment).toMatchObject({
      id: "garment-001",
      user_id: firstSession.userId,
      category: "tops",
      subcategory: "shirt",
      season: "spring",
      classification_source: "rule",
      source: "manual_import",
    });

    const allGarments = await dataStore.listGarments(firstSession.userId);
    expect(allGarments).toHaveLength(1);
    expect(allGarments[0]).toMatchObject({
      id: "garment-001",
      category: "tops",
      season: "spring",
      classification_source: "rule",
    });

    const updatedGarment = await dataStore.updateGarmentRecord(
      firstSession.userId,
      "garment-001",
      {
        category: "outerwear",
        subcategory: "jacket",
        color: "black",
        season: "winter",
        brand: "Demo Label",
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

    const fetched = await dataStore.getGarmentById(
      firstSession.userId,
      "garment-001",
    );

    expect(fetched).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      subcategory: "jacket",
      season: "winter",
      classification_source: "manual",
    });

    const garmentsJson = await readFile(
      path.join(tempDir, "json", "garments.json"),
      "utf8",
    );
    expect(JSON.parse(garmentsJson)).toHaveLength(1);
  });

  it("recovers from malformed json and keeps the backup", async () => {
    await mkdir(path.join(tempDir, "json"), { recursive: true });
    await writeFile(path.join(tempDir, "json", "profiles.json"), "{broken", "utf8");

    const session = await dataStore.getOrCreateDemoProfile();

    expect(session.isDemo).toBe(true);

    const repairedJson = await readFile(
      path.join(tempDir, "json", "profiles.json"),
      "utf8",
    );
    expect(JSON.parse(repairedJson)).toEqual([
      {
        id: session.userId,
        display_name: "Demo Stylist",
        is_demo: true,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    ]);

    const backupEntries = await readdir(path.join(tempDir, "json"));
    expect(backupEntries.some((entry) => entry.startsWith("profiles.json.corrupt-"))).toBe(true);
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

  it("orders the wardrobe by newest first and keeps garments isolated by user", async () => {
    vi.useFakeTimers();

    const session = await dataStore.getOrCreateDemoProfile();
    const uploadFile = {
      name: "Wardrobe Photo.png",
      size: 11,
      async arrayBuffer() {
        return new TextEncoder().encode("image-bytes").buffer;
      },
    } as File;

    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await dataStore.createGarmentRecord(
      session.userId,
      "garment-001",
      {
        name: "Daily Tee",
        subcategory: "tshirt",
        season: "all-season",
      },
      await dataStore.saveUpload(session.userId, "garment-001", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:01.000Z"));
    await dataStore.createGarmentRecord(
      "other-user",
      "garment-900",
      {
        name: "Weekend Coat",
        subcategory: "coat",
      },
      await dataStore.saveUpload("other-user", "garment-900", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    await dataStore.createGarmentRecord(
      session.userId,
      "garment-002",
      {
        name: "Layered Jacket",
        subcategory: "jacket",
      },
      await dataStore.saveUpload(session.userId, "garment-002", uploadFile),
    );

    const garments = await dataStore.listGarments(session.userId);

    expect(garments.map((garment) => garment.id)).toEqual([
      "garment-002",
      "garment-001",
    ]);
    expect(garments[1]).toMatchObject({
      category: "tops",
      season: "all-season",
      classification_source: "rule",
    });
    expect(await dataStore.getGarmentById(session.userId, "garment-900")).toBeNull();
    expect(await dataStore.getGarmentById("other-user", "garment-900")).toMatchObject({
      id: "garment-900",
      user_id: "other-user",
      category: "outerwear",
      season: "winter",
    });
  });
});
