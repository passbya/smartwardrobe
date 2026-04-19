import { classifyGarmentByRules } from "@/lib/classification";
import type { SmartWardrobeRepository } from "@/lib/data-repository";
import {
  getPresetIdentityBySlug,
  toUserSession,
} from "@/lib/preset-identities";
import type { GarmentInput, GarmentRecord, UserSession } from "@/lib/types";
import {
  extractUploadReference,
  getUploadObjectKey,
  sanitizeUploadFileName,
} from "@/lib/storage-paths";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  is_demo: boolean | null;
};

type GarmentRow = {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  category: string | null;
  subcategory: string;
  color: string | null;
  season: string | null;
  brand: string | null;
  notes: string | null;
  source: string | null;
  classification_source: "rule" | "manual" | null;
  created_at: string;
  updated_at: string;
};

function createRepositoryError(operation: string, error: unknown) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unknown Supabase failure";

  return new Error(`SmartWardrobe failed to ${operation}: ${message}`, {
    cause: error instanceof Error ? error : undefined,
  });
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SMARTWARDROBE_SUPABASE_BUCKET?.trim() || "garment-images";

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase configuration is incomplete");
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
    bucket,
  };
}

function createSupabaseHeaders(config: SupabaseConfig, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  return headers;
}

function encodeStoragePath(pathValue: string) {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeText(value: string | null | undefined) {
  return value ?? "";
}

function toGarmentRecord(row: GarmentRow): GarmentRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    image_url: row.image_url,
    name: row.name,
    category: normalizeText(row.category),
    subcategory: row.subcategory,
    color: normalizeText(row.color),
    season: normalizeText(row.season),
    brand: normalizeText(row.brand),
    notes: normalizeText(row.notes),
    source: normalizeText(row.source) || "manual_import",
    classification_source: row.classification_source ?? "rule",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function fetchJson<T>(config: SupabaseConfig, pathValue: string, init: RequestInit) {
  const response = await fetch(`${config.url}${pathValue}`, {
    ...init,
    headers: createSupabaseHeaders(config, init.headers),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Supabase request failed with ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

async function fetchMaybeJson<T>(
  config: SupabaseConfig,
  pathValue: string,
  init: RequestInit,
) {
  const response = await fetch(`${config.url}${pathValue}`, {
    ...init,
    headers: createSupabaseHeaders(config, init.headers),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Supabase request failed with ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

async function getBinary(
  config: SupabaseConfig,
  pathValue: string,
): Promise<Uint8Array | null> {
  const response = await fetch(`${config.url}${pathValue}`, {
    headers: createSupabaseHeaders(config),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Supabase request failed with ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function deleteStorageObject(config: SupabaseConfig, imageUrl: string) {
  const reference = extractUploadReference(imageUrl);

  if (!reference) {
    return;
  }

  const objectKey = getUploadObjectKey(reference.userId, reference.fileName);
  const response = await fetch(
    `${config.url}/storage/v1/object/${config.bucket}/${encodeStoragePath(objectKey)}`,
    {
      method: "DELETE",
      headers: createSupabaseHeaders(config),
    },
  );

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Supabase storage delete failed with ${response.status}${details ? `: ${details}` : ""}`,
    );
  }
}

export function createSupabaseRepository(): SmartWardrobeRepository {
  return {
    async getOrCreatePresetProfile(slug: string): Promise<UserSession> {
      try {
        const identity = getPresetIdentityBySlug(slug);

        if (!identity) {
          throw new Error(`Unknown preset identity: ${slug}`);
        }

        const config = getSupabaseConfig();
        const existing = await fetchMaybeJson<ProfileRow[]>(
          config,
          `/rest/v1/profiles?id=eq.${encodeURIComponent(identity.userId)}&select=id,display_name,is_demo&limit=1`,
          {
            method: "GET",
          },
        );

        const current = existing?.[0];
        if (current) {
          return toUserSession({
            ...identity,
            displayName: current.display_name || identity.displayName,
          });
        }

        const created = await fetchJson<ProfileRow[]>(
          config,
          "/rest/v1/profiles?select=id,display_name,is_demo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              id: identity.userId,
              display_name: identity.displayName,
              is_demo: false,
            }),
          },
        );

        const profile = created[0];

        return toUserSession({
          ...identity,
          displayName: profile.display_name || identity.displayName,
        });
      } catch (error) {
        throw createRepositoryError(`create or load preset profile ${slug}`, error);
      }
    },

    async listGarments(userId: string) {
      try {
        const config = getSupabaseConfig();
        const garments = await fetchMaybeJson<GarmentRow[]>(
          config,
          `/rest/v1/garments?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
          { method: "GET" },
        );

        return (garments ?? []).map(toGarmentRecord);
      } catch (error) {
        throw createRepositoryError("list garments", error);
      }
    },

    async getGarmentById(userId: string, garmentId: string) {
      try {
        const config = getSupabaseConfig();
        const garments = await fetchMaybeJson<GarmentRow[]>(
          config,
          `/rest/v1/garments?id=eq.${encodeURIComponent(garmentId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
          { method: "GET" },
        );

        return garments?.[0] ? toGarmentRecord(garments[0]) : null;
      } catch (error) {
        throw createRepositoryError(`load garment ${garmentId}`, error);
      }
    },

    async saveUpload(userId: string, garmentId: string, file: File) {
      try {
        if (!file.name || file.size <= 0) {
          throw new Error("Upload file is empty");
        }

        const config = getSupabaseConfig();
        const fileName = `${garmentId}-${sanitizeUploadFileName(file.name)}`;
        const objectKey = getUploadObjectKey(userId, fileName);
        const uploadBytes = await file.arrayBuffer();

        const response = await fetch(
          `${config.url}/storage/v1/object/${config.bucket}/${encodeStoragePath(objectKey)}`,
          {
            method: "POST",
            headers: createSupabaseHeaders(config, {
              "Content-Type": file.type || "application/octet-stream",
              "x-upsert": "true",
            }),
            body: uploadBytes,
          },
        );

        if (!response.ok) {
          const details = await response.text().catch(() => "");
          throw new Error(
            `Supabase upload failed with ${response.status}${details ? `: ${details}` : ""}`,
          );
        }

        return `/api/uploads/${userId}/${fileName}`;
      } catch (error) {
        throw createRepositoryError(`save upload for garment ${garmentId}`, error);
      }
    },

    async loadUpload(userId: string, fileName: string) {
      try {
        const config = getSupabaseConfig();
        const objectKey = getUploadObjectKey(userId, fileName);

        return await getBinary(
          config,
          `/storage/v1/object/authenticated/${config.bucket}/${encodeStoragePath(objectKey)}`,
        );
      } catch (error) {
        if (error instanceof Error && /404/.test(error.message)) {
          return null;
        }

        if (error instanceof Error && error.message === "Invalid upload path") {
          return null;
        }

        throw createRepositoryError(`load upload ${fileName}`, error);
      }
    },

    async createGarmentRecord(
      userId: string,
      garmentId: string,
      input: GarmentInput,
      imageUrl: string,
    ) {
      try {
        const config = getSupabaseConfig();
        const ruleMatch = classifyGarmentByRules(input.subcategory);
        const now = new Date().toISOString();

        const rows = await fetchJson<GarmentRow[]>(
          config,
          "/rest/v1/garments?select=*",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              id: garmentId,
              user_id: userId,
              image_url: imageUrl,
              name: input.name,
              category: ruleMatch?.category ?? "",
              subcategory: input.subcategory,
              color: input.color ?? "",
              season: input.season || ruleMatch?.season || "",
              brand: input.brand ?? "",
              notes: input.notes ?? "",
              source: "manual_import",
              classification_source: "rule",
              created_at: now,
              updated_at: now,
            }),
          },
        );

        return toGarmentRecord(rows[0]);
      } catch (error) {
        throw createRepositoryError(`create garment ${garmentId}`, error);
      }
    },

    async updateGarmentRecord(userId: string, garmentId: string, updates) {
      try {
        const config = getSupabaseConfig();
        const now = new Date().toISOString();
        const rows = await fetchMaybeJson<GarmentRow[]>(
          config,
          `/rest/v1/garments?id=eq.${encodeURIComponent(garmentId)}&user_id=eq.${encodeURIComponent(userId)}&select=*`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              ...updates,
              classification_source: "manual",
              updated_at: now,
            }),
          },
        );

        return rows?.[0] ? toGarmentRecord(rows[0]) : null;
      } catch (error) {
        throw createRepositoryError(`update garment ${garmentId}`, error);
      }
    },

    async deleteGarmentRecord(userId: string, garmentId: string) {
      try {
        const config = getSupabaseConfig();
        const current = await fetchMaybeJson<GarmentRow[]>(
          config,
          `/rest/v1/garments?id=eq.${encodeURIComponent(garmentId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
          { method: "GET" },
        );

        const garment = current?.[0];

        if (!garment) {
          return null;
        }

        await deleteStorageObject(config, garment.image_url);

        const deleted = await fetchMaybeJson<GarmentRow[]>(
          config,
          `/rest/v1/garments?id=eq.${encodeURIComponent(garmentId)}&user_id=eq.${encodeURIComponent(userId)}&select=*`,
          {
            method: "DELETE",
            headers: {
              Prefer: "return=representation",
            },
          },
        );

        return deleted?.[0] ? toGarmentRecord(deleted[0]) : toGarmentRecord(garment);
      } catch (error) {
        throw createRepositoryError(`delete garment ${garmentId}`, error);
      }
    },
  };
}
