import { createLocalRepository } from "@/lib/local-repository";
import { createSupabaseRepository } from "@/lib/supabase-repository";
import type { DemoSession, GarmentInput, GarmentRecord } from "@/lib/types";

export type GarmentUpdates = Pick<
  GarmentRecord,
  "category" | "subcategory" | "color" | "season" | "brand" | "notes"
>;

export interface SmartWardrobeRepository {
  getOrCreateDemoProfile(): Promise<DemoSession>;
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
}

export type RepositoryMode = "local" | "supabase";

export type RepositoryStatus = {
  preferredMode: RepositoryMode;
  activeMode: RepositoryMode;
  supabaseConfigured: boolean;
  fallbackReason: string | null;
  fallbackAt: string | null;
};

let repository: SmartWardrobeRepository | null = null;
let repositoryFallback:
  | {
      reason: string;
      activatedAt: string;
    }
  | null = null;

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

function classifySupabaseFallback(error: unknown) {
  const details = collectErrorMessages(error).join(" | ");

  if (!details) {
    return null;
  }

  if (/PGRST205|Could not find the table|schema cache|does not exist/i.test(details)) {
    return "Supabase 缺少必需的数据表，已回退到本地 demo。请先执行初始 migration。";
  }

  if (/Bucket not found|The resource was not found|storage.*404/i.test(details)) {
    return `Supabase 存储桶 ${getSupabaseBucket()} 不可用，已回退到本地 demo。请先创建或修复该 bucket。`;
  }

  return null;
}

function activateLocalFallback(reason: string) {
  repositoryFallback = {
    reason,
    activatedAt: new Date().toISOString(),
  };
}

function createResilientSupabaseRepository(): SmartWardrobeRepository {
  const localRepository = createLocalRepository();
  const supabaseRepository = createSupabaseRepository();

  async function runWithFallback<T>(
    operation: (candidate: SmartWardrobeRepository) => Promise<T>,
  ) {
    if (repositoryFallback) {
      return operation(localRepository);
    }

    try {
      return await operation(supabaseRepository);
    } catch (error) {
      const fallbackReason = classifySupabaseFallback(error);

      if (!fallbackReason) {
        throw error;
      }

      activateLocalFallback(fallbackReason);
      return operation(localRepository);
    }
  }

  return {
    getOrCreateDemoProfile() {
      return runWithFallback((candidate) => candidate.getOrCreateDemoProfile());
    },
    listGarments(userId: string) {
      return runWithFallback((candidate) => candidate.listGarments(userId));
    },
    getGarmentById(userId: string, garmentId: string) {
      return runWithFallback((candidate) =>
        candidate.getGarmentById(userId, garmentId),
      );
    },
    saveUpload(userId: string, garmentId: string, file: File) {
      return runWithFallback((candidate) =>
        candidate.saveUpload(userId, garmentId, file),
      );
    },
    loadUpload(userId: string, fileName: string) {
      return runWithFallback((candidate) =>
        candidate.loadUpload(userId, fileName),
      );
    },
    createGarmentRecord(
      userId: string,
      garmentId: string,
      input: GarmentInput,
      imageUrl: string,
    ) {
      return runWithFallback((candidate) =>
        candidate.createGarmentRecord(userId, garmentId, input, imageUrl),
      );
    },
    updateGarmentRecord(userId: string, garmentId: string, updates: GarmentUpdates) {
      return runWithFallback((candidate) =>
        candidate.updateGarmentRecord(userId, garmentId, updates),
      );
    },
  };
}

export function getRepositoryMode() {
  return repositoryFallback ? "local" : getPreferredRepositoryMode();
}

export function getRepositoryStatus(): RepositoryStatus {
  const preferredMode = getPreferredRepositoryMode();

  return {
    preferredMode,
    activeMode: repositoryFallback ? "local" : preferredMode,
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
