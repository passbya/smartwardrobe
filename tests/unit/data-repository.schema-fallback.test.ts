import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lunaSession } from "../helpers/preset-identity-fixtures";

const createLocalRepository = vi.fn(() => ({
  getOrCreatePresetProfile: vi.fn(async () => lunaSession),
}));

const createSupabaseRepository = vi.fn(() => ({
  getOrCreatePresetProfile: vi.fn(async () => {
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

  it("falls back to the local repository and still returns a preset identity session", async () => {
    expect(repositoryModule.getRepositoryMode()).toBe("supabase");

    const repository = repositoryModule.getRepository();
    const session = await repository.getOrCreatePresetProfile(lunaSession.slug);

    expect(session).toEqual(lunaSession);
    expect(repositoryModule.getRepositoryMode()).toBe("local");
    expect(repositoryModule.getRepositoryStatus()).toMatchObject({
      preferredMode: "supabase",
      activeMode: "local",
    });
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseRepository).toHaveBeenCalledTimes(1);
  });
});
