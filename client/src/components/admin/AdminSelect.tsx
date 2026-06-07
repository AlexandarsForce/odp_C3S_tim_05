import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

export type AdminSelectOption = { value: string; label: string };

export function AdminSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  triggerClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  triggerClassName?: string;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-between gap-3 min-w-[150px] bg-pn-white border border-pn-border rounded-[10px] px-[14px] py-[10px] text-[0.82rem] font-medium text-pn-navy outline-none cursor-pointer transition-colors hover:border-pn-steel data-[state=open]:border-pn-steel data-[state=open]:shadow-[0_0_0_3px_rgba(53,88,114,0.1)] font-['DM_Sans',sans-serif] ${triggerClassName}`}
        >
          <span>{current?.label ?? placeholder}</span>
          <ChevronDown
            className="h-4 w-4 text-pn-lm transition-transform duration-200 data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-[400] min-w-[--radix-dropdown-menu-trigger-width] bg-pn-white border border-pn-border rounded-[10px] shadow-[0_10px_30px_rgba(26,39,51,0.12)] p-[5px] font-['DM_Sans',sans-serif] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={() => onChange(opt.value)}
                className={`flex items-center justify-between gap-3 px-[10px] py-[8px] rounded-[7px] text-[0.82rem] outline-none cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[rgba(53,88,114,0.1)] text-pn-steel font-semibold"
                    : "text-pn-navy hover:bg-[rgba(53,88,114,0.06)] data-[highlighted]:bg-[rgba(53,88,114,0.06)] font-medium"
                }`}
              >
                <span>{opt.label}</span>
                {isActive && <Check className="h-[14px] w-[14px] text-pn-steel shrink-0" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
