import Link from "next/link";
import { clearSessionAction } from "@/app/actions";
import { getRepositoryMode } from "@/lib/data-repository";
import type { UserSession } from "@/lib/types";

type AppShellProps = {
  session: UserSession;
  children: React.ReactNode;
};

export function AppShell({ session, children }: AppShellProps) {
  const repositoryMode = getRepositoryMode();
  const modeLabel =
    repositoryMode === "supabase" ? "数据模式 · Supabase" : "数据模式 · 本地预设";
  const modeDescription =
    repositoryMode === "supabase"
      ? "当前数据已经连接到 Supabase，衣物与图片都从远端仓储读取。"
      : "当前使用本地预设身份模式，适合开发和受控演示。";

  return (
    <div className="moon-shell min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-[rgba(6,13,24,0.72)] shadow-[0_10px_34px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link
              href="/wardrobe"
              className="display-font text-3xl font-semibold tracking-[0.08em] text-foreground-strong sm:text-[2rem]"
            >
              SmartWardrobe
            </Link>
            <span className="status-chip">{session.displayName}</span>
            <span
              className="status-chip border-[rgba(125,196,255,0.22)] bg-[rgba(12,24,46,0.72)] text-accent-soft"
              title={modeDescription}
            >
              {modeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex w-full flex-wrap items-center gap-1 rounded-full border border-line/70 bg-[rgba(11,21,39,0.62)] p-1 text-sm font-semibold text-muted sm:w-auto">
              <Link
                href="/wardrobe"
                className="rounded-full px-4 py-2 transition-colors hover:bg-[rgba(125,196,255,0.12)] hover:text-foreground-strong"
              >
                衣橱
              </Link>
              <Link
                href="/import"
                className="rounded-full px-4 py-2 transition-colors hover:bg-[rgba(125,196,255,0.12)] hover:text-foreground-strong"
              >
                导入
              </Link>
            </nav>

            <form action={clearSessionAction}>
              <button type="submit" className="secondary-button">
                切换身份
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
