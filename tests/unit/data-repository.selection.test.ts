import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  lunaSession,
  novaSession,
} from "../helpers/preset-identity-fixtures";

const localRepository = {
  mode: "local",
  getOrCreatePresetProfile: vi.fn(async () => lunaSession),
  listGarments: vi.fn(async () => []),
  getGarmentById: vi.fn(async () => null),
  saveUpload: vi.fn(async () => `/api/uploads/${lunaSession.userId}/mock-file.jpg`),
  loadUpload: vi.fn(async () => null),
  createGarmentRecord: vi.fn(async () => ({
    id: "local-garment",
    user_id: lunaSession.userId,
    image_url: `/api/uploads/${lunaSession.userId}/mock-file.jpg`,
    name: "Local Garment",
    category: "tops",
    subcategory: "shirt",
    color: "",
    season: "",
    brand: "",
    notes: "",
    source: "manual_import",
    classification_source: "rule",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  })),
  updateGarmentRecord: vi.fn(async () => null),
  listOutfits: vi.fn(async () => []),
  getOutfitById: vi.fn(async () => null),
  createOutfitRecord: vi.fn(async () => ({
    id: "local-outfit",
    user_id: lunaSession.userId,
    name: "Local Outfit",
    generated_name: "Local Outfit",
    name_source: "generated",
    top_garment_id: "garment-top-001",
    bottom_garment_id: "garment-bottom-001",
    dress_garment_id: null,
    outerwear_garment_id: null,
    shoes_garment_id: null,
    accessory_garment_ids: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  })),
  updateOutfitRecord: vi.fn(async () => null),
  deleteOutfitRecord: vi.fn(async () => null),
};

const supabaseRepository = {
  mode: "supabase",
  getOrCreatePresetProfile: vi.fn(async () => novaSession),
  listGarments: vi.fn(async () => []),
  getGarmentById: vi.fn(async () => null),
  saveUpload: vi.fn(async () => `/api/uploads/${novaSession.userId}/mock-file.jpg`),
  loadUpload: vi.fn(async () => null),
  createGarmentRecord: vi.fn(async () => ({
    id: "supabase-garment",
    user_id: novaSession.userId,
    image_url: `/api/uploads/${novaSession.userId}/mock-file.jpg`,
    name: "Supabase Garment",
    category: "tops",
    subcategory: "shirt",
    color: "",
    season: "",
    brand: "",
    notes: "",
    source: "manual_import",
    classification_source: "rule",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  })),
  updateGarmentRecord: vi.fn(async () => null),
  listOutfits: vi.fn(async () => []),
  getOutfitById: vi.fn(async () => null),
  createOutfitRecord: vi.fn(async () => ({
    id: "supabase-outfit",
    user_id: novaSession.userId,
    name: "Supabase Outfit",
    generated_name: "Supabase Outfit",
    name_source: "generated",
    top_garment_id: "garment-top-001",
    bottom_garment_id: "garment-bottom-001",
    dress_garment_id: null,
    outerwear_garment_id: null,
    shoes_garment_id: null,
    accessory_garment_ids: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  })),
  updateOutfitRecord: vi.fn(async () => null),
  deleteOutfitRecord: vi.fn(async () => null),
};

const createLocalRepository = vi.fn(() => localRepository);
const createSupabaseRepository = vi.fn(() => supabaseRepository);

vi.mock("@/lib/local-repository", () => ({
  createLocalRepository,
}));

vi.mock("@/lib/supabase-repository", () => ({
  createSupabaseRepository,
}));

type DataRepositoryModule = typeof import("@/lib/data-repository");

describe("repository selection", () => {
  let repositoryModule: DataRepositoryModule;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    originalEnv = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SMARTWARDROBE_SUPABASE_BUCKET: process.env.SMARTWARDROBE_SUPABASE_BUCKET,
    };

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SMARTWARDROBE_SUPABASE_BUCKET;

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");
  });

  afterEach(() => {
    if (originalEnv.SUPABASE_URL === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    }

    if (originalEnv.SUPABASE_SERVICE_ROLE_KEY === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (originalEnv.SMARTWARDROBE_SUPABASE_BUCKET === undefined) {
      delete process.env.SMARTWARDROBE_SUPABASE_BUCKET;
    } else {
      process.env.SMARTWARDROBE_SUPABASE_BUCKET = originalEnv.SMARTWARDROBE_SUPABASE_BUCKET;
    }

    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("reports local mode when Supabase env vars are missing and keeps the first repository choice", () => {
    expect(repositoryModule.getRepositoryMode()).toBe("local");

    const repository = repositoryModule.getRepository();
    expect(repository).toBe(localRepository);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseRepository).not.toHaveBeenCalled();

    process.env.SUPABASE_URL = "https://supabase.example.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(repositoryModule.getRepositoryMode()).toBe("supabase");
    expect(repositoryModule.getRepository()).toBe(repository);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseRepository).not.toHaveBeenCalled();
  });

  it("selects the Supabase repository when both env vars are present", async () => {
    process.env.SUPABASE_URL = "https://supabase.example.test/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");

    expect(repositoryModule.getRepositoryMode()).toBe("supabase");

    const repository = repositoryModule.getRepository();

    expect(repository).not.toBe(localRepository);
    expect(createSupabaseRepository).toHaveBeenCalledTimes(1);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(repositoryModule.getRepositoryStatus()).toMatchObject({
      preferredMode: "supabase",
      activeMode: "supabase",
      fallbackReason: null,
    });
    await expect(repository.getOrCreatePresetProfile(novaSession.slug)).resolves.toEqual(
      novaSession,
    );
    expect(supabaseRepository.getOrCreatePresetProfile).toHaveBeenCalledTimes(1);
  });

  it("falls back to local mode when only one Supabase env var is present", async () => {
    process.env.SUPABASE_URL = "https://supabase.example.test";

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");

    expect(repositoryModule.getRepositoryMode()).toBe("local");
    expect(repositoryModule.getRepository()).toBe(localRepository);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseRepository).not.toHaveBeenCalled();
  });

  it("falls back to the local repository when Supabase is missing required tables", async () => {
    process.env.SUPABASE_URL = "https://supabase.example.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    supabaseRepository.getOrCreatePresetProfile.mockRejectedValueOnce(
      new Error(
        "SmartWardrobe failed to create or load preset profile luna: Supabase request failed with 404: {\"code\":\"PGRST205\",\"message\":\"Could not find the table 'public.profiles' in the schema cache\"}",
      ),
    );

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");

    const repository = repositoryModule.getRepository();
    const session = await repository.getOrCreatePresetProfile(lunaSession.slug);

    expect(session).toEqual(lunaSession);
    expect(localRepository.getOrCreatePresetProfile).toHaveBeenCalledTimes(1);
    expect(repositoryModule.getRepositoryMode()).toBe("local");
    expect(repositoryModule.getRepositoryStatus()).toMatchObject({
      preferredMode: "supabase",
      activeMode: "local",
    });
    expect(repositoryModule.getRepositoryStatus().fallbackReason).toBeTruthy();
  });

  it("forwards outfit CRUD to the selected repository implementation", async () => {
    process.env.SUPABASE_URL = "https://supabase.example.test/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");

    const repository = repositoryModule.getRepository();
    const created = await repository.createOutfitRecord(novaSession.userId, {
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      accessoryGarmentIds: [],
    });

    expect(created).toMatchObject({
      id: "supabase-outfit",
      user_id: novaSession.userId,
    });
    expect(supabaseRepository.createOutfitRecord).toHaveBeenCalledWith(novaSession.userId, {
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      accessoryGarmentIds: [],
    });
  });
});
