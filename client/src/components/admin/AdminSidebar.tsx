import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Tag, Users, Activity, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarItem = { to: string; Icon: LucideIcon; label: string };
type SidebarSection = { label: string; items: SidebarItem[] };

const sections: SidebarSection[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", Icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/communities", Icon: Building2, label: "Communities" },
      { to: "/admin/tags", Icon: Tag, label: "Tags" },
    ],
  },
  {
    label: "People",
    items: [{ to: "/admin/users", Icon: Users, label: "Users" }],
  },
  {
    label: "System",
    items: [
      { to: "/admin/health", Icon: Activity, label: "DB Health" },
      { to: "/admin/audit", Icon: ClipboardList, label: "Audit Log" },
    ],
  },
];

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-[86px] max-md:hidden">
      {sections.map((sec) => (
        <div key={sec.label} className="mb-6">
          <div className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-pn-lm px-[10px] mb-[6px]">
            {sec.label}
          </div>
          {sec.items.map(({ to, Icon, label }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-[9px] px-[10px] py-[9px] rounded-[10px] text-[0.875rem] font-medium transition-colors duration-150 border-l-[3px] cursor-pointer ${
                  isActive
                    ? "border-pn-steel bg-[rgba(53,88,114,0.1)] text-pn-steel font-semibold"
                    : "border-transparent text-pn-muted hover:bg-[rgba(53,88,114,0.07)] hover:text-pn-steel"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
