import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lunaSession } from "../helpers/preset-identity-fixtures";

const {
  redirectMock,
  revalidatePathMock,
  requireSessionMock,
  saveUploadMock,
  createGarmentRecordsMock,
  randomUUIDMock,
  getSubcategoryLabelMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  requireSessionMock: vi.fn(),
  saveUploadMock: vi.fn(),
  createGarmentRecordsMock: vi.fn(),
  randomUUIDMock: vi.fn(),
  getSubcategoryLabelMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/session", () => ({
  requireSession: requireSessionMock,
  clearSession: vi.fn(),
  createPresetSession: vi.fn(),
}));

vi.mock("@/lib/data-store", () => ({
  createGarmentRecords: createGarmentRecordsMock,
  createGarmentRecord: vi.fn(),
  createOutfitRecord: vi.fn(),
  deleteGarmentRecord: vi.fn(),
  deleteOutfitRecord: vi.fn(),
  getGarmentById: vi.fn(),
  getOutfitById: vi.fn(),
  listGarments: vi.fn(),
  listOutfits: vi.fn(),
  saveUpload: saveUploadMock,
  updateGarmentRecord: vi.fn(),
  updateOutfitRecord: vi.fn(),
}));

vi.mock("@/lib/catalog", () => ({
  getSubcategoryLabel: getSubcategoryLabelMock,
}));

vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

type ActionsModule = typeof import("@/app/actions");

class RedirectSignal extends Error {
  constructor(public readonly target: string) {
    super(`Redirected to ${target}`);
  }
}

function createImageFile(name: string, contents: string) {
  return new File([new TextEncoder().encode(contents)], name, {
    type: "image/png",
  });
}

async function loadActions(): Promise<ActionsModule> {
  vi.resetModules();
  return import("@/app/actions");
}

describe("batch import action", () => {
  beforeEach(() => {
    requireSessionMock.mockResolvedValue(lunaSession);
    getSubcategoryLabelMock.mockImplementation((subcategory: string) =>
      subcategory === "shirt" ? "鐧借‖琛?" : subcategory,
    );
    randomUUIDMock.mockReset();
    saveUploadMock.mockReset();
    createGarmentRecordsMock.mockReset();
    revalidatePathMock.mockReset();
    redirectMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds shared batch requests, generates sequential names, and revalidates the wardrobe", async () => {
    const { createGarmentBatchAction } = await loadActions();
    const formData = new FormData();

    formData.set("subcategory", "shirt");
    formData.set("color", "white");
    formData.set("season", "winter");
    formData.set("brand", "Moon Label");
    formData.set("notes", "batch-import-note");
    formData.append("images", createImageFile("shirt-1.png", "a"));
    formData.append("images", createImageFile("shirt-2.png", "b"));

    randomUUIDMock.mockReturnValueOnce("garment-001").mockReturnValueOnce("garment-002");
    saveUploadMock
      .mockResolvedValueOnce(`/api/uploads/${lunaSession.userId}/garment-001-shirt-1.png`)
      .mockResolvedValueOnce(`/api/uploads/${lunaSession.userId}/garment-002-shirt-2.png`);
    createGarmentRecordsMock.mockResolvedValue({
      createdIds: ["garment-001", "garment-002"],
      createdCount: 2,
    });

    await createGarmentBatchAction(formData);

    expect(saveUploadMock).toHaveBeenCalledTimes(2);
    expect(createGarmentRecordsMock).toHaveBeenCalledWith(lunaSession.userId, [
      {
        garmentId: "garment-001",
        imageUrl: `/api/uploads/${lunaSession.userId}/garment-001-shirt-1.png`,
        input: {
          name: "鐧借‖琛? 1",
          subcategory: "shirt",
          color: "white",
          season: "winter",
          brand: "Moon Label",
          notes: "batch-import-note",
        },
      },
      {
        garmentId: "garment-002",
        imageUrl: `/api/uploads/${lunaSession.userId}/garment-002-shirt-2.png`,
        input: {
          name: "鐧借‖琛? 2",
          subcategory: "shirt",
          color: "white",
          season: "winter",
          brand: "Moon Label",
          notes: "batch-import-note",
        },
      },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/wardrobe");
    expect(redirectMock).toHaveBeenCalledWith("/import?mode=batch&createdCount=2");
  });

  it("redirects back to batch mode when no images were provided", async () => {
    const { createGarmentBatchAction } = await loadActions();
    const formData = new FormData();

    formData.set("subcategory", "shirt");
    redirectMock.mockImplementation((target: string) => {
      throw new RedirectSignal(target);
    });

    await expect(createGarmentBatchAction(formData)).rejects.toMatchObject({
      target: "/import?mode=batch&error=missing-images",
    });

    expect(saveUploadMock).not.toHaveBeenCalled();
    expect(createGarmentRecordsMock).not.toHaveBeenCalled();
  });

  it("surfaces a batch failure redirect when persistence throws", async () => {
    const { createGarmentBatchAction } = await loadActions();
    const formData = new FormData();

    formData.set("subcategory", "shirt");
    formData.append("images", createImageFile("shirt-1.png", "a"));

    randomUUIDMock.mockReturnValueOnce("garment-001");
    saveUploadMock.mockResolvedValueOnce(
      `/api/uploads/${lunaSession.userId}/garment-001-shirt-1.png`,
    );
    createGarmentRecordsMock.mockRejectedValueOnce(new Error("boom"));
    redirectMock.mockImplementation((target: string) => {
      if (target.includes("error=")) {
        throw new RedirectSignal(target);
      }
    });

    await expect(createGarmentBatchAction(formData)).rejects.toMatchObject({
      target: "/import?mode=batch&error=batch-failed",
    });

    expect(createGarmentRecordsMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
