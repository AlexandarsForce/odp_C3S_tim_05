import type { ReactNode } from "react";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AdminNavbar />
      <div className="max-w-[1280px] mx-auto px-7 py-9 grid grid-cols-[220px_1fr] gap-7 items-start max-md:grid-cols-1 pb-20">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}
