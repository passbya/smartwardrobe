import { createLocalRepository } from "@/lib/local-repository";
import { createSupabaseRepository } from "@/lib/supabase-repository";
import type {
  GarmentInput,
  GarmentRecord,
  OutfitInput,
  OutfitRecord,
  UserSession,
} from "@/lib/types";

export type GarmentUpdates = Pick<
  GarmentRecord,
  "category" | "subcategory" | "color" | "season" | "brand" | "notes"
>;

export interface SmartWardrobeRepository {
  getOrCreatePresetProfile(slug: string): Promise<UserSession>;
  listGarments(userId: string): Promise<GarmentRecord[]>;
  getGarmentById(userId: string, garmentId: string): Promise<GarmentRecord | null>;
  saveUpload(userId: string, garmentId: string, file: File): Promise<string>;
  loadUpload(userId: string, fileName: string): Promise<Uint8Array | null>;
  createGarmentRecord(
    userId: string,
    garmentId: string,
    input: GarmentInput,
    imageUrl: string,
  ): Promise<GarmentRecord>;
  updateGarmentRecord(
    userId: string,
    garmentId: string,
    updates: GarmentUpdates,
  ): Promise<GarmentRecord | null>;
  deleteGarmentRecord(userId: string, garmentId: string): Promise<GarmentRecord | null>;
  listOutfits(userId: string): Promise<OutfitRecord[]>;
  getOutfitById(userId: string, outfitId: string): Promise<OutfitRecord | null>;
  createOutfitRecord(userId: string, input: OutfitInput): Promise<OutfitRecord>;
  updateOutfitRecord(
    userId: string,
    outfitId: string,
    input: OutfitInput,
  ): Promise<OutfitRecord | null>;
  deleteOutfitRecord(userId: string, outfitId: string): Promise<OutfitRecord | null>;
}

export type RepositoryMode = "local" | "supabase";

export type RepositoryStatus = {
  preferredMode: RepositoryMode;
  activeMode: RepositoryMode;
  supabaseConfigured: boolean;
  fallbackReason: string | null;
  fallbackAt: string | null;
};

type FallbackScope = "all" | "outfits";

type RepositoryFallback = {
  scope: FallbackScope;
  reason: string;
  activatedAt: string;
};

let repository: SmartWardrobeRepository | null = null;
let repositoryFallback: RepositoryFallback | null = null;

function hasSupabaseConfig() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function getPreferredRepositoryMode(): RepositoryMode {
  return hasSupabaseConfig() ? "supabase" : "local";
}

function collectErrorMessages(error: unknown, messages: string[] = []) {
  if (!(error instanceof Error)) {
    return messages;
  }

  if (error.message) {
    messages.push(error.message);
  }

  if (error.cause instanceof Error) {
    return collectErrorMessages(error.cause, messages);
  }

  return messages;
}

function getSupabaseBucket() {
  return process.env.SMARTWARDROBE_SUPABASE_BUCKET?.trim() || "garment-images";
}

function classifySupabaseFallback(
  error: unknown,
): { scope: FallbackScope; reason: string } | null {
  const details = collectErrorMessages(error).join(" | ");

  if (!details) {
    return null;
  }

  if (/PGRST205|Could not find the table|schema cache|does not exist/i.test(details)) {
    if (/outfits/i.test(details)) {
      return {
        scope: "outfits",
        reason:
          "Supabase 缺少 outfits 表，搭配功能将暂时回退到本地模式，衣物与图片仍继续使用 Supabase。",
      };
    }

    return {
      scope: "all",
      reason:
        "Supabase 缺少必要的数据表，已回退到本地预设身份模式。请先执行数据库 migration。",
    };
  }

  if (/Bucket not found|The resource was not found|storage.*404/i.test(details)) {
    return {
      scope: "all",
      reason: `Supabase 存储桶 ${getSupabaseBucket()} 不可用，已回退到本地预设身份模式。`,
    };
  }

  return null;
}

function activateFallback(scope: FallbackScope, reason: string) {
  if (repositoryFallback?.scope === "all") {
    return;
  }

  repositoryFallback = {
    scope:
      repositoryFallback?.scope === "outfits" || scope === "outfits" ? scope : "all",
    reason,
    activatedAt: new Date().toISOString(),
  };
}

