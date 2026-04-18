import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GarmentCard } from "@/components/garment-card";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  SEASON_OPTIONS,
} from "@/lib/catalog";
import { listGarments } from "@/lib/data-store";
import { requireDemoSession } from "@/lib/session";

type WardrobePageProps = {
  searchParams?: Promise<{
    category?: string;
    color?: string;
    season?: string;
    created?: string;
  }>;
};

function getCreationMessage(created?: string) {
  if (created === "1") {
    return "服装已导入成功，系统已经为它生成了默认分类。";
  }

  return "";
}

function buildFilterHref(category: string, season: string, color: string) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (season) {
    params.set("season", season);
  }

  if (color) {
    params.set("color", color);
  }

  const query = params.toString();
  return query ? `/wardrobe?${query}` : "/wardrobe";
}

export default async function WardrobePage({ searchParams }: WardrobePageProps) {
  const session = await requireDemoSession();
  const garments = await listGarments(session.userId);
  const params = (await searchParams) ?? {};
  const categoryFilter = params.category ?? "";
  const colorFilter = params.color ?? "";
  const seasonFilter = params.season ?? "";

  const filteredGarments = garments.filter((garment) => {
    const matchesCategory = !categoryFilter || garment.category === categoryFilter;
    const matchesColor = !colorFilter || garment.color === colorFilter;
    const matchesSeason = !seasonFilter || garment.season === seasonFilter;

    return matchesCategory && matchesColor && matchesSeason;
  });

  const activeFilterCount = [categoryFilter, colorFilter, seasonFilter].filter(Boolean).length;
  const creationMessage = getCreationMessage(params.created);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Wardrobe"
        title="你的数字衣橱"
        description="先浏览，再筛选，再修正。这里展示当前会话的数据，导入后会立刻出现在列表中，支持按品类、季节和颜色快速定位。"
        actions={
          <Link href="/import" className="primary-button">
            导入新服装
          </Link>
        }
      />

      <section className="grid gap-3 rounded-[1.75rem] border border-line/70 bg-[rgba(255,251,245,0.72)] p-5 md:grid-cols-3 md:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">总数</p>
          <p className="mt-2 text-3xl font-semibold text-accent-strong">{garments.length}</p>
          <p className="mt-1 text-sm text-muted">当前衣橱里保存的服装记录。</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">当前可见</p>
          <p className="mt-2 text-3xl font-semibold text-accent-strong">
            {filteredGarments.length}
          </p>
          <p className="mt-1 text-sm text-muted">应用筛选条件后仍然显示的结果。</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">筛选状态</p>
          <p className="mt-2 text-sm font-semibold text-accent-strong">
            {activeFilterCount === 0 ? "未启用筛选" : `已启用 ${activeFilterCount} 项条件`}
          </p>
          <p className="mt-1 text-sm text-muted">留空表示不过滤该维度。</p>
        </div>
      </section>

      {creationMessage ? <StatusBanner tone="success" message={creationMessage} /> : null}

      <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-accent-strong">筛选器</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              筛选条件会同时生效，适合快速确认某一类服装是否已经入库，也能帮助你检查刚导入的记录是否分类正确。
            </p>
          </div>
          <Link href={buildFilterHref("", "", "")} className="secondary-button">
            清空筛选
          </Link>
        </div>

        <form
          className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
          action="/wardrobe"
          method="get"
        >
          <label className="field-shell">
            <span className="text-sm font-semibold text-muted">品类</span>
            <select name="category" defaultValue={categoryFilter} className="field-input">
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-shell">
            <span className="text-sm font-semibold text-muted">季节</span>
            <select name="season" defaultValue={seasonFilter} className="field-input">
              {SEASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-shell">
            <span className="text-sm font-semibold text-muted">颜色</span>
            <select name="color" defaultValue={colorFilter} className="field-input">
              {COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <button type="submit" className="primary-button flex-1">
              应用筛选
            </button>
            <Link href="/wardrobe" className="secondary-button">
              重置
            </Link>
          </div>
        </form>
      </section>

      {filteredGarments.length === 0 ? (
        <EmptyState
          title={
            garments.length === 0
              ? "衣橱里还没有服装"
              : "没有找到符合当前条件的服装"
          }
          description={
            garments.length === 0
              ? "先导入第一件单品，系统会自动生成默认分类，随后你可以在详情页继续修正。"
              : "可以切换筛选条件，或返回完整列表继续浏览所有服装。"
          }
          actionHref={garments.length === 0 ? "/import" : "/wardrobe"}
          actionLabel={garments.length === 0 ? "开始导入" : "返回全部服装"}
        />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGarments.map((garment) => (
            <GarmentCard key={garment.id} garment={garment} />
          ))}
        </section>
      )}
    </div>
  );
}
