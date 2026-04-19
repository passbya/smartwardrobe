import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OutfitCard } from "@/components/outfit-card";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { listGarments, listOutfits } from "@/lib/data-store";
import { resolveOutfitRecord } from "@/lib/outfit-logic";
import { requireSession } from "@/lib/session";

type OutfitsPageProps = {
  searchParams?: Promise<{
    deleted?: string;
    error?: string;
  }>;
};

function getStatusBanner(params: { deleted?: string; error?: string }) {
  if (params.deleted === "1") {
    return {
      tone: "success" as const,
      message: "搭配已经删除完成，底层衣物数据不会受到影响。",
    };
  }

  if (params.error === "delete-not-found") {
    return {
      tone: "error" as const,
      message: "没有找到要删除的搭配，请刷新列表后重试。",
    };
  }

  if (params.error === "not-found") {
    return {
      tone: "error" as const,
      message: "没有找到对应的搭配记录，可能已经被删除。",
    };
  }

  return null;
}

export default async function OutfitsPage({ searchParams }: OutfitsPageProps) {
  const session = await requireSession();
  const garments = await listGarments(session.userId);
  const outfits = await listOutfits(session.userId);
  const resolvedOutfits = outfits.map((outfit) => resolveOutfitRecord(outfit, garments));
  const params = (await searchParams) ?? {};
  const statusBanner = getStatusBanner(params);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Outfits"
        title="手动搭配工作台"
        description={`${session.displayName} 可以从当前身份已有的衣物中手动组合搭配，系统会先生成默认名称，你也可以在保存前或保存后继续手动改名。`}
        actions={
          <Link href="/outfits/new" className="primary-button glow-ring">
            创建搭配
          </Link>
        }
      />

      {statusBanner ? (
        <StatusBanner tone={statusBanner.tone} message={statusBanner.message} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            当前身份
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">
            {session.displayName}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            每个预设身份都拥有独立的搭配列表、封面图和会话状态。
          </p>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            已保存搭配
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">
            {outfits.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            当前身份下已保存的手动搭配数量。删除搭配不会删除底层衣物。
          </p>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            可选衣物
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">
            {garments.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            创建搭配时会从当前身份已有衣物中选择，不会额外上传新图片。
          </p>
        </div>
      </section>

      {resolvedOutfits.length === 0 ? (
        <EmptyState
          title="这个身份还没有保存任何搭配"
          description="先创建第一套手动搭配。系统会根据主体槽位自动生成默认名称，你也可以马上改成自己的命名方式。"
          actionHref={garments.length >= 2 ? "/outfits/new" : "/import"}
          actionLabel={garments.length >= 2 ? "开始创建搭配" : "先导入衣物"}
        />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {resolvedOutfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </section>
      )}

      <section
        className="surface-panel rounded-[2rem] p-6 sm:p-7"
        data-testid="recommended-outfits-placeholder"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            Coming Soon
          </p>
          <h2 className="display-font text-3xl text-foreground-strong sm:text-4xl">
            推荐搭配
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
            下一阶段会在这里接入系统自动推荐。当前版本只保留展示占位，不会生成或读取推荐数据。
          </p>
        </div>
      </section>
    </div>
  );
}
