interface ZippoLogoProps {
  size?: "sm" | "md" | "lg";
  light?: boolean;
}

export function ZippoLogo({ size = "md", light = false }: ZippoLogoProps) {
  const scales = {
    sm: { text: "text-xl", sub: "text-[9px]" },
    md: { text: "text-3xl", sub: "text-[11px]" },
    lg: { text: "text-5xl", sub: "text-sm" },
  };

  const color = light ? "#FFFFFF" : "#8B1520";
  const subColor = light ? "rgba(255,255,255,0.8)" : "#6B6B6B";

  return (
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-center gap-1">
        {/* Z icon with wings */}
        <div className="flex items-center" style={{ color }}>
          <svg
            width={size === "sm" ? 22 : size === "md" ? 30 : 48}
            height={size === "sm" ? 22 : size === "md" ? 30 : 48}
            viewBox="0 0 40 40"
            fill="none"
          >
            {/* Wings */}
            <path d="M2 14 L10 10 L10 16" fill={color} opacity="0.7" />
            <path d="M2 22 L10 26 L10 20" fill={color} opacity="0.5" />
            {/* Z letter */}
            <rect x="10" y="8" width="22" height="24" rx="3" fill={color} />
            <path d="M14 13 L26 13 L14 27 L26 27" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span
          className={`${scales[size].text} tracking-tight`}
          style={{ color, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          ZIPPO
        </span>
        {/* Package box icon */}
        <svg
          width={size === "sm" ? 14 : size === "md" ? 18 : 28}
          height={size === "sm" ? 14 : size === "md" ? 18 : 28}
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginTop: size === "lg" ? -4 : -2 }}
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill={color} />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className={`${scales[size].sub} tracking-widest uppercase mt-0.5`} style={{ color: subColor, fontWeight: 500 }}>
        Zip your pick, We make it quick
      </span>
    </div>
  );
}
