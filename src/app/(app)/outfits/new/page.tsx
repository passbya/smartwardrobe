import Link from "next/link";
import { createOutfitAction } from "@/app/actions";
import { EmptyState } from "@/components/empty-state";
import { OutfitBuilderForm } from "@/components/outfit-builder-form";
import { PageHeader } from "@/components/page-header";
import { listGarments } from "@/lib/data-store";
import { requireSession } from "@/lib/session";

export default async function NewOutfitPage() {
  const session = await requireSession();
  const garments = await listGarments(session.userId);

  if (garments.length < 2) {
    return (
      <div className="flex w-full flex-col gap-8">
        <PageHeader
          eyebrow="New Outfit"
          title="创建你的第一套搭配"
          description="手动搭配至少需要 2 件衣物。如果当前身份的衣橱还不够完整，先去导入衣物，再回来开始组合。"
        />

        <EmptyState
          title="当前身份还没有足够的衣物"
          description="至少需要 2 件衣物才能开始手动搭配。先去导入上装、下装、鞋子或配饰，再回来继续。"
          actionHref="/import"
          actionLabel="先去导入衣物"
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="New Outfit"
        title="创建一套新的手动搭配"
        description="从当前身份已经导入的衣物中选择主体槽位和配饰，系统会实时生成默认名称。保存后可继续在详情页编辑。"
        actions={
          <Link href="/outfits" className="secondary-button">
            返回搭配列表
          </Link>
        }
      />

      <OutfitBuilderForm
        garments={garments}
        action={createOutfitAction}
        submitLabel="保存搭配"
      />
    </div>
  );
}
