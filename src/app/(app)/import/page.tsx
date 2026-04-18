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
    return "请先上传一张服装图片。";
  }

  if (error === "missing-required") {
    return "名称和子类是必填项，请补齐后再提交。";
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
        title="导入一件新服装"
        description="先上传图片，再补齐最少信息。系统会先生成默认分类，随后你可以在详情页继续修正并返回列表确认。"
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
          message="建议使用单件服装、正面清晰、背景干净的图片。上传完成后会直接进入详情页，并能立刻回到衣橱查看结果。"
        />
      )}

      <form action={createGarmentAction} className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="flex h-full flex-col justify-between gap-6 rounded-[1.75rem] border border-dashed border-line bg-[rgba(255,251,245,0.72)] p-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                图片上传
              </p>
              <h2 className="display-font text-3xl text-accent-strong sm:text-4xl text-balance">
                先给系统一张清楚的图片
              </h2>
              <p className="max-w-md text-sm leading-7 text-muted">
                单件、正面、背景干净的图片最适合当前版本。上传完成后，系统会立即进入自动分类流程，并把新记录写入衣橱列表。
              </p>
            </div>

            <div className="space-y-4 text-sm leading-6 text-muted">
              <div className="rounded-[1.3rem] border border-line/70 bg-white/55 p-4">
                <p className="font-semibold text-accent-strong">导入建议</p>
                <ul className="mt-2 space-y-2">
                  <li>• 优先选择单件服装，避免复杂背景干扰识别。</li>
                  <li>• 名称尽量写成你日常会搜索的叫法。</li>
                  <li>• 子类先选最接近的项，后续可以手动覆盖。</li>
                </ul>
              </div>

              <div className="rounded-[1.3rem] border border-line/70 bg-white/55 p-4">
                <p className="font-semibold text-accent-strong">导入后的结果</p>
                <ul className="mt-2 space-y-2">
                  <li>• 系统会补齐默认品类与季节。</li>
                  <li>• 列表页会马上显示新记录。</li>
                  <li>• 详情页可以继续修改最终分类。</li>
                </ul>
              </div>

              <label className="field-shell">
                <span className="text-sm font-semibold text-muted">图片文件 *</span>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="field-input py-3"
                  required
                />
              </label>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="mb-5 space-y-1">
            <p className="text-sm font-semibold text-accent-strong">基础信息</p>
            <p className="text-sm leading-6 text-muted">
              先填最少字段即可提交，其他信息可以在详情页补充或修正。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">服装名称 *</span>
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
              <select name="subcategory" className="field-input" defaultValue="tshirt" required>
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
                <option value="">由系统补齐或留空</option>
                {EDITABLE_SEASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">品牌</span>
              <input type="text" name="brand" placeholder="例如：Uniqlo" className="field-input" />
            </label>

            <label className="field-shell md:col-span-2">
              <span className="text-sm font-semibold text-muted">备注</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="可记录面料、购买时间、穿着场景或搭配偏好。"
                className="field-input min-h-36 resize-y"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="submit" className="primary-button">
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
