import { useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "w-10 h-10 rounded-[12px] text-[1rem]",
  md: "w-14 h-14 rounded-[14px] text-[1.5rem]",
  lg: "w-16 h-16 rounded-[16px] text-[1.4rem]",
  xl: "w-[72px] h-[72px] rounded-[18px] text-[1.7rem]",
};

const DEFAULT_GRADIENT = "from-pn-sky to-pn-steel";

export function CommunityAvatar({
  name,
  avatarUrl,
  size = "md",
  gradient,
  ringColor,
  className,
}: {
  name?: string;
  avatarUrl?: string;
  size?: Size;
  gradient?: string;
  ringColor?: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const initial = (name?.charAt(0)?.toUpperCase() ?? "C");
  const hasImage = Boolean(avatarUrl && !errored);
  const grad = gradient ?? DEFAULT_GRADIENT;
  const sizeCls = SIZE_CLASSES[size];

  const ring = ringColor
    ? ({ boxShadow: `0 0 0 3px ${ringColor}` } as React.CSSProperties)
    : undefined;

  if (hasImage) {
    return (
      <div
        className={`${sizeCls} shrink-0 overflow-hidden bg-pn-bg border border-pn-border ${className ?? ""}`}
        style={ring}
      >
        <img
          src={avatarUrl}
          alt={name ? `${name} community avatar` : "Community avatar"}
          loading="lazy"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeCls} shrink-0 bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white font-['Cormorant_Garamond',serif] ${className ?? ""}`}
      style={ring}
      aria-label={name ? `${name} community avatar` : "Community avatar"}
    >
      {initial}
    </div>
  );
}
