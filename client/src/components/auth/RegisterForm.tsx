import { useState } from "react";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

export function RegisterForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", fullname: "", email: "", password: "", bio: "", profilePicture: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, profilePicture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await authApi.register(form.username, form.fullname, form.email, form.password, form.bio, form.profilePicture, "user");
    setLoading(false);
    if (!res.success || !res.data) { setError(res.message ?? "Registration failed"); return; }
    login(res.data);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center mx-auto mb-4">
          <span className="text-white/60 text-lg">◈</span>
        </div>
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-white/35 mt-1">Register to get started</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Username</label>
          <input type="text" value={form.username} onChange={set("username")} required
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            placeholder="3-40 alphanumeric characters" />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Full name</label>
          <input type="text" value={form.fullname} onChange={set("fullname")}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            placeholder="Your full name" />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Email</label>
          <input type="email" value={form.email} onChange={set("email")} required
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            placeholder="you@example.com" />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Password</label>
          <input type="password" value={form.password} onChange={set("password")} required
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            placeholder="Min 8 chars, 1 uppercase, 1 number" />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Bio <span className="text-white/20">(optional, max 300 chars)</span></label>
          <textarea value={form.bio} onChange={set("bio")} maxLength={300} rows={3}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            placeholder="Tell us a bit about yourself" />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-2 font-medium">Profile picture <span className="text-white/20">(optional)</span></label>
          <input type="file" accept="image/*" onChange={handleFile}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-white/60" />
          {form.profilePicture && (
            <img src={form.profilePicture} alt="Preview" className="mt-2 w-12 h-12 rounded-full object-cover border border-white/10" />
          )}
        </div>

        <button type="submit" disabled={loading}
          className="mt-2 bg-white hover:bg-white/90 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition-colors">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-white/30 text-sm mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-white/60 hover:text-white transition-colors">Sign in</a>
      </p>
    </div>
  );
}
