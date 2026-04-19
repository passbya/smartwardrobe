import { deleteOutfitAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import Link from "next/link";
import { OutfitCollage, getOutfitDisplayItems } from "@/components/outfit-collage";
import { getOutfitSummary } from "@/lib/outfit-logic";
import type { ResolvedOutfitRecord } from "@/lib/types";

type OutfitCardProps = {
  outfit: ResolvedOutfitRecord;
};

function formatUpdateLabel(updatedAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const summary = getOutfitSummary(outfit).slice(0, 4);
  const displayItems = getOutfitDisplayItems(outfit);
  const outfitHref = `/outfits/${outfit.id}`;

  return (
    <article className="group page-fade-in overflow-hidden rounded-[2rem] border border-line/80 bg-[rgba(10,19,35,0.62)] shadow-[0_22px_48px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(173,203,255,0.28)] hover:shadow-[0_28px_62px_rgba(35,79,155,0.24)]">
      <Link
        href={outfitHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,196,255,0.64)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(10,19,35,0.62)]"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#11203a,#0b1628)] p-4">
          <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3">
            <span className="status-chip bg-[rgba(7,16,31,0.62)] text-accent-soft">
              {outfit.name_source === "manual" ? "手动命名" : "自动命名"}
            </span>
            <span className="rounded-full border border-[rgba(173,203,255,0.16)] bg-[rgba(7,16,31,0.62)] px-3 py-1 text-xs font-semibold text-foreground">
              更新于 {formatUpdateLabel(outfit.updated_at)}
            </span>
          </div>

          <OutfitCollage
            outfit={outfit}
            variant="card"
            testId={`outfit-card-collage-${outfit.id}`}
          />

          <div className="relative z-10 mt-5 px-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-accent-soft/90">
              Outfit
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-8 text-foreground-strong">
              {outfit.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {displayItems.length > 0
                ? `整套预览已展开 ${displayItems.length} 件单品，列表里可以直接看到主体、鞋子和配饰。`
                : "当前搭配还没有可展示的衣物内容。"}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm leading-6 text-muted">
          {summary.length > 0
            ? `已选 ${summary.join(" · ")}`
            : "当前搭配还没有可显示的槽位摘要。"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {summary.map((item) => (
            <span key={item} className="status-chip w-fit">
              {item}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href={outfitHref} className="secondary-button">
            查看详情
          </Link>

          <form
            action={deleteOutfitAction.bind(null, outfit.id)}
            data-testid={`delete-outfit-card-form-${outfit.id}`}
          >
            <input type="hidden" name="redirectTo" value="/outfits" />
            <ConfirmSubmitButton
              className="secondary-button border-[rgba(255,159,177,0.18)] text-danger hover:bg-[rgba(255,159,177,0.08)]"
              confirmMessage={`确认删除“${outfit.name}”吗？这不会删除底层衣物。`}
            >
              删除搭配
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </article>
  );
}
