import Link from "next/link";
import { createGarmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import {
  COLOR_OPTIONS,
  EDITABLE_SEASON_OPTIONS,
  SUBCATEGORY_OPTIONS,
} from "@/lib/catalog";

type ImportPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getImportErrorMessage(error?: string) {
  if (error === "missing-image") {
    return "请先上传一张衣物图片。";
  }

  if (error === "missing-required") {
    return "名称和子类是必填项，请补齐后再保存。";
  }

  return "";
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const params = (await searchParams) ?? {};
  const errorMessage = getImportErrorMessage(params.error);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Import"
        title="导入一件新的衣物"
        description="先上传图片，再填写最少信息。系统会立刻生成默认分类，你也可以稍后在详情页继续手动修正。"
        actions={
          <Link href="/wardrobe" className="secondary-button">
            返回衣橱
          </Link>
        }
      />

      {errorMessage ? (
        <StatusBanner tone="error" message={errorMessage} />
      ) : (
        <StatusBanner
          tone="info"
          message="建议使用主体完整、背景干净的单件服装图片。保存后会自动进入详情页查看分类结果。"
        />
      )}

      <form
        data-testid="import-form"
        action={createGarmentAction}
        className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]"
      >
        <section className="surface-panel overflow-hidden rounded-[2rem] p-0">
          <div className="relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,rgba(76,143,255,0.24)_0%,rgba(15,24,59,0.88)_55%,rgba(8,12,27,0.96)_100%)] p-6 sm:p-7">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute left-[-8%] top-[-4%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(147,197,255,0.5)_0%,rgba(147,197,255,0)_72%)] blur-2xl" />
              <div className="absolute bottom-[-12%] right-[-4%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(120,119,255,0.34)_0%,rgba(120,119,255,0)_74%)] blur-3xl" />
            </div>

            <div className="relative space-y-5">
              <span className="status-chip bg-white/14 text-white/92 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]">
                月光投递区
              </span>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(214,229,255,0.76)]">
                  上传图片
                </p>
                <h2 className="display-font max-w-lg text-3xl text-white sm:text-4xl">
                  先把这件衣物带进衣橱，再决定它的最终归属
                </h2>
                <p className="max-w-lg text-sm leading-7 text-[rgba(222,234,255,0.78)]">
                  当前版本优先处理单件服装图片。画面越干净、主体越完整，默认分类通常越稳定，后续手动修正也会更轻松。
                </p>
              </div>
            </div>

            <div className="relative grid gap-4">
              <div className="rounded-[1.6rem] border border-white/12 bg-[rgba(7,13,30,0.48)] p-4 shadow-[0_18px_48px_rgba(4,8,24,0.28)]">
                <p className="text-sm font-semibold text-white">导入建议</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[rgba(216,230,255,0.76)]">
                  <li>尽量使用单件衣物图，避免复杂背景和遮挡。</li>
                  <li>名称写成你日后会主动搜索的说法，后续整理会更顺手。</li>
                  <li>子类先选最接近的一项，保存后仍然可以继续修正。</li>
                </ul>
              </div>

              <div className="rounded-[1.6rem] border border-white/12 bg-[rgba(7,13,30,0.48)] p-4 shadow-[0_18px_48px_rgba(4,8,24,0.28)]">
                <p className="text-sm font-semibold text-white">保存后会发生什么</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[rgba(216,230,255,0.76)]">
                  <li>系统会根据子类补全默认品类和建议季节。</li>
                  <li>新记录会立刻出现在当前身份的衣橱里。</li>
                  <li>详情页可以继续手动确认最终分类。</li>
                </ul>
              </div>

              <label className="field-shell border-white/12 bg-white/8">
                <span className="text-sm font-semibold text-[rgba(225,236,255,0.86)]">
                  图片文件 *
                </span>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="field-input py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(117,177,255,0.18)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[rgb(221,236,255)] hover:file:bg-[rgba(117,177,255,0.24)]"
                  required
                />
              </label>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-accent-soft">录入信息</p>
              <h2 className="display-font text-3xl text-foreground-strong">
                先完成最少字段，让衣物进入你的工作流
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                名称和子类是必填项。颜色、季节、品牌和备注都可以稍后再补，但越完整越方便后续筛选和管理。
              </p>
            </div>

            <div className="grid min-w-[220px] gap-3 rounded-[1.5rem] border border-line bg-[rgba(14,23,52,0.52)] p-4 shadow-[0_18px_40px_rgba(4,11,30,0.24)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                  当前流程
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  上传图片 → 保存记录 → 自动分类 → 手动修正
                </p>
              </div>
              <div className="h-px bg-line" />
              <p className="text-sm leading-6 text-muted">
                这一步只负责导入，不会改动其他已有衣物记录。
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">衣物名称 *</span>
              <input
                type="text"
                name="name"
                placeholder="例如：白色短袖 T 恤"
                className="field-input"
                required
              />
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">子类 *</span>
              <select
                name="subcategory"
                className="field-input"
                defaultValue="tshirt"
                required
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
              <select name="color" className="field-input" defaultValue="">
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
              <select name="season" className="field-input" defaultValue="">
                <option value="">交给系统补齐或留空</option>
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
                placeholder="例如：Uniqlo"
                className="field-input"
              />
            </label>

            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">备注</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="可以记录面料、购买时间、适合场景或搭配偏好。"
                className="field-input min-h-36 resize-y"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="submit" className="primary-button glow-ring">
              保存并自动分类
            </button>
            <Link href="/wardrobe" className="secondary-button">
              取消
            </Link>
          </div>
        </section>
      </form>
    </div>
  );
}
