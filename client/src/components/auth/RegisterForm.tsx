import { useState } from "react";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

type FieldErrors = Partial<Record<"username" | "fullname" | "email" | "password" | "bio" | "profilePicture", string>>;

function validateClient(form: { username: string; fullname: string; email: string; password: string; bio: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.username || form.username.trim().length < 3 || form.username.length > 40 || !/^[a-zA-Z0-9-]+$/.test(form.username))
    errors.username = "Username must be 3–40 alphanumeric characters (hyphens allowed)";
  if (form.fullname && form.fullname.length > 400)
    errors.fullname = "Full name must be 400 characters or less";
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address";
  if (!form.password || form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password))
    errors.password = "Password must be 8+ characters with at least one uppercase letter and one number";
  if (form.bio && form.bio.trim().length > 300)
    errors.bio = "Bio must be 300 characters or less";
  return errors;
}

export function RegisterForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", fullname: "", email: "", password: "", bio: "", profilePicture: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: undefined }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldErrors(fe => ({ ...fe, profilePicture: "Only image files are allowed" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(fe => ({ ...fe, profilePicture: "Image must be smaller than 5 MB" }));
      return;
    }
    setFieldErrors(fe => ({ ...fe, profilePicture: undefined }));
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, profilePicture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const errors = validateClient(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    const res = await authApi.register(form.username, form.fullname, form.email, form.password, form.bio, form.profilePicture, "user");
    setLoading(false);

    if (!res.success || !res.data) {
      setServerError(res.message ?? "Registration failed");
      return;
    }
    login(res.data);
  };

  const Field = ({ id, label, optional, error, children }: { id: string; label: string; optional?: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="block text-xs text-white/40 mb-2 font-medium">
        {label}{optional && <span className="text-white/20"> ({optional})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full bg-white/4 border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-colors ${err ? "border-red-500/50 focus:border-red-400" : "border-white/10 focus:border-white/30"}`;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center mx-auto mb-4">
          <span className="text-white/60 text-lg">◈</span>
        </div>
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-white/35 mt-1">Register to get started</p>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
          {serverError}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="username" label="Username" error={fieldErrors.username}>
          <input id="username" type="text" value={form.username} onChange={set("username")} required
            className={inputCls(fieldErrors.username)} placeholder="3–40 alphanumeric characters" />
        </Field>

        <Field id="fullname" label="Full name" optional="optional, max 400 chars" error={fieldErrors.fullname}>
          <input id="fullname" type="text" value={form.fullname} onChange={set("fullname")} maxLength={400}
            className={inputCls(fieldErrors.fullname)} placeholder="Your full name" />
        </Field>

        <Field id="email" label="Email" error={fieldErrors.email}>
          <input id="email" type="email" value={form.email} onChange={set("email")} required
            className={inputCls(fieldErrors.email)} placeholder="you@example.com" />
        </Field>

        <Field id="password" label="Password" error={fieldErrors.password}>
          <input id="password" type="password" value={form.password} onChange={set("password")} required
            className={inputCls(fieldErrors.password)} placeholder="Min 8 chars, 1 uppercase, 1 number" />
        </Field>

        <Field id="bio" label="Bio" optional="optional, max 300 chars" error={fieldErrors.bio}>
          <textarea id="bio" value={form.bio} onChange={set("bio")} maxLength={300} rows={3}
            className={inputCls(fieldErrors.bio) + " resize-none"}
            placeholder="Tell us a bit about yourself" />
        </Field>

        <Field id="profilePicture" label="Profile picture" optional="optional, max 5 MB" error={fieldErrors.profilePicture}>
          <input id="profilePicture" type="file" accept="image/*" onChange={handleFile}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-white/60" />
          {form.profilePicture && (
            <img src={form.profilePicture} alt="Preview" className="mt-2 w-12 h-12 rounded-full object-cover border border-white/10" />
          )}
        </Field>

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
