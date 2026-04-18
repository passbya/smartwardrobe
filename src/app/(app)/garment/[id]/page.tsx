import Image from "next/image";
import Link from "next/link";
import { updateGarmentAction } from "@/app/actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import {
  COLOR_OPTIONS,
  EDITABLE_CATEGORY_OPTIONS,
  EDITABLE_SEASON_OPTIONS,
  getCategoryLabel,
  getColorLabel,
  getSeasonLabel,
  getSubcategoryLabel,
  SUBCATEGORY_OPTIONS,
} from "@/lib/catalog";
import { getGarmentById } from "@/lib/data-store";
import { requireDemoSession } from "@/lib/session";

type GarmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    saved?: string;
    error?: string;
  }>;
};

function getStatusMessage(params: {
  created?: string;
  saved?: string;
  error?: string;
}) {
  if (params.created === "1") {
    return {
      tone: "success" as const,
      message: "服装导入成功，系统已经完成默认分类。你现在可以继续人工修正。",
    };
  }

  if (params.saved === "1") {
    return {
      tone: "success" as const,
      message: "服装信息已更新，列表和详情都会同步显示最新结果。",
    };
  }

  if (params.error === "not-found") {
    return {
      tone: "error" as const,
      message: "没有找到要更新的服装记录，请返回衣橱重新选择。",
    };
  }

  return null;
}

export default async function GarmentDetailPage({
  params,
  searchParams,
}: GarmentDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const session = await requireDemoSession();
  const garment = await getGarmentById(session.userId, id);
  const status = getStatusMessage(resolvedSearchParams);

  if (!garment) {
    return (
      <div className="flex w-full flex-col gap-8">
        <PageHeader
          eyebrow="Garment"
          title="记录不存在"
          description="这件服装可能还没有创建，或者已经从当前演示衣橱中移除。"
          actions={
            <Link href="/wardrobe" className="secondary-button">
              返回衣橱
            </Link>
          }
        />
        <EmptyState
          title="没有找到这件服装"
          description="先返回衣橱确认记录是否存在，或者重新导入一件新的服装继续测试流程。"
          actionHref="/wardrobe"
          actionLabel="回到衣橱"
        />
      </div>
    );
  }

  const submitAction = updateGarmentAction.bind(null, garment.id);
  const hasManualOverride = garment.classification_source === "manual";

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Garment"
        title={garment.name}
        description="这里展示当前服装的默认分类和人工修正入口。保存后，手动填写的内容会覆盖系统默认结果，并同步到列表。"
        actions={
          <Link href="/wardrobe" className="secondary-button">
            返回衣橱
          </Link>
        }
      />

      {status ? <StatusBanner tone={status.tone} message={status.message} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <section className="surface-panel overflow-hidden rounded-[2rem]">
          <div className="relative aspect-[4/5] bg-[#ebe3d7]">
            <Image src={garment.image_url} alt={garment.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,240,0.02)_0%,rgba(36,24,14,0.1)_45%,rgba(24,17,12,0.5)_100%)]" />
            <div className="absolute inset-x-5 top-5 flex flex-wrap gap-2">
              <span className="status-chip bg-white/90 text-accent-strong">
                {hasManualOverride ? "手动修正已保存" : "系统默认分类"}
              </span>
              <span className="status-chip bg-white/80 text-accent-strong">
                {getCategoryLabel(garment.category)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-6">
            <div className="flex flex-wrap gap-3">
              <span className="status-chip">{getSubcategoryLabel(garment.subcategory)}</span>
              <span className="status-chip">
                {hasManualOverride ? "人工修正" : "自动分类"}
              </span>
              <span className="status-chip">
                {garment.source === "upload" ? "图片导入" : garment.source}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-line/70 bg-[rgba(255,251,245,0.68)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  颜色
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.color ? getColorLabel(garment.color) : "未设置"}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-line/70 bg-[rgba(255,251,245,0.68)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  季节
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.season ? getSeasonLabel(garment.season) : "未设置"}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-line/70 bg-[rgba(255,251,245,0.68)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  品牌
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.brand || "未设置"}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-line/70 bg-[rgba(255,251,245,0.68)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  来源
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{garment.source}</p>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-line/70 bg-[rgba(255,251,245,0.68)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                备注
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {garment.notes || "暂无备注。你可以在右侧补充面料、场景或搭配偏好。"}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="mb-5 space-y-1">
            <p className="text-sm font-semibold text-accent-strong">人工修正</p>
            <p className="text-sm leading-6 text-muted">
              这里填写的内容会覆盖系统默认结果，适合快速确认最终分类。保存后可直接返回列表继续浏览。
            </p>
          </div>

          <form action={submitAction} className="grid gap-5 md:grid-cols-2">
            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">服装名称</span>
              <input
                value={garment.name}
                readOnly
                className="field-input cursor-not-allowed opacity-70"
              />
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">一级品类</span>
              <select name="category" defaultValue={garment.category} className="field-input">
                <option value="">待分类</option>
                {EDITABLE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">子类</span>
              <select name="subcategory" defaultValue={garment.subcategory} className="field-input">
                {SUBCATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">颜色</span>
              <select name="color" defaultValue={garment.color} className="field-input">
                <option value="">暂不设置</option>
                {COLOR_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">季节</span>
              <select name="season" defaultValue={garment.season} className="field-input">
                <option value="">暂不设置</option>
                {EDITABLE_SEASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">品牌</span>
              <input
                type="text"
                name="brand"
                defaultValue={garment.brand}
                className="field-input"
                placeholder="例如：Uniqlo"
              />
            </label>

            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">备注</span>
              <textarea
                name="notes"
                defaultValue={garment.notes}
                rows={5}
                className="field-input min-h-36 resize-y"
                placeholder="记录面料、穿着场景、搭配偏好等信息。"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="primary-button">
                保存修正
              </button>
              <Link href="/wardrobe" className="secondary-button">
                返回列表
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
