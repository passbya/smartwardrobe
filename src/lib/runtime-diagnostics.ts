import { getRepositoryMode, getRepositoryStatus } from "@/lib/data-repository";
import { getAppDataDir } from "@/lib/storage-paths";

export type RuntimeRepositoryMode = ReturnType<typeof getRepositoryMode>;

export type RuntimeDiagnostics = {
  app: "smartwardrobe";
  repositoryMode: RuntimeRepositoryMode;
  preferredRepositoryMode: RuntimeRepositoryMode;
  ready: boolean;
  fallbackReason: string | null;
  fallbackAt: string | null;
  configuration: {
    dataDir: string;
    supabaseConfigured: boolean;
    supabaseBucket: string;
  };
};

export type HealthDiagnostics = {
  app: "smartwardrobe";
  status: "ok" | "degraded";
  repositoryMode: RuntimeRepositoryMode;
  preferredRepositoryMode: RuntimeRepositoryMode;
  ready: boolean;
  fallbackReason: string | null;
  checks: {
    supabaseConfigurationValid: boolean;
    localFallbackActive: boolean;
  };
};

function getSupabaseBucket() {
  return process.env.SMARTWARDROBE_SUPABASE_BUCKET?.trim() || "garment-images";
}

function isSupabaseConfigurationValid() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return false;
  }

  try {
    new URL(url);
  } catch {
    return false;
  }

  return true;
}

export function getRuntimeDiagnostics(): RuntimeDiagnostics {
  const repositoryStatus = getRepositoryStatus();
  const repositoryMode = repositoryStatus.activeMode;
  const supabaseConfigured = isSupabaseConfigurationValid();

  return {
    app: "smartwardrobe",
    repositoryMode,
    preferredRepositoryMode: repositoryStatus.preferredMode,
    ready: repositoryMode === "local" ? true : supabaseConfigured,
    fallbackReason: repositoryStatus.fallbackReason,
    fallbackAt: repositoryStatus.fallbackAt,
    configuration: {
      dataDir: getAppDataDir(),
      supabaseConfigured,
      supabaseBucket: getSupabaseBucket(),
    },
  };
}

export function getHealthDiagnostics(): HealthDiagnostics {
  const runtime = getRuntimeDiagnostics();

  return {
    app: runtime.app,
    status: runtime.ready && !runtime.fallbackReason ? "ok" : "degraded",
    repositoryMode: runtime.repositoryMode,
    preferredRepositoryMode: runtime.preferredRepositoryMode,
    ready: runtime.ready,
    fallbackReason: runtime.fallbackReason,
    checks: {
      supabaseConfigurationValid: runtime.configuration.supabaseConfigured,
      localFallbackActive: Boolean(runtime.fallbackReason),
    },
  };
}
