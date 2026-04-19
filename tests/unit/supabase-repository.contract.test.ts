import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  lunaIdentity,
  lunaSession,
  novaIdentity,
} from "../helpers/preset-identity-fixtures";

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
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (originalEnv.SMARTWARDROBE_SUPABASE_BUCKET === undefined) {
      delete process.env.SMARTWARDROBE_SUPABASE_BUCKET;
    } else {
      process.env.SMARTWARDROBE_SUPABASE_BUCKET = originalEnv.SMARTWARDROBE_SUPABASE_BUCKET;
    }

    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("reads the existing stored profile for the requested preset identity session", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        [
          {
            id: lunaIdentity.userId,
            display_name: lunaIdentity.displayName,
            is_demo: false,
          },
        ],
        { status: 200 },
      ),
    );

    const session = await repositoryModule
      .createSupabaseRepository()
      .getOrCreatePresetProfile(lunaIdentity.slug);

    expect(session).toEqual(lunaSession);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/profiles?id=eq.${lunaIdentity.userId}&select=id,display_name,is_demo&limit=1`,
    );
  });

  it("creates a stored profile when no preset session profile exists yet", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json([], { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: novaIdentity.userId,
              display_name: novaIdentity.displayName,
              is_demo: false,
            },
          ],
          { status: 200 },
        ),
      );

    const session = await repositoryModule
      .createSupabaseRepository()
      .getOrCreatePresetProfile(novaIdentity.slug);

    expect(session).toEqual({
      userId: novaIdentity.userId,
      displayName: novaIdentity.displayName,
      slug: novaIdentity.slug,
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
      id: novaIdentity.userId,
      display_name: novaIdentity.displayName,
      is_demo: false,
    });
  });

  it("uploads files to the configured bucket and returns a stable app URL", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));

    const repository = repositoryModule.createSupabaseRepository();
    const uploadUrl = await repository.saveUpload(
      lunaSession.userId,
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

    expect(uploadUrl).toBe(
      `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://supabase.example.test/storage/v1/object/garment-images-test/${lunaSession.userId}/garment-001-mock-blazer.png`,
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

    const bytes = await repository.loadUpload(
      lunaSession.userId,
      "garment-001-mock-blazer.png",
    );
    const missing = await repository.loadUpload(lunaSession.userId, "missing.png");

    expect(new TextDecoder().decode(bytes ?? new Uint8Array())).toBe("binary-data");
    expect(missing).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://supabase.example.test/storage/v1/object/authenticated/garment-images-test/${lunaSession.userId}/garment-001-mock-blazer.png`,
    );
  });

  it("creates, updates, and reads garment rows through the REST contract", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: lunaSession.userId,
              image_url: `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
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
              user_id: lunaSession.userId,
              image_url: `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Moon Label",
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
              user_id: lunaSession.userId,
              image_url: `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Moon Label",
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
      lunaSession.userId,
      "garment-001",
      {
        name: "Mock Blazer",
        subcategory: "shirt",
        color: "",
        season: "",
        brand: "",
        notes: "",
      },
      `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
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

    const update = await repository.updateGarmentRecord(lunaSession.userId, "garment-001", {
      category: "outerwear",
      subcategory: "coat",
      color: "black",
      season: "winter",
      brand: "Moon Label",
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
      `https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.${lunaSession.userId}&select=*`,
    );
    expect(updateInit.method).toBe("PATCH");
    expect(updateHeaders.get("Content-Type")).toBe("application/json");
    expect(updateHeaders.get("Prefer")).toBe("return=representation");

    const loaded = await repository.getGarmentById(lunaSession.userId, "garment-001");
    expect(loaded).toMatchObject({
      id: "garment-001",
      category: "outerwear",
      season: "winter",
      classification_source: "manual",
    });

    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.${lunaSession.userId}&select=*&limit=1`,
    );
  });

  it("creates multiple garments through the bulk REST contract for batch import", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        [{ id: "garment-101" }, { id: "garment-102" }],
        { status: 200 },
      ),
    );

    const repository = repositoryModule.createSupabaseRepository();
    const result = await repository.createGarmentRecords(lunaSession.userId, [
      {
        garmentId: "garment-101",
        imageUrl: `/api/uploads/${lunaSession.userId}/garment-101-shirt-1.png`,
        input: {
          name: "鐧借‖琛? 1",
          subcategory: "shirt",
          color: "white",
          season: "winter",
          brand: "Moon Label",
          notes: "batch-one",
        },
      },
      {
        garmentId: "garment-102",
        imageUrl: `/api/uploads/${lunaSession.userId}/garment-102-shirt-2.png`,
        input: {
          name: "鐧借‖琛? 2",
          subcategory: "shirt",
          color: "white",
          season: "winter",
          brand: "Moon Label",
          notes: "batch-two",
        },
      },
    ]);

    expect(result).toEqual({
      createdIds: ["garment-101", "garment-102"],
      createdCount: 2,
    });

    const createInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const createHeaders = new Headers(createInit.headers);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/garments?select=id",
    );
    expect(createInit.method).toBe("POST");
    expect(createHeaders.get("Content-Type")).toBe("application/json");
    expect(createHeaders.get("Prefer")).toBe("return=representation");
    expect(JSON.parse(createInit.body as string)).toEqual([
      expect.objectContaining({
        id: "garment-101",
        user_id: lunaSession.userId,
        name: "鐧借‖琛? 1",
        subcategory: "shirt",
        color: "white",
        season: "winter",
        image_url: `/api/uploads/${lunaSession.userId}/garment-101-shirt-1.png`,
      }),
      expect.objectContaining({
        id: "garment-102",
        user_id: lunaSession.userId,
        name: "鐧借‖琛? 2",
        subcategory: "shirt",
        color: "white",
        season: "winter",
        image_url: `/api/uploads/${lunaSession.userId}/garment-102-shirt-2.png`,
      }),
    ]);
  });

  it("returns null when a Supabase lookup misses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));

    const repository = repositoryModule.createSupabaseRepository();

    await expect(repository.getGarmentById(lunaSession.userId, "missing")).resolves.toBeNull();
  });

  it("deletes a garment row and its storage object", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: lunaSession.userId,
              image_url: `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Moon Label",
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
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(Response.json([], { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "garment-001",
              user_id: lunaSession.userId,
              image_url: `/api/uploads/${lunaSession.userId}/garment-001-mock-blazer.png`,
              name: "Mock Blazer",
              category: "outerwear",
              subcategory: "coat",
              color: "black",
              season: "winter",
              brand: "Moon Label",
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
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    const repository = repositoryModule.createSupabaseRepository();

    const deleted = await repository.deleteGarmentRecord(lunaSession.userId, "garment-001");

    expect(deleted).toMatchObject({
      id: "garment-001",
      source: "manual_import",
      classification_source: "manual",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.${lunaSession.userId}&select=*&limit=1`,
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      `https://supabase.example.test/storage/v1/object/garment-images-test/${lunaSession.userId}/garment-001-mock-blazer.png`,
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "DELETE",
    });

    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?user_id=eq.${lunaSession.userId}&or=(top_garment_id.eq.garment-001%2Cbottom_garment_id.eq.garment-001%2Cdress_garment_id.eq.garment-001%2Couterwear_garment_id.eq.garment-001%2Cshoes_garment_id.eq.garment-001%2Caccessory_garment_ids.cs.%7Bgarment-001%7D)&select=*`,
    );
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      method: "DELETE",
    });

    const deleteInit = fetchMock.mock.calls[3]?.[1] as RequestInit;
    const deleteHeaders = new Headers(deleteInit.headers);
    expect(fetchMock.mock.calls[3]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/garments?id=eq.garment-001&user_id=eq.${lunaSession.userId}&select=*`,
    );
    expect(deleteInit.method).toBe("DELETE");
    expect(deleteHeaders.get("Prefer")).toBe("return=representation");

    await expect(repository.deleteGarmentRecord(lunaSession.userId, "missing")).resolves.toBeNull();
  });

  it("creates, updates, lists, reads, and deletes outfit rows through the REST contract", async () => {
    const listGarmentsResponse = [
      {
        id: "garment-top-001",
        user_id: lunaSession.userId,
        image_url: `/api/uploads/${lunaSession.userId}/garment-top-001.png`,
        name: "Nebula Shirt",
        category: "tops",
        subcategory: "shirt",
        color: null,
        season: null,
        brand: null,
        notes: null,
        source: "manual_import",
        classification_source: "rule",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "garment-bottom-001",
        user_id: lunaSession.userId,
        image_url: `/api/uploads/${lunaSession.userId}/garment-bottom-001.png`,
        name: "Midnight Skirt",
        category: "bottoms",
        subcategory: "skirt",
        color: null,
        season: null,
        brand: null,
        notes: null,
        source: "manual_import",
        classification_source: "rule",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "garment-outerwear-001",
        user_id: lunaSession.userId,
        image_url: `/api/uploads/${lunaSession.userId}/garment-outerwear-001.png`,
        name: "Aurora Coat",
        category: "outerwear",
        subcategory: "coat",
        color: null,
        season: null,
        brand: null,
        notes: null,
        source: "manual_import",
        classification_source: "rule",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const updatedOutfitRow = {
      id: "outfit-001",
      user_id: lunaSession.userId,
      name: "Moonlight Commute",
      generated_name: "Nebula Shirt + Midnight Skirt等3件",
      name_source: "manual",
      top_garment_id: "garment-top-001",
      bottom_garment_id: "garment-bottom-001",
      dress_garment_id: null,
      outerwear_garment_id: "garment-outerwear-001",
      shoes_garment_id: null,
      accessory_garment_ids: [],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };

    fetchMock
      .mockResolvedValueOnce(Response.json(listGarmentsResponse, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          [
            {
              id: "outfit-001",
              user_id: lunaSession.userId,
              name: "Nebula Shirt + Midnight Skirt",
              generated_name: "Nebula Shirt + Midnight Skirt",
              name_source: "generated",
              top_garment_id: "garment-top-001",
              bottom_garment_id: "garment-bottom-001",
              dress_garment_id: null,
              outerwear_garment_id: null,
              shoes_garment_id: null,
              accessory_garment_ids: [],
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(Response.json([updatedOutfitRow], { status: 200 }))
      .mockResolvedValueOnce(Response.json(listGarmentsResponse, { status: 200 }))
      .mockResolvedValueOnce(Response.json([updatedOutfitRow], { status: 200 }))
      .mockResolvedValueOnce(Response.json([updatedOutfitRow], { status: 200 }))
      .mockResolvedValueOnce(Response.json([updatedOutfitRow], { status: 200 }))
      .mockResolvedValueOnce(Response.json([updatedOutfitRow], { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    const repository = repositoryModule.createSupabaseRepository();

    const created = await repository.createOutfitRecord(lunaSession.userId, {
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      accessoryGarmentIds: [],
    });

    expect(created).toMatchObject({
      id: "outfit-001",
      user_id: lunaSession.userId,
      name: "Nebula Shirt + Midnight Skirt",
      generated_name: "Nebula Shirt + Midnight Skirt",
      name_source: "generated",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/garments?user_id=eq.${lunaSession.userId}&select=*&order=created_at.desc`,
    );

    const createInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const createHeaders = new Headers(createInit.headers);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://supabase.example.test/rest/v1/outfits?select=*",
    );
    expect(createInit.method).toBe("POST");
    expect(createHeaders.get("Content-Type")).toBe("application/json");
    expect(createHeaders.get("Prefer")).toBe("return=representation");
    expect(JSON.parse(createInit.body as string)).toEqual(
      expect.objectContaining({
        user_id: lunaSession.userId,
        name: "Nebula Shirt + Midnight Skirt",
        generated_name: "Nebula Shirt + Midnight Skirt",
        name_source: "generated",
        top_garment_id: "garment-top-001",
        bottom_garment_id: "garment-bottom-001",
        dress_garment_id: null,
        outerwear_garment_id: null,
        shoes_garment_id: null,
        accessory_garment_ids: [],
      }),
    );

    const updated = await repository.updateOutfitRecord(lunaSession.userId, "outfit-001", {
      name: "Moonlight Commute",
      topGarmentId: "garment-top-001",
      bottomGarmentId: "garment-bottom-001",
      outerwearGarmentId: "garment-outerwear-001",
      accessoryGarmentIds: [],
    });

    expect(updated).toMatchObject({
      id: "outfit-001",
      name: "Moonlight Commute",
      generated_name: "Nebula Shirt + Midnight Skirt等3件",
      name_source: "manual",
      outerwear_garment_id: "garment-outerwear-001",
    });

    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?id=eq.outfit-001&user_id=eq.${lunaSession.userId}&select=*&limit=1`,
    );
    expect(fetchMock.mock.calls[3]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/garments?user_id=eq.${lunaSession.userId}&select=*&order=created_at.desc`,
    );

    const updateInit = fetchMock.mock.calls[4]?.[1] as RequestInit;
    const updateHeaders = new Headers(updateInit.headers);
    expect(fetchMock.mock.calls[4]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?id=eq.outfit-001&user_id=eq.${lunaSession.userId}&select=*`,
    );
    expect(updateInit.method).toBe("PATCH");
    expect(updateHeaders.get("Content-Type")).toBe("application/json");
    expect(updateHeaders.get("Prefer")).toBe("return=representation");

    const loaded = await repository.getOutfitById(lunaSession.userId, "outfit-001");
    expect(loaded).toMatchObject({
      id: "outfit-001",
      name: "Moonlight Commute",
      name_source: "manual",
    });
    expect(fetchMock.mock.calls[5]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?id=eq.outfit-001&user_id=eq.${lunaSession.userId}&select=*&limit=1`,
    );

    const listed = await repository.listOutfits(lunaSession.userId);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: "outfit-001",
      name: "Moonlight Commute",
    });
    expect(fetchMock.mock.calls[6]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?user_id=eq.${lunaSession.userId}&select=*&order=updated_at.desc`,
    );

    const deleted = await repository.deleteOutfitRecord(lunaSession.userId, "outfit-001");
    expect(deleted).toMatchObject({
      id: "outfit-001",
      name: "Moonlight Commute",
    });

    const deleteInit = fetchMock.mock.calls[7]?.[1] as RequestInit;
    const deleteHeaders = new Headers(deleteInit.headers);
    expect(fetchMock.mock.calls[7]?.[0]).toBe(
      `https://supabase.example.test/rest/v1/outfits?id=eq.outfit-001&user_id=eq.${lunaSession.userId}&select=*`,
    );
    expect(deleteInit.method).toBe("DELETE");
    expect(deleteHeaders.get("Prefer")).toBe("return=representation");

    await expect(repository.getOutfitById(lunaSession.userId, "missing-outfit")).resolves.toBeNull();
  });
});
