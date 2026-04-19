import Image from "next/image";
import Link from "next/link";
import { deleteGarmentAction, updateGarmentAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
import { requireSession } from "@/lib/session";

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
      message: "衣物导入成功，系统已经先完成默认分类。你现在可以继续做人工确认。",
    };
  }

  if (params.saved === "1") {
    return {
      tone: "success" as const,
      message: "衣物信息已更新，列表页和详情页都会显示最新结果。",
    };
  }

  if (params.error === "not-found") {
    return {
      tone: "error" as const,
      message: "没有找到要更新的衣物记录，请返回衣橱重新选择。",
    };
  }

  return null;
}

function getSourceLabel(source: string) {
  if (source === "manual_import") {
    return "手动导入";
  }

  return source;
}

export default async function GarmentDetailPage({
  params,
  searchParams,
}: GarmentDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const session = await requireSession();
  const garment = await getGarmentById(session.userId, id);
  const status = getStatusMessage(resolvedSearchParams);

  if (!garment) {
    return (
      <div className="flex w-full flex-col gap-8">
        <PageHeader
          eyebrow="Garment"
          title="这条记录不存在"
          description="这件衣物可能尚未创建，或者已经从当前身份的衣橱中移除。"
          actions={
            <Link href="/wardrobe" className="secondary-button">
              返回衣橱
            </Link>
          }
        />
        <EmptyState
          title="没有找到这件衣物"
          description="请先回到衣橱确认这条记录是否仍然存在，或者重新导入一件新衣物继续当前流程。"
          actionHref="/wardrobe"
          actionLabel="回到衣橱"
        />
      </div>
    );
  }

  const submitAction = updateGarmentAction.bind(null, garment.id);
  const removeAction = deleteGarmentAction.bind(null, garment.id);
  const hasManualOverride = garment.classification_source === "manual";

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Garment"
        title={garment.name}
        description="左侧保留当前图片和系统分类结果，右侧用于确认最终品类、颜色、季节与备注。保存后列表会同步更新。"
        actions={
          <Link href="/wardrobe" className="secondary-button">
            返回衣橱
          </Link>
        }
      />

      {status ? <StatusBanner tone={status.tone} message={status.message} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <section className="surface-panel overflow-hidden rounded-[2rem] p-0">
          <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,rgba(20,35,84,0.9)_0%,rgba(8,13,29,0.98)_100%)]">
            <Image
              src={garment.image_url}
              alt={garment.name}
              fill
              sizes="(min-width: 1280px) 42vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,22,0.06)_0%,rgba(7,13,31,0.24)_44%,rgba(4,9,22,0.78)_100%)]" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="status-chip bg-white/14 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)]">
                {hasManualOverride ? "已人工确认" : "系统默认分类"}
              </span>
              <span className="status-chip bg-white/10 text-[rgba(223,234,255,0.94)] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                {getCategoryLabel(garment.category)}
              </span>
            </div>
            <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] border border-white/10 bg-[rgba(5,10,24,0.48)] p-4 shadow-[0_20px_50px_rgba(2,6,18,0.36)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgba(198,218,255,0.7)]">
                当前摘要
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="status-chip bg-white/8 text-white/88">
                  {getSubcategoryLabel(garment.subcategory)}
                </span>
                <span className="status-chip bg-white/8 text-white/88">
                  {hasManualOverride ? "人工修正" : "自动分类"}
                </span>
                <span className="status-chip bg-white/8 text-white/88">
                  {getSourceLabel(garment.source)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.45rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_14px_34px_rgba(5,11,29,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  颜色
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.color ? getColorLabel(garment.color) : "未设置"}
                </p>
              </div>
              <div className="rounded-[1.45rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_14px_34px_rgba(5,11,29,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  季节
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.season ? getSeasonLabel(garment.season) : "未设置"}
                </p>
              </div>
              <div className="rounded-[1.45rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_14px_34px_rgba(5,11,29,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  品牌
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {garment.brand || "未设置"}
                </p>
              </div>
              <div className="rounded-[1.45rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_14px_34px_rgba(5,11,29,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  来源
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {getSourceLabel(garment.source)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.55rem] border border-line bg-[linear-gradient(180deg,rgba(16,28,63,0.74)_0%,rgba(10,18,42,0.74)_100%)] p-5 shadow-[0_20px_48px_rgba(5,11,29,0.22)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgba(189,212,255,0.72)]">
                  系统结果
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">品类</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {getCategoryLabel(garment.category)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">子类</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {getSubcategoryLabel(garment.subcategory)}
                    </p>
                  </div>
                  <p>
                    当前结果来自规则分类。若你在右侧修改并保存，人工填写的值会成为最终结果。
                  </p>
                </div>
              </div>

              <div className="rounded-[1.55rem] border border-[rgba(108,168,255,0.28)] bg-[linear-gradient(180deg,rgba(18,35,78,0.8)_0%,rgba(12,24,56,0.78)_100%)] p-5 shadow-[0_0_0_1px_rgba(129,182,255,0.08),0_20px_48px_rgba(4,12,33,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgba(205,226,255,0.82)]">
                  人工最终值
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-[rgba(217,230,255,0.82)]">
                  <p>右侧保存后的内容会覆盖默认分类，并在衣橱列表中同步显示。</p>
                  <p>建议重点确认品类、子类、颜色和季节，这些字段会直接影响筛选结果。</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_14px_34px_rgba(5,11,29,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                备注
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {garment.notes || "暂时还没有备注。你可以在右侧补充面料、适合场景或搭配偏好。"}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-accent-soft">人工修正</p>
              <h2 className="display-font text-3xl text-foreground-strong">
                在这里确认最终分类结果
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                右侧填写的内容会覆盖系统默认结果。保存后无需重新导入，列表页会直接显示这次修正。
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-[rgba(14,23,52,0.54)] p-4 shadow-[0_18px_40px_rgba(4,11,30,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                当前状态
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {hasManualOverride ? "已完成人工确认" : "仍使用系统默认结果"}
              </p>
            </div>
          </div>

          <form
            data-testid="garment-edit-form"
            action={submitAction}
            className="grid gap-5 md:grid-cols-2"
          >
            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">衣物名称</span>
              <input
                value={garment.name}
                readOnly
                className="field-input cursor-not-allowed opacity-75"
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
              <select
                name="subcategory"
                defaultValue={garment.subcategory}
                className="field-input"
              >
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
                placeholder="记录面料、适合场景、搭配偏好或保养信息。"
              />
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="primary-button glow-ring">
                保存修正
              </button>
              <Link href="/wardrobe" className="secondary-button">
                返回列表
              </Link>
            </div>
          </form>

          <form action={removeAction} className="mt-6">
            <input type="hidden" name="redirectTo" value="/wardrobe" />
            <ConfirmSubmitButton
              className="secondary-button w-full border-[rgba(255,159,177,0.18)] text-danger hover:bg-[rgba(255,159,177,0.08)]"
              confirmMessage={`确认删除“${garment.name}”吗？这会同时删除对应图片。`}
            >
              删除这件衣物
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
