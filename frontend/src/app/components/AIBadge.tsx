interface AIBadgeProps {
  module: 1 | 2 | 3;
  label?: string;
  variant?: "default" | "mini" | "pill";
}

const moduleData = {
  1: { name: "Gift Intelligence", short: "GI", color: "#2563EB", bg: "#EFF6FF" },
  2: { name: "Personalizer", short: "PR", color: "#7C3AED", bg: "#F5F3FF" },
  3: { name: "Delivery Optimizer", short: "DO", color: "#059669", bg: "#ECFDF5" },
};

export function AIBadge({ module, label, variant = "default" }: AIBadgeProps) {
  const data = moduleData[module];

  if (variant === "mini") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
        style={{ background: data.bg, color: data.color, fontWeight: 700 }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: data.color }} />
        IS-{module}
      </span>
    );
  }

  if (variant === "pill") {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ background: data.bg, border: `1px solid ${data.color}20` }}
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] text-white" style={{ background: data.color, fontWeight: 800 }}>
          {module}
        </div>
        <span className="text-xs" style={{ color: data.color, fontWeight: 600 }}>
          {label || data.name}
        </span>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: data.color }} />
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: data.bg, border: `1px solid ${data.color}30` }}
    >
      <div
        className="flex items-center justify-center w-6 h-6 rounded-lg text-[10px] text-white"
        style={{ background: data.color, fontWeight: 800 }}
      >
        {data.short}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: data.color }}>
          Module {module} Active
        </div>
        <div className="text-xs" style={{ color: data.color, fontWeight: 600 }}>
          {label || data.name}
        </div>
      </div>
      <span className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ background: data.color }} />
    </div>
  );
}
