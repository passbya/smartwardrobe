import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

type SupabaseRepositoryModule = typeof import("@/lib/supabase-repository");

describe("Supabase repository contract", () => {
  let repositoryModule: SupabaseRepositoryModule;
  let originalEnv: Record<string, string | undefined>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    originalEnv = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SMARTWARDROBE_SUPABASE_BUCKET: process.env.SMARTWARDROBE_SUPABASE_BUCKET,
    };

    process.env.SUPABASE_URL = "https://supabase.example.test/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SMARTWARDROBE_SUPABASE_BUCKET = "garment-images-test";

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    repositoryModule = await import("@/lib/supabase-repository");
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

    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("reads the existing demo profile and normalizes the response", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        [
          {
            id: "demo-profile",
            display_name: "Demo Stylist",
            is_demo: true,
          },
        ],
        { status: 200 },
      ),
    );

    const session = await repositoryModule.createSupabaseRepository().getOrCreateDemoProfile();

    expect(session).toEqual({
      userId: "demo-profile",
      displayName: "Demo Stylist",
      isDemo: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/profiles?is_demo=eq.true&select=id,display_name,is_demo&order=created_at.asc&limit=1",
    );
  });

  it("creates a demo profile when none exists and sends the expected payload", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json([], { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "new-demo-profile",
              display_name: null,
              is_demo: true,
            },
          ],
          { status: 200 },
        ),
      );

    const session = await repositoryModule.createSupabaseRepository().getOrCreateDemoProfile();

    expect(session).toEqual({
      userId: "new-demo-profile",
      displayName: "Demo Stylist",
      isDemo: true,
    });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "GET",
    });

    const postInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const postHeaders = new Headers(postInit.headers);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/profiles?select=id,display_name,is_demo",
    );
    expect(postInit.method).toBe("POST");
    expect(postHeaders.get("Content-Type")).toBe("application/json");
    expect(postHeaders.get("Prefer")).toBe("return=representation");
    expect(JSON.parse(postInit.body as string)).toEqual({
      display_name: "Demo Stylist",
      is_demo: true,
    });
  });

  it("uploads files to the configured bucket and returns a stable app URL", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));

    const repository = repositoryModule.createSupabaseRepository();
    const uploadUrl = await repository.saveUpload(
      "demo-user",
      "garment-001",
      {
        name: "Mock Blazer.png",
        size: 12,
        type: "image/png",
        async arrayBuffer() {
          return new TextEncoder().encode("image-bytes").buffer;
        },
      } as File,
    );

    expect(uploadUrl).toBe("/api/uploads/demo-user/garment-001-mock-blazer.png");
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://supabase.example.test/storage/v1/object/garment-images-test/demo-user/garment-001-mock-blazer.png",
    );

    const uploadInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const uploadHeaders = new Headers(uploadInit.headers);
    expect(uploadInit.method).toBe("POST");
    expect(uploadHeaders.get("apikey")).toBe("service-role-key");
    expect(uploadHeaders.get("Authorization")).toBe("Bearer service-role-key");
    expect(uploadHeaders.get("Content-Type")).toBe("image/png");
    expect(uploadHeaders.get("x-upsert")).toBe("true");
  });

  it("returns bytes for existing uploads and null for missing uploads", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(new TextEncoder().encode("binary-data"), {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    const repository = repositoryModule.createSupabaseRepository();

    const bytes = await repository.loadUpload("demo-user", "garment-001-mock-blazer.png");
    const missing = await repository.loadUpload("demo-user", "missing.png");

    expect(new TextDecoder().decode(bytes ?? new Uint8Array())).toBe("binary-data");
    expect(missing).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://supabase.example.test/storage/v1/object/authenticated/garment-images-test/demo-user/garment-001-mock-blazer.png",
    );
  });

  it("creates, updates, and reads garment rows through the REST contract", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: "demo-user",
              image_url: "/api/uploads/demo-user/garment-001-mock-blazer.png",
              name: "Mock Blazer",
              category: "tops",
              subcategory: "shirt",
              color: null,
              season: "spring",
              brand: null,
              notes: null,
              source: null,
              classification_source: "rule",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: "demo-user",
              image_url: "/api/uploads/demo-user/garment-001-mock-blazer.png",
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Demo Label",
              notes: "Manually corrected",
              source: "manual_import",
              classification_source: "manual",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: "demo-user",
              image_url: "/api/uploads/demo-user/garment-001-mock-blazer.png",
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Demo Label",
              notes: "Manually corrected",
              source: "manual_import",
              classification_source: "manual",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          { status: 200 },
        ),
      );

    const repository = repositoryModule.createSupabaseRepository();

    const created = await repository.createGarmentRecord(
      "demo-user",
      "garment-001",
      {
        name: "Mock Blazer",
        subcategory: "shirt",
        color: "",
        season: "",
        brand: "",
        notes: "",
      },
      "/api/uploads/demo-user/garment-001-mock-blazer.png",
    );

    expect(created).toMatchObject({
      id: "garment-001",
      category: "tops",
      season: "spring",
      classification_source: "rule",
      source: "manual_import",
    });

    const createInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const createHeaders = new Headers(createInit.headers);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/garments?select=*",
    );
    expect(createInit.method).toBe("POST");
    expect(createHeaders.get("Content-Type")).toBe("application/json");
    expect(createHeaders.get("Prefer")).toBe("return=representation");

    const update = await repository.updateGarmentRecord("demo-user", "garment-001", {
      category: "outerwear",
      subcategory: "coat",
      color: "black",
      season: "winter",
      brand: "Demo Label",
      notes: "Manually corrected",
    });

    expect(update).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      season: "winter",
      classification_source: "manual",
    });

    const updateInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const updateHeaders = new Headers(updateInit.headers);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.demo-user&select=*",
    );
    expect(updateInit.method).toBe("PATCH");
    expect(updateHeaders.get("Content-Type")).toBe("application/json");
    expect(updateHeaders.get("Prefer")).toBe("return=representation");

    const loaded = await repository.getGarmentById("demo-user", "garment-001");
    expect(loaded).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      season: "winter",
      classification_source: "manual",
    });

    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.demo-user&select=*&limit=1",
    );
  });

  it("returns null when a Supabase lookup misses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));

    const repository = repositoryModule.createSupabaseRepository();

    await expect(repository.getGarmentById("demo-user", "missing")).resolves.toBeNull();
  });
});
