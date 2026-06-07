import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminTable, AdminPagination } from "../../components/admin/AdminTable";
import { AdminToolbar } from "../../components/admin/Toolbar";
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

  const adminCount = users.filter((u) => u.role === "admin").length;

  const filtered = users
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => !search || u.username.includes(search) || u.email.includes(search));

  return (
    <AdminLayout>
      <div className="mb-[22px]">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[10px]">
          <Link to="/admin" className="text-pn-lm hover:text-pn-steel">Admin</Link>
          <span>›</span>
          <span style={{ color: "var(--color-pn-steel)", fontWeight: 600 }}>Users</span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-pn-navy mb-1">Users</h1>
        <p className="text-[0.875rem] text-pn-muted">All registered accounts — manage roles, view profiles, delete users.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 max-w-[420px]">
        <div className="bg-pn-white border border-pn-border rounded-[16px] px-[18px] py-4">
          <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-pn-lm mb-[6px]">Total Users</div>
          <div className="font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-pn-navy leading-none mb-1">{total.toLocaleString()}</div>
          <div className="text-[0.72rem] text-pn-muted">accounts in the system</div>
        </div>
        <div className="bg-pn-white border border-pn-border rounded-[16px] px-[18px] py-4">
          <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-pn-lm mb-[6px]">Admins (page)</div>
          <div className="font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-pn-navy leading-none mb-1">{adminCount}</div>
          <div className="text-[0.72rem] text-pn-muted">on this page</div>
        </div>
      </div>

      {error && (
        <div className="rounded-[14px] px-[18px] py-[12px] mb-4 bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] text-[0.85rem] text-[#9B3A3A]">
          {error}
        </div>
      )}

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
        resultCount={`${total} users`}
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
              <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="bg-pn-surface border border-pn-border rounded-lg text-[0.78rem] px-[10px] py-[5px] text-pn-navy outline-none font-['DM_Sans',sans-serif] cursor-pointer focus:border-pn-sky">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
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
    </AdminLayout>
  );
}
