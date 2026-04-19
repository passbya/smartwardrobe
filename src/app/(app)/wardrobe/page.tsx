import Link from "next/link";
import { deleteGarmentAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
import { requireSession } from "@/lib/session";
import { queryWardrobe, type WardrobeSort } from "@/lib/wardrobe-query";

type WardrobePageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    color?: string;
    season?: string;
    sort?: WardrobeSort;
    created?: string;
    deleted?: string;
    error?: string;
  }>;
};

function getStatusBanner(params: {
  created?: string;
  deleted?: string;
  error?: string;
}) {
  if (params.created === "1") {
    return {
      tone: "success" as const,
      message: "衣物已经导入完成，系统也为它生成了默认分类。",
    };
  }

  if (params.deleted === "1") {
    return {
      tone: "success" as const,
      message: "衣物已删除，对应图片也已经从当前身份的仓储中清理。",
    };
  }

  if (params.error === "delete-not-found") {
    return {
      tone: "error" as const,
      message: "没有找到要删除的衣物记录，请刷新衣橱后重试。",
    };
  }

  return null;
}

function buildWardrobeHref(params: {
  q?: string;
  category?: string;
  color?: string;
  season?: string;
  sort?: WardrobeSort;
}) {
  const query = new URLSearchParams();

  if (params.q?.trim()) {
    query.set("q", params.q.trim());
  }

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.color) {
    query.set("color", params.color);
  }

  if (params.season) {
    query.set("season", params.season);
  }

  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }

  const serialized = query.toString();
  return serialized ? `/wardrobe?${serialized}` : "/wardrobe";
}

const SORT_OPTIONS: Array<{ value: WardrobeSort; label: string }> = [
  { value: "newest", label: "最新导入优先" },
  { value: "oldest", label: "最早导入优先" },
  { value: "name-asc", label: "名称 A-Z" },
  { value: "name-desc", label: "名称 Z-A" },
];

export default async function WardrobePage({ searchParams }: WardrobePageProps) {
  const session = await requireSession();
  const garments = await listGarments(session.userId);
  const params = (await searchParams) ?? {};
  const searchQuery = params.q ?? "";
  const categoryFilter = params.category ?? "";
  const colorFilter = params.color ?? "";
  const seasonFilter = params.season ?? "";
  const sort = params.sort ?? "newest";

  const filteredGarments = queryWardrobe(garments, {
    q: searchQuery,
    category: categoryFilter,
    color: colorFilter,
    season: seasonFilter,
    sort,
  });

  const activeFilterCount = [
    searchQuery.trim(),
    categoryFilter,
    colorFilter,
    seasonFilter,
    sort !== "newest" ? sort : "",
  ].filter(Boolean).length;
  const statusBanner = getStatusBanner(params);
  const currentWardrobeHref = buildWardrobeHref({
    q: searchQuery,
    category: categoryFilter,
    color: colorFilter,
    season: seasonFilter,
    sort,
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Wardrobe"
        title="你的数字衣橱"
        description={`${session.displayName} 当前拥有独立的衣物列表、图片和筛选状态。你可以先搜索，再筛选，再进入详情页确认最终分类。`}
        actions={
          <Link href="/import" className="primary-button glow-ring">
            导入新衣物
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            当前身份
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">
            {session.displayName}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            这是当前预设身份正在管理的独立衣橱视角。
          </p>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            总件数
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">{garments.length}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            当前身份下已经保存的全部衣物记录数量。
          </p>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
            当前结果
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground-strong">
            {filteredGarments.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {activeFilterCount === 0
              ? "当前尚未启用筛选条件。"
              : `当前已启用 ${activeFilterCount} 项条件，结果会随之收窄。`}
          </p>
        </div>
      </section>

      {statusBanner ? (
        <StatusBanner tone={statusBanner.tone} message={statusBanner.message} />
      ) : null}

      <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-foreground-strong">管理控制台</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              搜索覆盖名称、品牌和备注；筛选与排序会叠加在同一组结果上，适合快速找到某件衣物并继续处理。
            </p>
          </div>
          <Link href="/wardrobe" className="secondary-button">
            清空条件
          </Link>
        </div>

        <form
          data-testid="wardrobe-filters"
          className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] lg:items-end"
          action="/wardrobe"
          method="get"
        >
          <label className="field-shell lg:col-span-2">
            <span className="text-sm font-semibold text-muted">搜索</span>
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              className="field-input"
              placeholder="搜索名称、品牌或备注"
            />
          </label>

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

          <label className="field-shell">
            <span className="text-sm font-semibold text-muted">排序</span>
            <select name="sort" defaultValue={sort} className="field-input">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3 lg:justify-end">
            <button type="submit" className="primary-button flex-1 lg:flex-none">
              应用
            </button>
            <Link href="/wardrobe" className="secondary-button">
              重置
            </Link>
          </div>
        </form>
      </section>

      {filteredGarments.length === 0 ? (
        <EmptyState
          title={garments.length === 0 ? "这个身份的衣橱还是空的" : "当前条件下没有匹配结果"}
          description={
            garments.length === 0
              ? "先导入第一件衣物，系统会自动生成默认分类，之后你还可以继续在详情页手动修正。"
              : "你可以清空条件，或者调整搜索词、筛选项与排序方式后重新查看。"
          }
          actionHref={garments.length === 0 ? "/import" : "/wardrobe"}
          actionLabel={garments.length === 0 ? "开始导入" : "查看全部衣物"}
        />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              actions={
                <form action={deleteGarmentAction.bind(null, garment.id)}>
                  <input type="hidden" name="redirectTo" value={currentWardrobeHref} />
                  <ConfirmSubmitButton
                    className="secondary-button border-[rgba(255,159,177,0.18)] text-danger hover:bg-[rgba(255,159,177,0.08)]"
                    confirmMessage={`确认删除“${garment.name}”吗？这会同时删除对应图片。`}
                  >
                    删除
                  </ConfirmSubmitButton>
                </form>
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
