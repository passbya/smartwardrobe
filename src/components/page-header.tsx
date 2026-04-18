type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-line/70 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
          {eyebrow}
        </p>
        <h1 className="display-font mt-3 text-4xl leading-none text-accent-strong sm:text-5xl lg:text-[3.6rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base text-balance">
          {description}
        </p>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
