import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteOutfitAction, updateOutfitAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { OutfitCollage, getOutfitDisplayItems } from "@/components/outfit-collage";
import { OutfitBuilderForm } from "@/components/outfit-builder-form";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { getOutfitById, listGarments } from "@/lib/data-store";
import { getOutfitSummary, resolveOutfitRecord } from "@/lib/outfit-logic";
import { requireSession } from "@/lib/session";

type OutfitDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    saved?: string;
    error?: string;
  }>;
};

function getStatusBanner(params: { created?: string; saved?: string; error?: string }) {
  if (params.created === "1") {
    return {
      tone: "success" as const,
      message: "搭配已经创建完成，你现在可以继续调整槽位或改名。",
    };
  }

  if (params.saved === "1") {
    return {
      tone: "success" as const,
      message: "搭配修改已保存。",
    };
  }

  if (params.error === "not-found") {
    return {
      tone: "error" as const,
      message: "没有找到这条搭配记录，请返回列表重新选择。",
    };
  }

  return null;
}

export default async function OutfitDetailPage({
  params,
  searchParams,
}: OutfitDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const outfit = await getOutfitById(session.userId, id);

  if (!outfit) {
    redirect("/outfits?error=not-found");
  }

  const garments = await listGarments(session.userId);
  const resolvedOutfit = resolveOutfitRecord(outfit, garments);
  const summary = getOutfitSummary(resolvedOutfit);
  const displayItems = getOutfitDisplayItems(resolvedOutfit);
  const statusBanner = getStatusBanner((await searchParams) ?? {});

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Outfit Detail"
        title={resolvedOutfit.name}
        description={`当前搭配已选择 ${summary.length} 个槽位内容。整套展示区会同时展开主体、鞋子和配饰，便于你边看边调整。`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/outfits" className="secondary-button">
              返回搭配列表
            </Link>
            <form action={deleteOutfitAction.bind(null, resolvedOutfit.id)} data-testid="delete-outfit-form">
              <input type="hidden" name="redirectTo" value="/outfits" />
              <ConfirmSubmitButton
                className="secondary-button border-[rgba(255,159,177,0.18)] text-danger hover:bg-[rgba(255,159,177,0.08)]"
                confirmMessage={`确认删除“${resolvedOutfit.name}”吗？这不会删除底层衣物。`}
              >
                删除搭配
              </ConfirmSubmitButton>
            </form>
          </div>
        }
      />

      {statusBanner ? (
        <StatusBanner tone={statusBanner.tone} message={statusBanner.message} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
                Outfit View
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground-strong sm:text-3xl">
                整套搭配总览
              </h2>
            </div>
            <span className="rounded-full border border-[rgba(173,203,255,0.16)] bg-[rgba(7,16,31,0.42)] px-4 py-2 text-sm font-semibold text-accent-soft">
              已展开 {displayItems.length} 件
            </span>
          </div>

          <div className="mt-6">
            <OutfitCollage
              outfit={resolvedOutfit}
              variant="detail"
              testId="outfit-detail-display"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {displayItems.map((item) => (
              <div
                key={item.key}
                className="rounded-[1.35rem] border border-line/70 bg-[rgba(7,16,31,0.42)] p-4"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-soft">
                  {item.label}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground-strong">
                  {item.garment.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {[item.garment.color, item.garment.season].filter(Boolean).join(" · ") ||
                    item.garment.subcategory}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
              Current Summary
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.map((item) => (
                <span key={item} className="status-chip">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">
              详情页现在会同时展示整套搭配，不再只依赖单件封面。修改槽位后，左侧总览也会一起更新。
            </p>
          </div>

          <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
              Edit Outfit
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              手动改名后，系统仍会继续重新计算自动名称，但不会覆盖你保存下来的自定义名称。
            </p>
          </div>
        </div>
      </section>

      <OutfitBuilderForm
        garments={garments}
        initialOutfit={resolvedOutfit}
        action={updateOutfitAction.bind(null, resolvedOutfit.id)}
        submitLabel="保存修改"
      />
    </div>
  );
}
