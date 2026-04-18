import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createLocalRepository = vi.fn(() => ({
  getOrCreateDemoProfile: vi.fn(async () => ({
    userId: "local-demo-user",
    displayName: "Demo Stylist",
    isDemo: true,
  })),
}));

const createSupabaseRepository = vi.fn(() => ({
  getOrCreateDemoProfile: vi.fn(async () => {
    throw new Error('relation "profiles" does not exist');
  }),
}));

vi.mock("@/lib/local-repository", () => ({
  createLocalRepository,
}));

vi.mock("@/lib/supabase-repository", () => ({
  createSupabaseRepository,
}));

type DataRepositoryModule = typeof import("@/lib/data-repository");

describe("repository fallback when Supabase schema is unavailable", () => {
  let repositoryModule: DataRepositoryModule;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    originalEnv = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SMARTWARDROBE_SUPABASE_BUCKET: process.env.SMARTWARDROBE_SUPABASE_BUCKET,
    };

    process.env.SUPABASE_URL = "https://supabase.example.test/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SMARTWARDROBE_SUPABASE_BUCKET = "garment-images";

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

  it("falls back to the local repository when Supabase is configured but schema access fails", async () => {
    expect(repositoryModule.getRepositoryMode()).toBe("supabase");

    const repository = repositoryModule.getRepository();
    const session = await repository.getOrCreateDemoProfile();

    expect(session).toEqual({
      userId: "local-demo-user",
      displayName: "Demo Stylist",
      isDemo: true,
    });

    expect(repositoryModule.getRepositoryMode()).toBe("local");
    expect(repositoryModule.getRepositoryStatus()).toMatchObject({
      preferredMode: "supabase",
      activeMode: "local",
    });
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseRepository).toHaveBeenCalledTimes(1);
  });
});
