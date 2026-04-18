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
};

export function GarmentCard({ garment }: GarmentCardProps) {
  return (
    <Link
      href={`/garment/${garment.id}`}
      className="group overflow-hidden rounded-[1.8rem] border border-line/80 bg-surface shadow-[0_18px_40px_rgba(92,70,48,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(92,70,48,0.12)] focus-visible:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ebe3d7]">
        <Image
          src={garment.image_url}
          alt={garment.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,240,0.04)_0%,rgba(42,28,16,0.08)_45%,rgba(29,20,15,0.56)_100%)]" />
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-accent-strong shadow-sm">
            {getCategoryLabel(garment.category)}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-accent-strong shadow-sm">
            {getSubcategoryLabel(garment.subcategory)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <span>{garment.color ? getColorLabel(garment.color) : "未设置颜色"}</span>
          <span>·</span>
          <span>{garment.season ? getSeasonLabel(garment.season) : "未设置季节"}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-7 text-foreground">{garment.name}</h2>
          <p className="text-sm leading-6 text-muted">
            {garment.classification_source === "manual"
              ? "已手动修正并保存为最终结果。"
              : "系统已完成默认分类，你仍可随时进入详情页修改。"}
          </p>
        </div>

        <div className="status-chip w-fit">
          {garment.classification_source === "manual" ? "手动修正" : "自动分类"}
        </div>
      </div>
    </Link>
  );
}
