"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createGarmentAction,
  createGarmentBatchAction,
} from "@/app/actions";
import {
  COLOR_OPTIONS,
  EDITABLE_SEASON_OPTIONS,
  SUBCATEGORY_OPTIONS,
} from "@/lib/catalog";

type ImportMode = "single" | "batch";

type ImportModeFormsProps = {
  initialMode: ImportMode;
};

function ImportModeButton({
  active,
  testId,
  title,
  description,
  onClick,
}: {
  active: boolean;
  testId: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${
        active
          ? "border-[rgba(121,181,255,0.38)] bg-[rgba(94,153,255,0.16)] shadow-[0_14px_40px_rgba(39,87,179,0.18)]"
          : "border-line bg-[rgba(10,18,42,0.52)] hover:border-[rgba(121,181,255,0.24)] hover:bg-[rgba(94,153,255,0.1)]"
      }`}
    >
      <p className="text-base font-semibold text-foreground-strong">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </button>
  );
}

function SharedMetadataFields() {
  return (
    <>
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
          placeholder="可以记录面料、场景、尺码感受或后续搭配想法。"
          className="field-input min-h-36 resize-y"
        />
      </label>
    </>
  );
}

function SingleImportForm() {
  return (
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
              单件导入
            </span>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(214,229,255,0.76)]">
                上传图片
              </p>
              <h2 className="display-font max-w-lg text-3xl text-white sm:text-4xl">
                先把这件衣物带进衣橱，再决定它的最终归属。
              </h2>
              <p className="max-w-lg text-sm leading-7 text-[rgba(222,234,255,0.78)]">
                适合录入单件新品或需要逐件确认的衣物。保存后系统会立即补齐默认分类，你仍然可以继续手动修正。
              </p>
            </div>
          </div>

          <label className="field-shell relative border-white/12 bg-white/8">
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
      </section>

      <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-accent-soft">录入信息</p>
          <h2 className="display-font text-3xl text-foreground-strong">
            保留单件工作流，继续逐件导入
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            名称和子类仍然是必填项。颜色、季节、品牌和备注越完整，后续搜索和筛选越顺手。
          </p>
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

          <SharedMetadataFields />
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
  );
}

function BatchImportForm() {
  return (
    <form
      data-testid="import-batch-form"
      action={createGarmentBatchAction}
      className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]"
    >
      <section className="surface-panel overflow-hidden rounded-[2rem] p-0">
        <div className="relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,rgba(80,162,255,0.24)_0%,rgba(14,28,66,0.88)_55%,rgba(7,11,29,0.96)_100%)] p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute left-[-8%] top-[-4%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(168,219,255,0.44)_0%,rgba(147,197,255,0)_72%)] blur-2xl" />
            <div className="absolute bottom-[-12%] right-[-4%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(120,119,255,0.3)_0%,rgba(120,119,255,0)_74%)] blur-3xl" />
          </div>

          <div className="relative space-y-5">
            <span className="status-chip bg-white/14 text-white/92 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]">
              同品类批量导入
            </span>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(214,229,255,0.76)]">
                批量上传
              </p>
              <h2 className="display-font max-w-lg text-3xl text-white sm:text-4xl">
                一次上传多张同类衣物图片，让系统批量建档。
              </h2>
              <p className="max-w-lg text-sm leading-7 text-[rgba(222,234,255,0.78)]">
                这一批图片会共享同一个子类与公共字段。系统会为每张图片生成一条独立衣物记录，并自动编号命名。
              </p>
            </div>
          </div>

          <div className="relative grid gap-4">
            <label className="field-shell border-white/12 bg-white/8">
              <span className="text-sm font-semibold text-[rgba(225,236,255,0.86)]">
                批量图片 *
              </span>
              <input
                data-testid="batch-image-input"
                type="file"
                name="images"
                accept="image/*"
                multiple
                className="field-input py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(117,177,255,0.18)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[rgb(221,236,255)] hover:file:bg-[rgba(117,177,255,0.24)]"
                required
              />
            </label>

            <div className="rounded-[1.6rem] border border-white/12 bg-[rgba(7,13,30,0.48)] p-4 shadow-[0_18px_48px_rgba(4,8,24,0.28)]">
              <p className="text-sm font-semibold text-white">批量规则</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[rgba(216,230,255,0.76)]">
                <li>同一批图片必须属于同一个子类。</li>
                <li>颜色、季节、品牌和备注会统一套用到整批。</li>
                <li>每张图片会生成独立记录，名称按“子类 + 序号”自动生成。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-accent-soft">整批设置</p>
          <h2 className="display-font text-3xl text-foreground-strong">
            先锁定共用字段，再统一创建整批衣物
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            批量导入不会要求你为每张图片单独命名。导入后可以再进入详情页按需微调。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <SharedMetadataFields />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            data-testid="batch-import-submit"
            type="submit"
            className="primary-button glow-ring"
          >
            批量导入并自动分类
          </button>
          <Link href="/wardrobe" className="secondary-button">
            取消
          </Link>
        </div>
      </section>
    </form>
  );
}

export function ImportModeForms({ initialMode }: ImportModeFormsProps) {
  const [mode, setMode] = useState<ImportMode>(initialMode);

  return (
    <div className="flex flex-col gap-6">
      <section
        data-testid="import-mode-toggle"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ImportModeButton
          testId="import-mode-single"
          active={mode === "single"}
          title="单件导入"
          description="逐件上传、逐件命名，适合精细录入。"
          onClick={() => setMode("single")}
        />
        <ImportModeButton
          testId="import-mode-batch"
          active={mode === "batch"}
          title="同品类批量导入"
          description="一次上传多张同类图片，共享字段并自动编号。"
          onClick={() => setMode("batch")}
        />
      </section>

      {mode === "single" ? <SingleImportForm /> : <BatchImportForm />}
    </div>
  );
}
