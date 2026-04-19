import Image from "next/image";
import type { GarmentRecord, ResolvedOutfitRecord } from "@/lib/types";

type OutfitDisplayItem = {
  key: string;
  label: string;
  garment: GarmentRecord;
};

type OutfitCollageProps = {
  outfit: ResolvedOutfitRecord;
  variant?: "card" | "detail";
  testId?: string;
};

const CARD_LAYOUT = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
];

const DETAIL_LAYOUT = [
  "col-span-2 row-span-3",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
];

export function getOutfitDisplayItems(outfit: ResolvedOutfitRecord): OutfitDisplayItem[] {
  const primaryItems = [
    outfit.dressGarment
      ? {
          key: `dress-${outfit.dressGarment.id}`,
          label: "连衣裙",
          garment: outfit.dressGarment,
        }
      : null,
    outfit.topGarment
      ? {
          key: `top-${outfit.topGarment.id}`,
          label: "上装",
          garment: outfit.topGarment,
        }
      : null,
    outfit.bottomGarment
      ? {
          key: `bottom-${outfit.bottomGarment.id}`,
          label: "下装",
          garment: outfit.bottomGarment,
        }
      : null,
    outfit.outerwearGarment
      ? {
          key: `outerwear-${outfit.outerwearGarment.id}`,
          label: "外套",
          garment: outfit.outerwearGarment,
        }
      : null,
    outfit.shoesGarment
      ? {
          key: `shoes-${outfit.shoesGarment.id}`,
          label: "鞋子",
          garment: outfit.shoesGarment,
        }
      : null,
  ].filter((item): item is OutfitDisplayItem => Boolean(item));

  const accessoryItems = outfit.accessoryGarments.map((garment, index) => ({
    key: `accessory-${garment.id}-${index}`,
    label: index === 0 ? "配饰" : `配饰 ${index + 1}`,
    garment,
  }));

  return [...primaryItems, ...accessoryItems];
}

function getLayoutClasses(variant: "card" | "detail", index: number) {
  const layout = variant === "detail" ? DETAIL_LAYOUT : CARD_LAYOUT;

  return layout[index] ?? "col-span-1 row-span-1";
}

function getContainerClasses(variant: "card" | "detail") {
  if (variant === "detail") {
    return "grid-cols-4 grid-rows-3 min-h-[28rem] sm:min-h-[32rem]";
  }

  return "grid-cols-3 grid-rows-3 min-h-[19rem]";
}

function OutfitTile({
  item,
  className,
  priority,
}: {
  item: OutfitDisplayItem;
  className: string;
  priority: boolean;
}) {
  return (
    <div
      className={`group/tile relative overflow-hidden rounded-[1.35rem] border border-line/80 bg-[linear-gradient(180deg,rgba(18,34,60,0.96),rgba(8,16,31,0.92))] ${className}`}
    >
      {item.garment.image_url ? (
        <Image
          src={item.garment.image_url}
          alt={item.garment.name}
          fill
          priority={priority}
          sizes={priority ? "(min-width: 1024px) 36vw, 100vw" : "(min-width: 1024px) 18vw, 50vw"}
          className="object-cover transition-transform duration-500 group-hover/tile:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,196,255,0.22),transparent_38%),linear-gradient(160deg,rgba(20,43,75,0.98),rgba(6,13,26,0.96))]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,28,0.08)_0%,rgba(7,15,28,0.24)_40%,rgba(4,8,18,0.88)_100%)]" />

      {!item.garment.image_url ? (
        <div className="absolute inset-x-4 top-4">
          <span className="inline-flex rounded-full border border-[rgba(173,203,255,0.16)] bg-[rgba(6,12,24,0.52)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent-soft">
            图片待补
          </span>
        </div>
      ) : null}

      <div className="absolute inset-x-4 bottom-4">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-accent-soft/90">
          {item.label}
        </p>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-foreground-strong sm:text-base">
          {item.garment.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {[item.garment.color, item.garment.season].filter(Boolean).join(" · ") ||
            item.garment.subcategory}
        </p>
      </div>
    </div>
  );
}

export function OutfitCollage({ outfit, variant = "card", testId }: OutfitCollageProps) {
  const displayItems = getOutfitDisplayItems(outfit).slice(0, 6);

  if (displayItems.length === 0) {
    return (
      <div
        className="flex min-h-[18rem] items-center justify-center rounded-[1.6rem] border border-dashed border-line bg-[rgba(8,16,31,0.52)] px-6 text-center text-sm leading-7 text-muted"
        data-testid={testId}
      >
        当前搭配还没有可展示的衣物内容。
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 overflow-hidden rounded-[1.75rem] border border-line/70 bg-[rgba(6,13,26,0.36)] p-3 ${getContainerClasses(variant)}`}
      data-testid={testId}
    >
      {displayItems.map((item, index) => (
        <OutfitTile
          key={item.key}
          item={item}
          className={getLayoutClasses(variant, index)}
          priority={index === 0}
        />
      ))}
    </div>
  );
}
