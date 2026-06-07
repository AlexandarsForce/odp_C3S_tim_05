import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users as UsersIcon, AlertCircle, RefreshCw } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PageHeaderPill } from "../../components/admin/PageHeaderPill";
import { AdminKpiCard } from "../../components/admin/AdminKpiCard";
import { AdminTable, AdminPagination } from "../../components/admin/AdminTable";
import { AdminToolbar } from "../../components/admin/Toolbar";
import { RoleSelector } from "../../components/admin/RoleSelector";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { UserDto } from "../../models/user/UserTypes";

const roleGradients: Record<string, string> = {
  admin: "from-pn-admin to-pn-sky",
  user: "from-pn-sky to-pn-steel",
  guest: "from-pn-lm to-pn-steel",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.getAllUsers(page, limit);
    if (res.success && res.data) {
      setUsers(res.data.items);
      setTotal(res.data.total);
    } else {
      setError(res.message || "Failed to load users.");
      setUsers([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: number, role: string) => {
    const r = await adminApi.updateUserRole(userId, role);
    if (r.success) fetchUsers();
    else setError(r.message || "Failed to update role.");
  };

  const handleDelete = async (userId: number) => {
    const r = await adminApi.deleteUser(userId);
    if (r.success) fetchUsers();
    else setError(r.message || "Failed to delete user.");
  };

  const filtered = users
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => !search || u.username.includes(search) || u.email.includes(search));

  return (
    <AdminLayout>

      {/* ── SCENARIO A: Error ─────────────────────────────────────── */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center select-none">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute rounded-full bg-[rgba(180,60,60,0.1)]" style={{ width: "6rem", height: "6rem" }} />
            <div className="absolute rounded-full bg-[rgba(180,60,60,0.15)]" style={{ width: "4.5rem", height: "4.5rem" }} />
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(180,60,60,0.1)] border border-[rgba(180,60,60,0.2)]">
              <AlertCircle className="h-6 w-6 text-[#9B3A3A]" />
            </div>
          </div>
          <h3 className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[6px]">
            Failed to load users
          </h3>
          <p className="text-[0.82rem] text-pn-muted leading-[1.65] max-w-[260px] mb-6">
            There was a problem fetching data from the server. Check your connection and try again.
          </p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] px-5 py-[9px] rounded-[10px] hover:bg-[rgba(180,60,60,0.13)] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>

      ) : (
      /* ── SCENARIO B: Normal ────────────────────────────────────── */
      <>
        <PageHeaderPill
          label="Users"
          dotClass="bg-pn-sky"
          textClass="text-pn-sky"
        />

        <AdminKpiCard
          Icon={UsersIcon}
          label="Total Users"
          value={total.toLocaleString()}
          accentHex="#7DD3FC"
        />

        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          filters={[
            {
              value: roleFilter, label: "Role",
              onChange: setRoleFilter,
              options: [
                { value: "all", label: "All roles" },
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            },
          ]}
        />

        <AdminTable columns={["User", "Email", "Role", "Joined", "Actions"]}>
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[0.85rem] text-pn-muted">Loading users…</td>
            </tr>
          )}

          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[0.85rem] text-pn-muted">
                {search || roleFilter !== "all" ? "No matching users." : "No users found."}
              </td>
            </tr>
          )}

          {!loading && filtered.map((u) => (
            <tr key={u.id} className="border-b border-pn-surface last:border-b-0 hover:bg-[rgba(53,88,114,0.025)]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-[10px]">
                  <div className={`w-[34px] h-[34px] rounded-full bg-gradient-to-br ${roleGradients[u.role] ?? "from-pn-sky to-pn-steel"} flex items-center justify-center text-[0.82rem] font-bold text-white shrink-0`}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[0.9rem] font-semibold text-pn-navy">{u.username}</div>
                    <div className="text-[0.72rem] text-pn-lm">#{u.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-pn-muted">{u.email}</td>
              <td className="px-4 py-3">
                <RoleSelector value={u.role} onChange={(role) => handleRoleChange(u.id, role)} />
              </td>
              <td className="px-4 py-3 text-[0.8rem] text-pn-lm">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-[7px] items-center">
                  <Link to={`/profile/${u.id}`}
                    className="text-[0.75rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.15)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(53,88,114,0.15)] transition-colors">View</Link>
                  <button onClick={() => handleDelete(u.id)}
                    className="text-[0.75rem] font-semibold text-pn-red bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.18)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(180,60,60,0.14)] transition-colors cursor-pointer">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
        {!loading && total > 0 && <AdminPagination page={page} total={total} limit={limit} onChange={setPage} />}
      </>
      )}

    </AdminLayout>
  );
}
