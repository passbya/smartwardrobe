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
    <div className="page-fade-in flex flex-col gap-5 rounded-[2rem] border border-line/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] pb-6 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="max-w-3xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-accent-soft">
          {eyebrow}
        </p>
        <h1 className="display-font mt-3 text-4xl leading-[0.95] text-foreground-strong sm:text-5xl lg:text-[3.75rem]">
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
