import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { classifyGarmentByRules } from "@/lib/classification";
import type { SmartWardrobeRepository } from "@/lib/data-repository";
import {
  createOutfitPersistencePayload,
  type OutfitPersistencePayload,
} from "@/lib/outfit-logic";
import {
  getPresetIdentityBySlug,
  toUserSession,
} from "@/lib/preset-identities";
import type {
  GarmentInput,
  GarmentRecord,
  OutfitInput,
  OutfitRecord,
  UserSession,
} from "@/lib/types";
import {
  extractUploadReference,
  getGarmentsPath,
  getJsonDataDir,
  getOutfitsPath,
  getProfilesPath,
  getUploadsDir,
  resolveUploadFilePath,
  sanitizeUploadFileName,
} from "@/lib/storage-paths";

type ProfileRecord = {
  id: string;
  display_name: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

type RemoteGarmentRow = {
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

const EMPTY_JSON_ARRAY = "[]";

function createRepositoryError(operation: string, error: unknown) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unknown data store failure";

  return new Error(`SmartWardrobe failed to ${operation}: ${message}`, {
    cause: error instanceof Error ? error : undefined,
  });
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

async function ensureDirectoryTree() {
  await mkdir(getJsonDataDir(), { recursive: true });
  await mkdir(getUploadsDir(), { recursive: true });
}

async function ensureJsonFile(filePath: string) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    await writeFile(filePath, EMPTY_JSON_ARRAY, "utf8");
  }
}

async function ensureDataStore() {
  await ensureDirectoryTree();
  await Promise.all([
    ensureJsonFile(getProfilesPath()),
    ensureJsonFile(getGarmentsPath()),
    ensureJsonFile(getOutfitsPath()),
  ]);
}

async function atomicWriteFile(filePath: string, contents: string) {
  await ensureDirectoryTree();

  const directory = path.dirname(filePath);
  const tempFilePath = path.join(
    directory,
    `.${path.basename(filePath)}.${randomUUID()}.tmp`,
  );

  await writeFile(tempFilePath, contents, "utf8");

  try {
    await unlink(filePath);
  } catch (error) {
    if (!isNotFoundError(error)) {
      await unlink(tempFilePath).catch(() => undefined);
      throw error;
    }
  }

  try {
    await rename(tempFilePath, filePath);
  } catch (error) {
    await unlink(tempFilePath).catch(() => undefined);
    throw error;
  }
}

