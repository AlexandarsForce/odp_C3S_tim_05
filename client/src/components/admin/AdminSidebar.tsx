import { Link, useLocation } from "react-router-dom";

type SidebarItem = { to: string; icon: string; label: string };
type SidebarSection = { label: string; items: SidebarItem[] };

const sections: SidebarSection[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", icon: "⬛", label: "Dashboard" }],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/communities", icon: "🏛", label: "Communities" },
      { to: "/admin/tags", icon: "🏷", label: "Tags" },
    ],
  },
  {
    label: "People",
    items: [{ to: "/admin/users", icon: "👤", label: "Users" }],
  },
  {
    label: "System",
    items: [
      { to: "/admin/health", icon: "❤", label: "DB Health" },
      { to: "/admin/audit", icon: "📋", label: "Audit Log" },
    ],
  },
];

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-[86px] max-md:hidden">
      {sections.map((sec) => (
        <div key={sec.label} className="mb-6">
          <div className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-pn-lm px-[10px] mb-[6px]">{sec.label}</div>
          {sec.items.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link key={item.label} to={item.to}
                className={`flex items-center gap-[9px] px-[10px] py-[9px] rounded-[10px] text-[0.875rem] font-medium transition-colors ${
                  isActive ? "bg-[rgba(53,88,114,0.1)] text-pn-steel font-semibold" : "text-pn-muted hover:bg-[rgba(53,88,114,0.07)] hover:text-pn-steel"
                }`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
