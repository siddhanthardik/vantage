import React from "react";

interface SectionKickerProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  linePosition?: "left" | "right" | "both";
  textColor?: string;
  className?: string;
}

export default function SectionKicker({
  children,
  align,
  linePosition,
  textColor = "#B08D57",
  className = "",
}: SectionKickerProps) {
  // Determine effective mode
  const effectiveMode = linePosition || align || "center";

  if (effectiveMode === "left") {
    // line on left: —— TEXT
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <span className="w-8 h-[1px] bg-[#B08D57]" />
        <span
          className="text-[11px] sm:text-xs uppercase font-bold tracking-[0.2em]"
          style={{ color: textColor }}
        >
          {children}
        </span>
      </div>
    );
  }

  if (effectiveMode === "right") {
    // line on right: TEXT ——
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <span
          className="text-[11px] sm:text-xs uppercase font-bold tracking-[0.2em]"
          style={{ color: textColor }}
        >
          {children}
        </span>
        <span className="w-8 h-[1px] bg-[#B08D57]" />
      </div>
    );
  }

  // both: —— TEXT ——
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="w-8 h-[1px] bg-[#B08D57]" />
      <span
        className="text-[11px] sm:text-xs uppercase font-bold tracking-[0.2em]"
        style={{ color: textColor }}
      >
        {children}
      </span>
      <span className="w-8 h-[1px] bg-[#B08D57]" />
    </div>
  );
}
