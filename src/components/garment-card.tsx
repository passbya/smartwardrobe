import Image from "next/image";
import Link from "next/link";
import {
  getCategoryLabel,
  getColorLabel,
  getSeasonLabel,
  getSubcategoryLabel,
} from "@/lib/catalog";
import type { GarmentRecord } from "@/lib/types";

type GarmentCardProps = {
  garment: GarmentRecord;
  actions?: React.ReactNode;
};

export function GarmentCard({ garment, actions }: GarmentCardProps) {
  const isManual = garment.classification_source === "manual";

  return (
    <article className="group page-fade-in overflow-hidden rounded-[2rem] border border-line/80 bg-[rgba(10,19,35,0.62)] shadow-[0_22px_48px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(173,203,255,0.28)] hover:shadow-[0_28px_62px_rgba(35,79,155,0.24)]">
      <Link
        href={`/garment/${garment.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,196,255,0.64)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(10,19,35,0.62)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,#11203a,#0b1628)]">
          <Image
            src={garment.image_url}
            alt={garment.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,18,35,0.08)_0%,rgba(9,18,35,0.1)_42%,rgba(5,10,20,0.82)_100%)]" />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <span className="status-chip bg-[rgba(7,16,31,0.62)] text-accent-soft">
              {isManual ? "已人工确认" : "系统默认分类"}
            </span>
            <span className="rounded-full border border-[rgba(173,203,255,0.16)] bg-[rgba(7,16,31,0.62)] px-3 py-1 text-xs font-semibold text-foreground">
              {getCategoryLabel(garment.category)}
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-accent-soft/90">
              {getSubcategoryLabel(garment.subcategory)}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-8 text-foreground-strong">
              {garment.name}
            </h2>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          <span>{garment.color ? getColorLabel(garment.color) : "未设置颜色"}</span>
          <span>·</span>
          <span>{garment.season ? getSeasonLabel(garment.season) : "未设置季节"}</span>
        </div>

        <p className="text-sm leading-6 text-muted">
          {isManual
            ? "这件衣物已经完成手动确认，列表中展示的是当前身份最终保存的分类结果。"
            : "系统已经先给出默认分类，你仍然可以进入详情页继续微调颜色、季节或品类。"}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="status-chip w-fit">
            {isManual ? "手动修正" : "自动分类"}
          </div>
          {actions}
        </div>
      </div>
    </article>
  );
}
