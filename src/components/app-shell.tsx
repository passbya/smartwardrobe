import Link from "next/link";
import { getRepositoryMode } from "@/lib/data-repository";
import type { DemoSession } from "@/lib/types";

type AppShellProps = {
  session: DemoSession;
  children: React.ReactNode;
};

export function AppShell({ session, children }: AppShellProps) {
  const repositoryMode = getRepositoryMode();
  const modeLabel =
    repositoryMode === "supabase" ? "数据模式 · Supabase" : "数据模式 · 本地 demo";
  const modeDescription =
    repositoryMode === "supabase"
      ? "已连接 Supabase，数据会自动从远程存储读取。"
      : "当前使用本地演示数据，配置 Supabase 后会自动切换。";

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-[rgba(245,239,229,0.88)] shadow-[0_8px_30px_rgba(95,56,26,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link
              href="/wardrobe"
              className="display-font text-3xl font-semibold tracking-[0.08em] text-accent-strong sm:text-[2rem]"
            >
              SmartWardrobe
            </Link>
            <span className="status-chip">
              {session.displayName}
            </span>
            <span
              className="status-chip border-accent/20 bg-white/80 text-accent-strong"
              title={modeDescription}
            >
              {modeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex w-full flex-wrap items-center gap-1 rounded-full border border-line/70 bg-[rgba(255,251,245,0.68)] p-1 text-sm font-semibold text-muted sm:w-auto">
              <Link
                href="/wardrobe"
                className="rounded-full px-4 py-2 transition-colors hover:bg-white/65 hover:text-accent-strong"
              >
                衣橱
              </Link>
              <Link
                href="/import"
                className="rounded-full px-4 py-2 transition-colors hover:bg-white/65 hover:text-accent-strong"
              >
                导入
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
