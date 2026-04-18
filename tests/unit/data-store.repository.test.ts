import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("creates garments from repository input without requiring Supabase", async () => {
    const session = await dataStore.getOrCreateDemoProfile();
    const uploadFile = {
      name: "Mock Blazer.png",
      size: 12,
      async arrayBuffer() {
        return new TextEncoder().encode("image-bytes").buffer;
      },
    } as File;

    const imageUrl = await dataStore.saveUpload(
      session.userId,
      "garment-001",
      uploadFile,
    );

    const garment = await dataStore.createGarmentRecord(
      session.userId,
      "garment-001",
      {
        name: "Mock Blazer",
        subcategory: "mocked-subcategory",
        color: "navy",
        season: "winter",
        brand: "Demo Label",
        notes: "Repository contract smoke test",
      },
      imageUrl,
    );

    expect(imageUrl).toBe(
      `/api/uploads/${session.userId}/garment-001-mock-blazer.png`,
    );
    expect(garment).toMatchObject({
      id: "garment-001",
      user_id: session.userId,
      image_url: imageUrl,
      category: "tops",
      subcategory: "mocked-subcategory",
      season: "winter",
      classification_source: "rule",
      source: "manual_import",
    });

    expect(await dataStore.getGarmentById(session.userId, "garment-001")).toMatchObject(
      {
        id: "garment-001",
        category: "tops",
        season: "winter",
      },
    );
    expect(await dataStore.getGarmentById("other-user", "garment-001")).toBeNull();
  });

  it("keeps list ordering stable and marks manual overrides as final", async () => {
    vi.useFakeTimers();

    const session = await dataStore.getOrCreateDemoProfile();
    const uploadFile = {
      name: "Wardrobe Photo.png",
      size: 12,
      async arrayBuffer() {
        return new TextEncoder().encode("image-bytes").buffer;
      },
    } as File;

    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await dataStore.createGarmentRecord(
      session.userId,
      "garment-001",
      {
        name: "Daily Blazer",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(session.userId, "garment-001", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:01.000Z"));
    await dataStore.createGarmentRecord(
      "other-user",
      "garment-900",
      {
        name: "Other User Coat",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload("other-user", "garment-900", uploadFile),
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
    await dataStore.createGarmentRecord(
      session.userId,
      "garment-002",
      {
        name: "Layered Jacket",
        subcategory: "mocked-subcategory",
      },
      await dataStore.saveUpload(session.userId, "garment-002", uploadFile),
    );

    const garments = await dataStore.listGarments(session.userId);

    expect(garments.map((garment) => garment.id)).toEqual([
      "garment-002",
      "garment-001",
    ]);

    const updatedGarment = await dataStore.updateGarmentRecord(
      session.userId,
      "garment-001",
      {
        category: "outerwear",
        subcategory: "coat",
        color: "black",
        season: "winter",
        brand: "Demo Label",
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
    expect(await dataStore.getGarmentById(session.userId, "garment-001")).toMatchObject(
      {
        category: "outerwear",
        subcategory: "coat",
        season: "winter",
        classification_source: "manual",
      },
    );
    expect(await dataStore.getGarmentById(session.userId, "garment-900")).toBeNull();
  });
});
