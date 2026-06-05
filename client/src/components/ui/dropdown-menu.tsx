import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className = "", sideOffset = 8, align = "end", ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={
        "z-50 min-w-[210px] overflow-hidden rounded-xl bg-pn-white border border-pn-border shadow-[0_14px_36px_rgba(53,88,114,0.16)] " +
        "origin-[var(--radix-dropdown-menu-content-transform-origin)] transition-all duration-200 ease-out " +
        "data-[state=open]:opacity-100 data-[state=open]:translate-y-0 data-[state=open]:scale-100 " +
        "data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-1 data-[state=closed]:scale-95 " +
        className
      }
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={
      "flex items-center gap-[10px] w-full text-left px-3 py-[7px] text-[0.83rem] text-pn-navy " +
      "outline-none cursor-pointer transition-colors focus:bg-[rgba(122,170,206,0.12)] " +
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 " +
      className
    }
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={"h-px my-[5px] bg-pn-border " + className}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
