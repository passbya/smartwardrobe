import Image from "next/image";
import Link from "next/link";
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

  return (
    <article className="group page-fade-in overflow-hidden rounded-[2rem] border border-line/80 bg-[rgba(10,19,35,0.62)] shadow-[0_22px_48px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(173,203,255,0.28)] hover:shadow-[0_28px_62px_rgba(35,79,155,0.24)]">
      <Link
        href={`/outfits/${outfit.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,196,255,0.64)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(10,19,35,0.62)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,#11203a,#0b1628)]">
          {outfit.coverImageUrl ? (
            <Image
              src={outfit.coverImageUrl}
              alt={outfit.name}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,18,35,0.12)_0%,rgba(9,18,35,0.08)_34%,rgba(5,10,20,0.86)_100%)]" />
          {!outfit.coverImageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="rounded-full border border-line/70 bg-[rgba(7,16,31,0.58)] px-5 py-3 text-sm font-semibold text-accent-soft">
                暂无封面图
              </div>
            </div>
          ) : null}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <span className="status-chip bg-[rgba(7,16,31,0.62)] text-accent-soft">
              {outfit.name_source === "manual" ? "手动命名" : "自动命名"}
            </span>
            <span className="rounded-full border border-[rgba(173,203,255,0.16)] bg-[rgba(7,16,31,0.62)] px-3 py-1 text-xs font-semibold text-foreground">
              更新于 {formatUpdateLabel(outfit.updated_at)}
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-accent-soft/90">
              Outfit
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-8 text-foreground-strong">
              {outfit.name}
            </h2>
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
      </div>
    </article>
  );
}