function shouldUseLocalFallback(scope: FallbackScope) {
  if (!repositoryFallback) {
    return false;
  }

  return repositoryFallback.scope === "all" || repositoryFallback.scope === scope;
}

function createResilientSupabaseRepository(): SmartWardrobeRepository {
  const localRepository = createLocalRepository();
  const supabaseRepository = createSupabaseRepository();

  async function runWithFallback<T>(
    scope: FallbackScope,
    operation: (candidate: SmartWardrobeRepository) => Promise<T>,
  ) {
    if (shouldUseLocalFallback(scope)) {
      return operation(localRepository);
    }

    try {
      return await operation(supabaseRepository);
    } catch (error) {
      const fallback = classifySupabaseFallback(error);

      if (!fallback) {
        throw error;
      }

      activateFallback(fallback.scope, fallback.reason);

      if (shouldUseLocalFallback(scope)) {
        return operation(localRepository);
      }

      return operation(supabaseRepository);
    }
  }

  return {
    getOrCreatePresetProfile(slug: string) {
      return runWithFallback("all", (candidate) =>
        candidate.getOrCreatePresetProfile(slug),
      );
    },
    listGarments(userId: string) {
      return runWithFallback("all", (candidate) => candidate.listGarments(userId));
    },
    getGarmentById(userId: string, garmentId: string) {
      return runWithFallback("all", (candidate) =>
        candidate.getGarmentById(userId, garmentId),
      );
    },
    saveUpload(userId: string, garmentId: string, file: File) {
      return runWithFallback("all", (candidate) =>
        candidate.saveUpload(userId, garmentId, file),
      );
    },
    loadUpload(userId: string, fileName: string) {
      return runWithFallback("all", (candidate) => candidate.loadUpload(userId, fileName));
    },
    createGarmentRecord(userId: string, garmentId: string, input: GarmentInput, imageUrl: string) {
      return runWithFallback("all", (candidate) =>
        candidate.createGarmentRecord(userId, garmentId, input, imageUrl),
      );
    },
    updateGarmentRecord(userId: string, garmentId: string, updates: GarmentUpdates) {
      return runWithFallback("all", (candidate) =>
        candidate.updateGarmentRecord(userId, garmentId, updates),
      );
    },
    deleteGarmentRecord(userId: string, garmentId: string) {
      return runWithFallback("all", (candidate) =>
        candidate.deleteGarmentRecord(userId, garmentId),
      );
    },
    listOutfits(userId: string) {
      return runWithFallback("outfits", (candidate) => candidate.listOutfits(userId));
    },
    getOutfitById(userId: string, outfitId: string) {
      return runWithFallback("outfits", (candidate) =>
        candidate.getOutfitById(userId, outfitId),
      );
    },
    createOutfitRecord(userId: string, input: OutfitInput) {
      return runWithFallback("outfits", (candidate) =>
        candidate.createOutfitRecord(userId, input),
      );
    },
    updateOutfitRecord(userId: string, outfitId: string, input: OutfitInput) {
      return runWithFallback("outfits", (candidate) =>
        candidate.updateOutfitRecord(userId, outfitId, input),
      );
    },
    deleteOutfitRecord(userId: string, outfitId: string) {
      return runWithFallback("outfits", (candidate) =>
        candidate.deleteOutfitRecord(userId, outfitId),
      );
    },
  };
}

export function getRepositoryMode() {
  if (repositoryFallback?.scope === "all") {
    return "local";
  }

  return getPreferredRepositoryMode();
}

export function getRepositoryStatus(): RepositoryStatus {
  const preferredMode = getPreferredRepositoryMode();

  return {
    preferredMode,
    activeMode: repositoryFallback?.scope === "all" ? "local" : preferredMode,
    supabaseConfigured: hasSupabaseConfig(),
    fallbackReason: repositoryFallback?.reason ?? null,
    fallbackAt: repositoryFallback?.activatedAt ?? null,
  };
}

export function getRepository() {
  if (!repository) {
    repository =
      getPreferredRepositoryMode() === "supabase"
        ? createResilientSupabaseRepository()
        : createLocalRepository();
  }

  return repository;
}
