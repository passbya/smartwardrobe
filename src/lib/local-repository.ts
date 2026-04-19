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
  getPresetIdentityBySlug,
  toUserSession,
} from "@/lib/preset-identities";
import type { GarmentInput, GarmentRecord, UserSession } from "@/lib/types";
import {
  extractUploadReference,
  getGarmentsPath,
  getJsonDataDir,
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
        const garments = await readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);

        return garments
          .filter((garment) => garment.user_id === userId)
          .sort((left, right) => right.created_at.localeCompare(left.created_at));
      } catch (error) {
        throw createRepositoryError("list garments", error);
      }
    },

    async getGarmentById(userId: string, garmentId: string) {
      try {
        const garments = await readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);

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
        const garments = await readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);
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
        const garments = await readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);
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
        const garments = await readJsonFile<GarmentRecord[]>(getGarmentsPath(), []);
        const garmentIndex = garments.findIndex(
          (garment) => garment.user_id === userId && garment.id === garmentId,
        );

        if (garmentIndex === -1) {
          return null;
        }

        const [deletedGarment] = garments.splice(garmentIndex, 1);
        await removeUploadFile(deletedGarment.image_url);
        await writeJsonFile(getGarmentsPath(), garments);

        return deletedGarment;
      } catch (error) {
        throw createRepositoryError(`delete garment ${garmentId}`, error);
      }
    },
  };
}
