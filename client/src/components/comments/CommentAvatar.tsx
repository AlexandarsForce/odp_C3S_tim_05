import { Link } from "react-router-dom";

const GRADIENT_MAP: Record<string, string> = {
  "gradient:sky-steel":  "from-pn-sky to-pn-steel",
  "gradient:steel-navy": "from-pn-steel to-pn-navy",
  "gradient:pale-sky":   "from-pn-pale to-pn-sky",
  "gradient:lm-steel":   "from-pn-lm to-pn-steel",
  "gradient:navy-sky":   "from-pn-navy to-pn-sky",
  "gradient:green-navy": "from-pn-green to-pn-navy",
};

const DEFAULT_GRADIENT = "from-pn-sky to-pn-steel";

const isCustomPicture = (s: string) =>
  s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://");

type Size = "xs" | "sm" | "md";

const SIZE_CLASSES: Record<Size, { box: string; text: string; ring: string }> = {
  xs: { box: "w-7 h-7",   text: "text-[0.78rem]", ring: "border-[1.5px]" },
  sm: { box: "w-9 h-9",   text: "text-[0.95rem]", ring: "border-[2px]" },
  md: { box: "w-11 h-11", text: "text-[1.1rem]",  ring: "border-[2px]" },
};

interface Props {
  username?: string;
  profilePicture?: string;
  userId?: number;
  size?: Size;
  linkable?: boolean;
}

export function CommentAvatar({
  username,
  profilePicture = "",
  userId,
  size = "sm",
  linkable = true,
}: Props) {
  const initial = (username ?? "U").charAt(0).toUpperCase();
  const { box, text, ring } = SIZE_CLASSES[size];

  const gradientCls = GRADIENT_MAP[profilePicture] ?? DEFAULT_GRADIENT;
  const hasImage = profilePicture && isCustomPicture(profilePicture);

  const content = hasImage ? (
    <img
      src={profilePicture}
      alt={username ?? "User"}
      className={`${box} rounded-full object-cover ${ring} border-pn-white shadow-[0_2px_6px_rgba(53,88,114,0.18)] bg-pn-bg shrink-0`}
    />
  ) : (
    <div
      className={`${box} rounded-full bg-gradient-to-br ${gradientCls} ${ring} border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] ${text} font-bold text-white shadow-[0_2px_6px_rgba(53,88,114,0.18)] shrink-0 leading-none`}
      aria-label={username ?? "User"}
    >
      {initial}
    </div>
  );

  if (linkable && userId) {
    return (
      <Link to={`/users/${userId}`} className="shrink-0 hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}
