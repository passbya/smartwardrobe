type StatusBannerProps = {
  tone: "success" | "error" | "info";
  message: string;
};

const toneStyles: Record<
  StatusBannerProps["tone"],
  { label: string; className: string; role: "status" | "alert"; ariaLive: "polite" | "assertive" }
> = {
  success: {
    label: "完成",
    className: "border-success/20 bg-success/8 text-success",
    role: "status",
    ariaLive: "polite",
  },
  error: {
    label: "需要处理",
    className: "border-danger/20 bg-danger/8 text-danger",
    role: "alert",
    ariaLive: "assertive",
  },
  info: {
    label: "提示",
    className: "border-accent/20 bg-accent/8 text-accent-strong",
    role: "status",
    ariaLive: "polite",
  },
};

export function StatusBanner({ tone, message }: StatusBannerProps) {
  const config = toneStyles[tone];

  return (
    <div
      role={config.role}
      aria-live={config.ariaLive}
      className={`rounded-[1.35rem] border px-4 py-3 ${config.className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">
        {config.label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6">{message}</p>
    </div>
  );
}