async function recoverCorruptedJson(filePath: string) {
  const backupPath = `${filePath}.corrupt-${Date.now()}`;

  try {
    await rename(filePath, backupPath);
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataStore();

  try {
    const content = await readFile(filePath, "utf8");

    return JSON.parse(content) as T;
  } catch (error) {
    if (isNotFoundError(error)) {
      await writeJsonFile(filePath, fallback);

      return fallback;
    }

    if (error instanceof SyntaxError) {
      await recoverCorruptedJson(filePath);
      await writeJsonFile(filePath, fallback);

      return fallback;
    }

    throw createRepositoryError(`read ${path.basename(filePath)}`, error);
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await ensureDataStore();

  try {
    await atomicWriteFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw createRepositoryError(`write ${path.basename(filePath)}`, error);
  }
}

async function loadUploadFile(
  userId: string,
  fileName: string,
): Promise<Uint8Array | null> {
  try {
    const absolutePath = resolveUploadFilePath(userId, fileName);
    return await readFile(absolutePath);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw createRepositoryError(`load upload ${fileName}`, error);
  }
}

async function removeUploadFile(imageUrl: string) {
  const reference = extractUploadReference(imageUrl);

  if (!reference) {
    return;
  }

  try {
    const absolutePath = resolveUploadFilePath(reference.userId, reference.fileName);
    await rm(absolutePath, { force: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }
}

async function getRemoteFallbackGarments(userId: string): Promise<GarmentRecord[]> {
  const url = process.env.SUPABASE_URL?.trim()?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return [];
  }

  const response = await fetch(
    `${url}/rest/v1/garments?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
    {
      cache: "no-store",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const rows = (await response.json()) as RemoteGarmentRow[];
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    image_url: row.image_url,
    name: row.name,
    category: row.category ?? "",
    subcategory: row.subcategory,
    color: row.color ?? "",
    season: row.season ?? "",
    brand: row.brand ?? "",
    notes: row.notes ?? "",
    source: row.source ?? "manual_import",
    classification_source: row.classification_source ?? "rule",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function getAllGarments() {
  return readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);
}

async function getAllOutfits() {
  return readJsonFile<OutfitRecord[]>(getOutfitsPath(), []);
}

function createOutfitRecordFromPayload(
  payload: OutfitPersistencePayload,
  outfitId: string,
  userId: string,
  createdAt: string,
  updatedAt: string,
): OutfitRecord {
  return {
    id: outfitId,
    user_id: userId,
    name: payload.name,
    generated_name: payload.generatedName,
    name_source: payload.nameSource,
    top_garment_id: payload.topGarmentId || null,
    bottom_garment_id: payload.bottomGarmentId || null,
    dress_garment_id: payload.dressGarmentId || null,
    outerwear_garment_id: payload.outerwearGarmentId || null,
    shoes_garment_id: payload.shoesGarmentId || null,
    accessory_garment_ids: payload.accessoryGarmentIds,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export function createLocalRepository(): SmartWardrobeRepository {
  return {
    async getOrCreatePresetProfile(slug: string): Promise<UserSession> {
      try {
        const identity = getPresetIdentityBySlug(slug);

        if (!identity) {
          throw new Error(`Unknown preset identity: ${slug}`);
        }

        const profiles = await readJsonFile<ProfileRecord[]>(getProfilesPath(), []);
        const existing = profiles.find((profile) => profile.id === identity.userId);

        if (existing) {
          return toUserSession(identity);
        }

        const now = new Date().toISOString();
        const createdProfile: ProfileRecord = {
          id: identity.userId,
          display_name: identity.displayName,
          is_demo: false,
          created_at: now,
          updated_at: now,
        };

        profiles.push(createdProfile);
        await writeJsonFile(getProfilesPath(), profiles);

        return toUserSession(identity);
      } catch (error) {
        throw createRepositoryError(`create or load preset profile ${slug}`, error);
      }
    },

    async listGarments(userId: string) {
      try {
        const garments = await getAllGarments();

        return garments
          .filter((garment) => garment.user_id === userId)
          .sort((left, right) => right.created_at.localeCompare(left.created_at));
      } catch (error) {
        throw createRepositoryError("list garments", error);
      }
    },

    async getGarmentById(userId: string, garmentId: string) {
      try {
        const garments = await getAllGarments();

        return (
          garments.find(
            (garment) => garment.user_id === userId && garment.id === garmentId,
          ) ?? null
        );
      } catch (error) {
        throw createRepositoryError(`load garment ${garmentId}`, error);
      }
    },

    async saveUpload(userId: string, garmentId: string, file: File) {
      try {
        if (!file.name || file.size <= 0) {
          throw new Error("Upload file is empty");
        }

        await ensureDataStore();

        const fileName = `${garmentId}-${sanitizeUploadFileName(file.name)}`;
        const uploadFolder = path.join(getUploadsDir(), userId);
        await mkdir(uploadFolder, { recursive: true });
        const absolutePath = resolveUploadFilePath(userId, fileName);
        const bytes = Buffer.from(await file.arrayBuffer());

        await writeFile(absolutePath, bytes);

        return `/api/uploads/${userId}/${fileName}`;
      } catch (error) {
        throw createRepositoryError(`save upload for garment ${garmentId}`, error);
      }
    },

    async loadUpload(userId: string, fileName: string) {
      return loadUploadFile(userId, fileName);
    },

    async createGarmentRecord(
      userId: string,
      garmentId: string,
      input: GarmentInput,
      imageUrl: string,
    ) {
      try {
        const garments = await getAllGarments();
        const ruleMatch = classifyGarmentByRules(input.subcategory);
        const now = new Date().toISOString();

        const garment: GarmentRecord = {
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
        };

        garments.push(garment);
        await writeJsonFile(getGarmentsPath(), garments);

        return garment;
      } catch (error) {
        throw createRepositoryError(`create garment ${garmentId}`, error);
      }
    },

    async updateGarmentRecord(userId: string, garmentId: string, updates) {
      try {
        const garments = await getAllGarments();
        const garmentIndex = garments.findIndex(
          (garment) => garment.user_id === userId && garment.id === garmentId,
        );

        if (garmentIndex === -1) {
          return null;
        }

        const currentGarment = garments[garmentIndex];
        const updatedGarment: GarmentRecord = {
          ...currentGarment,
          ...updates,
          classification_source: "manual",
          updated_at: new Date().toISOString(),
        };

        garments[garmentIndex] = updatedGarment;
        await writeJsonFile(getGarmentsPath(), garments);

        return updatedGarment;
      } catch (error) {
        throw createRepositoryError(`update garment ${garmentId}`, error);
      }
    },

    async deleteGarmentRecord(userId: string, garmentId: string) {
      try {
        const garments = await getAllGarments();
        const garmentIndex = garments.findIndex(
          (garment) => garment.user_id === userId && garment.id === garmentId,
        );

        if (garmentIndex === -1) {
          return null;
        }

        const [deletedGarment] = garments.splice(garmentIndex, 1);
        const outfits = await getAllOutfits();
        const remainingOutfits = outfits.filter(
          (outfit) =>
            outfit.user_id !== userId ||
            ![
              outfit.top_garment_id,
              outfit.bottom_garment_id,
              outfit.dress_garment_id,
              outfit.outerwear_garment_id,
              outfit.shoes_garment_id,
              ...outfit.accessory_garment_ids,
            ].includes(garmentId),
        );

        await removeUploadFile(deletedGarment.image_url);
        await writeJsonFile(getGarmentsPath(), garments);

        if (remainingOutfits.length !== outfits.length) {
          await writeJsonFile(getOutfitsPath(), remainingOutfits);
        }

        return deletedGarment;
      } catch (error) {
        throw createRepositoryError(`delete garment ${garmentId}`, error);
      }
    },

    async listOutfits(userId: string) {
      try {
        const outfits = await getAllOutfits();

        return outfits
          .filter((outfit) => outfit.user_id === userId)
          .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
      } catch (error) {
        throw createRepositoryError("list outfits", error);
      }
    },

    async getOutfitById(userId: string, outfitId: string) {
      try {
        const outfits = await getAllOutfits();

        return (
          outfits.find((outfit) => outfit.user_id === userId && outfit.id === outfitId) ??
          null
        );
      } catch (error) {
        throw createRepositoryError(`load outfit ${outfitId}`, error);
      }
    },

    async createOutfitRecord(userId: string, input: OutfitInput) {
      try {
        const outfits = await getAllOutfits();
        const garments = (await getAllGarments()).filter(
          (garment) => garment.user_id === userId,
        );
        const availableGarments =
          garments.length > 0 ? garments : await getRemoteFallbackGarments(userId);
        const outfitId = randomUUID();
        const now = new Date().toISOString();
        let payload: OutfitPersistencePayload;

        try {
          payload = createOutfitPersistencePayload(availableGarments, input);
        } catch (error) {
          throw error;
        }
        const outfit = createOutfitRecordFromPayload(
          payload,
          outfitId,
          userId,
          now,
          now,
        );

        outfits.push(outfit);
        await writeJsonFile(getOutfitsPath(), outfits);

        return outfit;
      } catch (error) {
        throw createRepositoryError("create outfit", error);
      }
    },

    async updateOutfitRecord(userId: string, outfitId: string, input: OutfitInput) {
      try {
        const outfits = await getAllOutfits();
        const outfitIndex = outfits.findIndex(
          (outfit) => outfit.user_id === userId && outfit.id === outfitId,
        );

        if (outfitIndex === -1) {
          return null;
        }

        const garments = (await getAllGarments()).filter(
          (garment) => garment.user_id === userId,
        );
        const availableGarments =
          garments.length > 0 ? garments : await getRemoteFallbackGarments(userId);
        const existingOutfit = outfits[outfitIndex];
        let payload: OutfitPersistencePayload;

        try {
          payload = createOutfitPersistencePayload(
            availableGarments,
            input,
            existingOutfit,
          );
        } catch (error) {
          throw error;
        }
        const updatedOutfit = createOutfitRecordFromPayload(
          payload,
          existingOutfit.id,
          existingOutfit.user_id,
          existingOutfit.created_at,
          new Date().toISOString(),
        );

        outfits[outfitIndex] = updatedOutfit;
        await writeJsonFile(getOutfitsPath(), outfits);

        return updatedOutfit;
      } catch (error) {
        throw createRepositoryError(`update outfit ${outfitId}`, error);
      }
    },

    async deleteOutfitRecord(userId: string, outfitId: string) {
      try {
        const outfits = await getAllOutfits();
        const outfitIndex = outfits.findIndex(
          (outfit) => outfit.user_id === userId && outfit.id === outfitId,
        );

        if (outfitIndex === -1) {
          return null;
        }

        const [deletedOutfit] = outfits.splice(outfitIndex, 1);
        await writeJsonFile(getOutfitsPath(), outfits);

        return deletedOutfit;
      } catch (error) {
        throw createRepositoryError(`delete outfit ${outfitId}`, error);
      }
    },
  };
}
