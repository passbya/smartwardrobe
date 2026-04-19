import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <section className="surface-panel page-fade-in flex w-full flex-col gap-6 rounded-[2rem] p-8 sm:p-10">
      <div className="flex flex-col gap-3">
        <span className="status-chip w-fit">暂无内容</span>
        <div className="max-w-2xl space-y-3">
          <h2 className="display-font text-3xl text-foreground-strong sm:text-4xl">
            {title}
          </h2>
          <p className="text-sm leading-7 text-muted sm:text-base">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={actionHref} className="primary-button">
          {actionLabel}
        </Link>
        <span className="max-w-2xl text-sm leading-6 text-muted">
          新记录保存后会立即出现在当前身份的工作区里，你可以继续进入详情页调整内容。
        </span>
      </div>
    </section>
  );
}
