"use client";

import { useMemo, useState } from "react";
import { getCategoryLabel } from "@/lib/catalog";
import { generateOutfitName, validateOutfitInput } from "@/lib/outfit-logic";
import type { GarmentRecord, OutfitRecord } from "@/lib/types";

type OutfitBuilderFormProps = {
  garments: GarmentRecord[];
  initialOutfit?: OutfitRecord | null;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

type OptionGroup = {
  label: string;
  helper: string;
  items: GarmentRecord[];
};

function resolveGarmentCategory(garment: GarmentRecord) {
  if (garment.category) {
    return garment.category;
  }

  const fallbackBySubcategory: Record<string, string> = {
    tshirt: "tops",
    shirt: "tops",
    sweater: "tops",
    jeans: "bottoms",
    shorts: "bottoms",
    skirt: "bottoms",
    jacket: "outerwear",
    coat: "outerwear",
    dress: "dresses",
    sneakers: "shoes",
    boots: "shoes",
    handbag: "bags",
    hat: "accessories",
  };

  return fallbackBySubcategory[garment.subcategory] ?? "";
}

function getOptionGroups(garments: GarmentRecord[]) {
  return {
    top: garments.filter((garment) => resolveGarmentCategory(garment) === "tops"),
    bottom: garments.filter((garment) => resolveGarmentCategory(garment) === "bottoms"),
    dress: garments.filter((garment) => resolveGarmentCategory(garment) === "dresses"),
    outerwear: garments.filter(
      (garment) => resolveGarmentCategory(garment) === "outerwear",
    ),
    shoes: garments.filter((garment) => resolveGarmentCategory(garment) === "shoes"),
    accessories: garments.filter((garment) =>
      ["accessories", "bags"].includes(resolveGarmentCategory(garment)),
    ),
  };
}

function getItemLabel(garment: GarmentRecord) {
  return garment.name;
}

export function OutfitBuilderForm({
  garments,
  initialOutfit,
  action,
  submitLabel,
}: OutfitBuilderFormProps) {
  const groups = useMemo(() => getOptionGroups(garments), [garments]);
  const [topGarmentId, setTopGarmentId] = useState(initialOutfit?.top_garment_id ?? "");
  const [bottomGarmentId, setBottomGarmentId] = useState(
    initialOutfit?.bottom_garment_id ?? "",
  );
  const [dressGarmentId, setDressGarmentId] = useState(initialOutfit?.dress_garment_id ?? "");
  const [outerwearGarmentId, setOuterwearGarmentId] = useState(
    initialOutfit?.outerwear_garment_id ?? "",
  );
  const [shoesGarmentId, setShoesGarmentId] = useState(initialOutfit?.shoes_garment_id ?? "");
  const [accessoryGarmentIds, setAccessoryGarmentIds] = useState<string[]>(
    initialOutfit?.accessory_garment_ids ?? [],
  );
  const [manualName, setManualName] = useState(initialOutfit?.name_source === "manual");
  const [manualInput, setManualInput] = useState(
    initialOutfit?.name_source === "manual" ? initialOutfit.name : "",
  );

  const generatedName = useMemo(
    () =>
      generateOutfitName(garments, {
        topGarmentId,
        bottomGarmentId,
        dressGarmentId,
        outerwearGarmentId,
        shoesGarmentId,
        accessoryGarmentIds,
      }),
    [
      accessoryGarmentIds,
      bottomGarmentId,
      dressGarmentId,
      garments,
      outerwearGarmentId,
      shoesGarmentId,
      topGarmentId,
    ],
  );

  const displayNameValue = manualName ? manualInput : generatedName;
  const hasDress = Boolean(dressGarmentId);

  const validationMessage = useMemo(() => {
    try {
      validateOutfitInput(garments, {
        name: displayNameValue,
        topGarmentId,
        bottomGarmentId,
        dressGarmentId,
        outerwearGarmentId,
        shoesGarmentId,
        accessoryGarmentIds,
      });

      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "当前搭配还不能保存。";
    }
  }, [
    accessoryGarmentIds,
    bottomGarmentId,
    displayNameValue,
    dressGarmentId,
    garments,
    outerwearGarmentId,
    shoesGarmentId,
    topGarmentId,
  ]);

  const groupedFields: OptionGroup[] = [
    { label: "上装", helper: "最多 1 件，且只能来自上装分类。", items: groups.top },
    { label: "下装", helper: "最多 1 件，且只能来自下装分类。", items: groups.bottom },
    { label: "连衣裙", helper: "选择后会替代上装与下装。", items: groups.dress },
    { label: "外套", helper: "可选，最多 1 件。", items: groups.outerwear },
    { label: "鞋子", helper: "可选，最多 1 双。", items: groups.shoes },
  ];

  return (
    <form
      action={action}
      className="flex flex-col gap-6"
      data-testid={initialOutfit ? "outfit-editor-form" : "outfit-form"}
    >
      <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
                Outfit Name
              </p>
              <h2 className="display-font text-3xl text-foreground-strong sm:text-4xl">
                实时生成默认名称
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                系统会根据主体槽位自动命名。你可以直接使用自动名称，也可以手动覆盖；手动改名后，后续编辑不会自动覆盖你保存的名称。
              </p>
            </div>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">搭配名称</span>
              <input
                type="text"
                name="name"
                value={displayNameValue}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;

                  if (!nextValue.trim() || nextValue.trim() === generatedName) {
                    setManualName(false);
                    setManualInput("");
                    return;
                  }

                  setManualName(true);
                  setManualInput(nextValue);
                }}
                className="field-input"
                placeholder="请输入搭配名称"
              />
            </label>

            <div className="rounded-[1.4rem] border border-line/80 bg-[rgba(10,19,35,0.42)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
                Auto Preview
              </p>
              <p
                className="mt-3 text-2xl font-semibold text-foreground-strong"
                data-testid="outfit-generated-name"
              >
                {generatedName}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="status-chip">
                  {manualName ? "当前使用手动名称" : "当前使用自动名称"}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setManualName(false);
                    setManualInput("");
                  }}
                >
                  恢复自动命名
                </button>
              </div>
            </div>

            {validationMessage ? (
              <div className="rounded-[1.4rem] border border-[rgba(255,159,177,0.25)] bg-[rgba(164,71,102,0.12)] p-4 text-sm leading-7 text-danger">
                {validationMessage}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-[rgba(143,232,197,0.22)] bg-[rgba(84,164,131,0.12)] p-4 text-sm leading-7 text-success">
                当前搭配满足保存条件，可以直接提交。
              </div>
            )}
          </div>

          <div className="rounded-[1.8rem] border border-line/70 bg-[rgba(7,15,28,0.54)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft">
              Slot Rules
            </p>
            <div className="mt-4 space-y-3">
              {groupedFields.map((group) => (
                <div
                  key={group.label}
                  className="rounded-[1.2rem] border border-line/70 bg-[rgba(255,255,255,0.02)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-foreground-strong">{group.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{group.helper}</p>
                </div>
              ))}
              <div className="rounded-[1.2rem] border border-line/70 bg-[rgba(255,255,255,0.02)] px-4 py-3">
                <p className="text-sm font-semibold text-foreground-strong">配饰</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  可多选，来源为配饰与包袋。包袋会并入配饰槽位。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="grid gap-5">
            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">上装</span>
              <select
                name="topGarmentId"
                value={topGarmentId}
                disabled={hasDress}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setTopGarmentId(nextValue);
                  if (nextValue && dressGarmentId) {
                    setDressGarmentId("");
                  }
                }}
                className="field-input"
              >
                <option value="">暂不选择</option>
                {groups.top.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {getItemLabel(garment)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">下装</span>
              <select
                name="bottomGarmentId"
                value={bottomGarmentId}
                disabled={hasDress}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setBottomGarmentId(nextValue);
                  if (nextValue && dressGarmentId) {
                    setDressGarmentId("");
                  }
                }}
                className="field-input"
              >
                <option value="">暂不选择</option>
                {groups.bottom.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {getItemLabel(garment)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">连衣裙</span>
              <select
                name="dressGarmentId"
                value={dressGarmentId}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setDressGarmentId(nextValue);
                  if (nextValue) {
                    setTopGarmentId("");
                    setBottomGarmentId("");
                  }
                }}
                className="field-input"
              >
                <option value="">暂不选择</option>
                {groups.dress.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {getItemLabel(garment)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
          <div className="grid gap-5">
            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">外套</span>
              <select
                name="outerwearGarmentId"
                value={outerwearGarmentId}
                onChange={(event) => setOuterwearGarmentId(event.currentTarget.value)}
                className="field-input"
              >
                <option value="">暂不选择</option>
                {groups.outerwear.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {getItemLabel(garment)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-shell">
              <span className="text-sm font-semibold text-muted">鞋子</span>
              <select
                name="shoesGarmentId"
                value={shoesGarmentId}
                onChange={(event) => setShoesGarmentId(event.currentTarget.value)}
                className="field-input"
              >
                <option value="">暂不选择</option>
                {groups.shoes.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {getItemLabel(garment)}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="field-shell">
              <legend className="text-sm font-semibold text-muted">配饰与包袋</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.accessories.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-line/80 bg-[rgba(11,22,40,0.42)] px-4 py-6 text-sm leading-6 text-muted">
                    当前身份还没有可选配饰。先去导入配饰或包袋，再回来完成搭配。
                  </div>
                ) : (
                  groups.accessories.map((garment) => {
                    const checked = accessoryGarmentIds.includes(garment.id);

                    return (
                      <label
                        key={garment.id}
                        className={`rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                          checked
                            ? "border-[rgba(125,196,255,0.34)] bg-[rgba(125,196,255,0.12)] text-foreground-strong"
                            : "border-line/80 bg-[rgba(11,22,40,0.42)] text-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="accessoryGarmentIds"
                          value={garment.id}
                          checked={checked}
                          onChange={(event) => {
                            setAccessoryGarmentIds((current) =>
                              event.currentTarget.checked
                                ? [...current, garment.id]
                                : current.filter((value) => value !== garment.id),
                            );
                          }}
                          className="sr-only"
                        />
                        <span className="font-semibold">{garment.name}</span>
                        <span className="mt-1 block text-xs uppercase tracking-[0.18em] opacity-80">
                          {getCategoryLabel(resolveGarmentCategory(garment))}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </fieldset>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm leading-6 text-muted">
          保存后会立即生成搭配详情页；后续可继续修改槽位或自定义名称。
        </p>
        <button type="submit" className="primary-button" disabled={Boolean(validationMessage)}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
