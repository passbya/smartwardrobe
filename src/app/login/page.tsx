import { redirect } from "next/navigation";
import { selectPresetSessionAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { getRepositoryMode } from "@/lib/data-repository";
import { getPresetIdentities } from "@/lib/preset-identities";
import { getCurrentSession } from "@/lib/session";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "identity") {
    return "身份入口无效，请重新选择一个预设身份。";
  }

  return "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  const repositoryMode = getRepositoryMode();
  const identities = getPresetIdentities();
  const modeLabel =
    repositoryMode === "supabase" ? "当前数据 · Supabase" : "当前数据 · 本地预设";

  if (session) {
    redirect("/wardrobe");
  }

  const params = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(123,196,255,0.24),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(151,139,255,0.2),transparent_25%),radial-gradient(circle_at_72%_82%,rgba(98,176,255,0.16),transparent_22%),linear-gradient(180deg,#091321_0%,#07101d_46%,#040913_100%)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(143,192,255,0.28),transparent_70%)] blur-3xl" />
      <div className="absolute right-[-4rem] top-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(146,136,255,0.22),transparent_72%)] blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="surface-panel page-fade-in relative rounded-[2.2rem] p-8 sm:p-10 lg:p-12">
          <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.72),rgba(159,201,255,0.18)_32%,rgba(151,139,255,0.08)_58%,transparent_72%)] blur-[1px] sm:block" />

          <div className="flex max-w-2xl flex-col gap-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="status-chip">SmartWardrobe</span>
              <span className="status-chip">预设身份入口</span>
              <span className="status-chip border-[rgba(125,196,255,0.22)] bg-[rgba(12,24,46,0.7)] text-accent-soft">
                {modeLabel}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent-soft">
                Wardrobe Workspace
              </p>
              <h1 className="display-font max-w-2xl text-5xl leading-[0.92] text-foreground-strong text-balance sm:text-6xl lg:text-[4.8rem]">
                选择一个固定身份
                <br />
                进入各自独立的数字衣橱
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted sm:text-[1.03rem]">
                当前版本提供 3 个预设身份入口。每个身份都有独立的衣物记录、图片和会话状态，适合在受控场景中长期使用和测试。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(11,22,40,0.56)] p-4">
                <p className="text-sm font-semibold text-foreground-strong">独立数据</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  不同身份的衣橱、上传图片和删除操作彼此隔离。
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(11,22,40,0.56)] p-4">
                <p className="text-sm font-semibold text-foreground-strong">直接进入</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  不需要注册、密码或邮箱流程，点击即可进入对应工作区。
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(11,22,40,0.56)] p-4">
                <p className="text-sm font-semibold text-foreground-strong">可继续扩展</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  当前会话模型已脱离 demo，后续可以继续升级到真实认证。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel page-fade-in rounded-[2.2rem] p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            Choose Identity
          </p>
          <h2 className="display-font mt-4 text-4xl leading-none text-foreground-strong sm:text-5xl">
            进入你的工作区
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
            请选择一个固定身份开始使用。切换身份后，只会看到该身份自己的衣橱数据。
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}

            {identities.map((identity) => (
              <form
                key={identity.slug}
                data-testid={`preset-login-${identity.slug}`}
                action={selectPresetSessionAction.bind(null, identity.slug)}
                className="rounded-[1.7rem] border border-line/80 bg-[rgba(11,22,40,0.54)] p-4 shadow-[0_14px_32px_rgba(3,8,24,0.2)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground-strong">
                      {identity.displayName}
                    </p>
                    <p className="text-sm leading-6 text-muted">{identity.description}</p>
                  </div>

                  <button type="submit" className="primary-button min-w-32">
                    进入 {identity.displayName}
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
