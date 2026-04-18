import { redirect } from "next/navigation";
import { startDemoSessionAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { getRepositoryMode } from "@/lib/data-repository";
import { getCurrentSession } from "@/lib/session";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "session") {
    return "会话创建失败，请刷新页面后重试。";
  }

  return "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  const repositoryMode = getRepositoryMode();
  const modeLabel =
    repositoryMode === "supabase" ? "当前数据：Supabase" : "当前数据：本地 demo";

  if (session) {
    redirect("/wardrobe");
  }

  const params = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(199,164,127,0.24),transparent_34%),linear-gradient(140deg,#f5ede1_0%,#efe2d2_42%,#d2b79d_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),transparent)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="surface-panel relative overflow-hidden rounded-[2rem] p-8 shadow-[0_30px_80px_rgba(95,56,26,0.12)] sm:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(143,91,51,0.24),transparent)]" />

          <div className="flex max-w-2xl flex-col gap-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="status-chip">SmartWardrobe</span>
              <span className="status-chip">本地演示模式</span>
              <span className="status-chip border-accent/20 bg-white/80 text-accent-strong">
                {modeLabel}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
                Wardrobe MVP
              </p>
              <h1 className="display-font max-w-2xl text-5xl leading-[0.92] text-accent-strong text-balance sm:text-6xl lg:text-[4.7rem]">
                把衣橱整理成可检索、可修正的数字档案
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted sm:text-[1.03rem]">
                先用演示登录进入衣橱，再完成导入、自动分类和手动修正。当前默认使用本地演示数据，配置 Supabase 后会自动切换。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(255,252,247,0.78)] p-4">
                <p className="text-sm font-semibold text-accent-strong">1. 进入</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  点击按钮即可创建本地演示会话。
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(255,252,247,0.78)] p-4">
                <p className="text-sm font-semibold text-accent-strong">2. 导入</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  上传单件服装图片并补齐最少信息。
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(255,252,247,0.78)] p-4">
                <p className="text-sm font-semibold text-accent-strong">3. 修正</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  系统先给出默认分类，随后可以人工覆盖。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-8 shadow-[0_30px_80px_rgba(95,56,26,0.12)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Start
          </p>
          <h2 className="display-font mt-4 text-4xl leading-none text-accent-strong sm:text-5xl">
            进入你的衣橱
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
            当前版本不需要注册或第三方登录，点击按钮即可创建演示会话并进入主工作区。
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}

            <form action={startDemoSessionAction}>
              <button type="submit" className="primary-button w-full">
                进入我的衣橱
              </button>
            </form>

            <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(255,251,245,0.72)] p-4">
              <p className="text-sm font-semibold text-accent-strong">你会得到什么</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                <li>• 本地保存的服装记录和图片</li>
                <li>• 自动补齐的默认分类结果</li>
                <li>• 可随时覆盖的手动修正入口</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
