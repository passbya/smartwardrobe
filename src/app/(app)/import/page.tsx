import Link from "next/link";
import { ImportModeForms } from "@/components/import-mode-forms";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";

type ImportPageProps = {
  searchParams?: Promise<{
    error?: string;
    mode?: "single" | "batch";
    createdCount?: string;
  }>;
};

function getImportMessage(params: {
  error?: string;
  createdCount?: string;
}) {
  const createdCount = Number(params.createdCount);

  if (Number.isFinite(createdCount) && createdCount > 0) {
    return {
      tone: "success" as const,
      message: `本次成功导入 ${createdCount} 件同品类衣物。系统已经逐件生成记录并补齐默认分类。`,
      createdCount,
    };
  }

  if (params.error === "missing-image") {
    return {
      tone: "error" as const,
      message: "请先上传一张衣物图片，再提交单件导入。",
      createdCount: 0,
    };
  }

  if (params.error === "missing-required") {
    return {
      tone: "error" as const,
      message: "请先补齐必填字段后再提交。",
      createdCount: 0,
    };
  }

  if (params.error === "missing-images") {
    return {
      tone: "error" as const,
      message: "批量导入至少需要选择一张图片。",
      createdCount: 0,
    };
  }

  if (params.error === "batch-failed") {
    return {
      tone: "error" as const,
      message: "批量导入失败，本次未返回成功结果。请检查图片和字段后重试。",
      createdCount: 0,
    };
  }

  return {
    tone: "info" as const,
    message:
      "你可以在这里切换单件导入和同品类批量导入。批量模式会为每张图片创建独立记录，并统一套用共享字段。",
    createdCount: 0,
  };
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const params = (await searchParams) ?? {};
  const initialMode = params.mode === "batch" ? "batch" : "single";
  const banner = getImportMessage(params);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Import"
        title="导入新衣物"
        description="保留逐件录入，同时新增同品类批量导入。先上传图片，再由系统补齐默认分类，后续仍可进入详情页继续微调。"
        actions={
          <Link href="/wardrobe" className="secondary-button">
            返回衣橱
          </Link>
        }
      />

      <div data-testid="import-status-banner">
        <StatusBanner tone={banner.tone} message={banner.message} />
      </div>

      {banner.createdCount > 0 ? (
        <div
          data-testid="batch-import-success"
          className="hidden"
          aria-hidden="true"
        >
          <span data-testid="batch-import-created-count">
            {banner.createdCount}
          </span>
        </div>
      ) : null}

      <ImportModeForms initialMode={initialMode} />
    </div>
  );
}
