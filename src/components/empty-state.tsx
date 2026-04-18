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
    <section className="surface-panel flex w-full flex-col gap-6 rounded-[2rem] p-8 sm:p-10">
      <div className="flex flex-col gap-3">
        <span className="status-chip w-fit">暂无内容</span>
        <div className="max-w-2xl space-y-3">
          <h2 className="display-font text-3xl text-accent-strong sm:text-4xl">{title}</h2>
          <p className="text-sm leading-7 text-muted sm:text-base">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={actionHref} className="primary-button">
          {actionLabel}
        </Link>
        <span className="text-sm leading-6 text-muted">
          导入后可在列表里看到默认分类结果，进入详情页还可以继续手动修正并保存。
        </span>
      </div>
    </section>
  );
}
