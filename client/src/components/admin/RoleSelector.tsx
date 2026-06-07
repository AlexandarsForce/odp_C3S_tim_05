import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Shield, User, ChevronDown, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Role = "user" | "admin";

const ROLE_META: Record<Role, {
  Icon: LucideIcon;
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  admin: {
    Icon: Shield,
    label: "Admin",
    textClass: "text-[#7c6fc4]",
    bgClass: "bg-[rgba(124,111,196,0.1)]",
    borderClass: "border-[rgba(124,111,196,0.3)]",
    dotClass: "bg-[#7c6fc4]",
  },
  user: {
    Icon: User,
    label: "User",
    textClass: "text-pn-sky",
    bgClass: "bg-[rgba(125,211,252,0.15)]",
    borderClass: "border-[rgba(87,178,214,0.35)]",
    dotClass: "bg-pn-sky",
  },
};

export function RoleSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (role: string) => void;
}) {
  const current = ROLE_META[(value as Role)] ?? ROLE_META.user;
  const { Icon } = current;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`inline-flex items-center gap-[7px] text-[0.78rem] font-semibold px-[10px] py-[5px] rounded-lg border outline-none cursor-pointer transition-colors hover:brightness-[0.97] ${current.textClass} ${current.bgClass} ${current.borderClass}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-[400] min-w-[160px] bg-pn-white border border-pn-border rounded-xl shadow-[0_8px_28px_rgba(26,39,51,0.12)] p-1 font-['DM_Sans',sans-serif]"
        >
          {(["user", "admin"] as Role[]).map((role) => {
            const meta = ROLE_META[role];
            const RoleIcon = meta.Icon;
            const isActive = value === role;
            return (
              <DropdownMenu.Item
                key={role}
                onSelect={() => onChange(role)}
                className={`flex items-center gap-[10px] px-[10px] py-[8px] rounded-lg text-[0.82rem] outline-none cursor-pointer transition-colors hover:bg-[rgba(53,88,114,0.06)] ${isActive ? "bg-[rgba(53,88,114,0.04)]" : ""}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-md ${meta.bgClass} ${meta.textClass} shrink-0`}>
                  <RoleIcon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <div className={`text-[0.82rem] font-semibold ${meta.textClass}`}>{meta.label}</div>
                  <div className="text-[0.68rem] text-pn-lm leading-tight mt-[1px]">
                    {role === "admin" ? "Full system access" : "Standard account"}
                  </div>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 text-pn-steel shrink-0" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
