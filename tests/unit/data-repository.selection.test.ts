import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localRepository = {
  mode: "local",
  getOrCreateDemoProfile: vi.fn(async () => ({
    userId: "local-user",
    displayName: "Local Demo",
    isDemo: true,
  })),
  listGarments: vi.fn(async () => []),
  getGarmentById: vi.fn(async () => null),
  saveUpload: vi.fn(async () => "/api/uploads/local-user/mock-file.jpg"),
  loadUpload: vi.fn(async () => null),
  createGarmentRecord: vi.fn(async () => ({
    id: "local-garment",
    user_id: "local-user",
    image_url: "/api/uploads/local-user/mock-file.jpg",
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
};

const supabaseRepository = {
  mode: "supabase",
  getOrCreateDemoProfile: vi.fn(async () => ({
    userId: "supabase-user",
    displayName: "Supabase Demo",
    isDemo: true,
  })),
  listGarments: vi.fn(async () => []),
  getGarmentById: vi.fn(async () => null),
  saveUpload: vi.fn(async () => "/api/uploads/supabase-user/mock-file.jpg"),
  loadUpload: vi.fn(async () => null),
  createGarmentRecord: vi.fn(async () => ({
    id: "supabase-garment",
    user_id: "supabase-user",
    image_url: "/api/uploads/supabase-user/mock-file.jpg",
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
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (originalEnv.SMARTWARDROBE_SUPABASE_BUCKET === undefined) {
      delete process.env.SMARTWARDROBE_SUPABASE_BUCKET;
    } else {
      process.env.SMARTWARDROBE_SUPABASE_BUCKET =
        originalEnv.SMARTWARDROBE_SUPABASE_BUCKET;
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
    await expect(repository.getOrCreateDemoProfile()).resolves.toMatchObject({
      userId: "supabase-user",
    });
    expect(supabaseRepository.getOrCreateDemoProfile).toHaveBeenCalledTimes(1);
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
    supabaseRepository.getOrCreateDemoProfile.mockRejectedValueOnce(
      new Error(
        "SmartWardrobe failed to create or load the demo profile: Supabase request failed with 404: {\"code\":\"PGRST205\",\"message\":\"Could not find the table 'public.profiles' in the schema cache\"}",
      ),
    );

    vi.resetModules();
    repositoryModule = await import("@/lib/data-repository");

    const repository = repositoryModule.getRepository();
    const session = await repository.getOrCreateDemoProfile();

    expect(session).toMatchObject({ userId: "local-user" });
    expect(localRepository.getOrCreateDemoProfile).toHaveBeenCalledTimes(1);
    expect(repositoryModule.getRepositoryMode()).toBe("local");
    expect(repositoryModule.getRepositoryStatus()).toMatchObject({
      preferredMode: "supabase",
      activeMode: "local",
    });
    expect(repositoryModule.getRepositoryStatus().fallbackReason).toContain(
      "缺少必需的数据表",
    );
  });
});
