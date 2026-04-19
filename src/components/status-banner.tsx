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
    className:
      "border-[rgba(143,232,197,0.25)] bg-[rgba(84,164,131,0.12)] text-success shadow-[0_0_26px_rgba(84,164,131,0.12)]",
    role: "status",
    ariaLive: "polite",
  },
  error: {
    label: "需要处理",
    className:
      "border-[rgba(255,159,177,0.25)] bg-[rgba(164,71,102,0.12)] text-danger shadow-[0_0_24px_rgba(255,159,177,0.08)]",
    role: "alert",
    ariaLive: "assertive",
  },
  info: {
    label: "提示",
    className:
      "border-[rgba(125,196,255,0.22)] bg-[rgba(66,111,183,0.12)] text-accent-soft shadow-[0_0_24px_rgba(125,196,255,0.08)]",
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
      className={`rounded-[1.5rem] border px-4 py-3 backdrop-blur-xl ${config.className}`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] opacity-80">
        {config.label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-6">{message}</p>
    </div>
  );
}
