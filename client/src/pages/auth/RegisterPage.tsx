import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api_services/auth/AuthAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";

type FieldErrors = Partial<Record<"username" | "fullname" | "email" | "password" | "confirmPw", string>>;

function validateClient(form: { username: string; fullname: string; email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.username || form.username.trim() === "") {
    errors.username = "Username is required";
  } else if (form.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (form.username.length > 40) {
    errors.username = "Username must be 40 characters or less";
  } else if (!/^[a-zA-Z0-9-]+$/.test(form.username)) {
    errors.username = "Username can only contain letters, numbers, and hyphens";
  }

  if (!form.fullname || form.fullname.trim() === "") {
    errors.fullname = "Full name is required";
  } else if (form.fullname.length > 150) {
    errors.fullname = "Full name must be 150 characters or less";
  }

  if (!form.email || form.email.trim() === "") {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else {
    const missing: string[] = [];
    if (form.password.length < 8) missing.push("at least 8 characters");
    if (!/[A-Z]/.test(form.password)) missing.push("one uppercase letter");
    if (!/[0-9]/.test(form.password)) missing.push("one number");
    if (missing.length > 0) errors.password = "Password must contain " + missing.join(", ");
  }

  return errors;
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-[5px] text-[0.75rem] text-pn-red mt-1 leading-[1.5]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-[3px]">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
    </div>
  );
}

function OptionalBadge() {
  return (
    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-pn-steel bg-[rgba(53,88,114,0.1)] px-[7px] py-[2px] rounded-full">
      optional
    </span>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-pn-navy mb-[6px]">
        {label} <span className="text-pn-red ml-[2px]">*</span>
      </label>
      {children}
      {error && <ErrorLine message={error} />}
    </div>
  );
}

function passwordStrength(pw: string): { level: number; label: string } {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = ["", "", "Weak", "Fair", "Good", "Strong"];
  return { level: Math.min(score + 1, 5), label: map[score + 1] ?? "" };
}

export default function RegisterPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", fullname: "", email: "", password: "" });
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  }, [isAuthenticated, user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: undefined }));
  };

  const onConfirmPw = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPw(e.target.value);
    setFieldErrors(fe => ({ ...fe, confirmPw: undefined }));
  };

  const handlePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setServerError("Profile picture must be 20 MB or less.");
      return;
    }
    setProfilePictureFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePicture(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const errors = validateClient(form);
    if (!confirmPw) errors.confirmPw = "Password confirmation is required";
    else if (form.password && form.password !== confirmPw) errors.confirmPw = "Passwords do not match";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    const res = await authApi.register(form.username, form.fullname, form.email, form.password, bio, profilePictureFile, "user");
    setLoading(false);
    if (!res.success || !res.data) {
      if (res.field === "username") { setFieldErrors(fe => ({ ...fe, username: res.message })); return; }
      if (res.field === "email")    { setFieldErrors(fe => ({ ...fe, email: res.message })); return; }
      setServerError(res.message ?? "Registration failed");
      return;
    }
    login(res.data);
  };

  const pwStrength = passwordStrength(form.password);

  const inputCls = (err?: string) =>
    `w-full bg-pn-bg border-[1.5px] rounded-[11px] px-4 py-3 text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-muted focus:border-pn-sky focus:shadow-[0_0_0_3px_rgba(122,170,206,0.14)] transition-all ${
      err ? "border-pn-red shadow-[0_0_0_3px_rgba(192,57,43,0.1)]" : "border-pn-border"
    }`;

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy flex flex-col">
      <nav className="bg-[rgba(247,248,240,0.93)] backdrop-blur-[12px] border-b border-pn-border px-7 h-[58px] flex items-center justify-between">
        <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-steel">
          Pulse<span className="text-pn-sky">Net</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pn-white border-[1.5px] border-pn-border hover:border-pn-sky rounded-[10px] text-[0.875rem] font-semibold text-pn-steel transition-all hover:-translate-y-px"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Home
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-[clamp(20px,3vw,40px)]">
        <div className="w-full max-w-[880px] grid grid-cols-[1fr_1fr] rounded-[22px] overflow-hidden border border-pn-border shadow-[0_20px_60px_rgba(53,88,114,0.12)] animate-fade-up max-[640px]:grid-cols-1">
          <div className="bg-pn-steel px-[clamp(28px,3.5vw,40px)] py-[clamp(32px,4vw,52px)] flex flex-col justify-between relative overflow-hidden max-[640px]:hidden">
            <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

            <div className="relative z-1">
              <div className="text-center mb-7">
                <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.75rem] font-bold text-pn-pale inline-block tracking-[-0.01em]">
                  Pulse<span className="text-white">Net</span>
                </Link>
              </div>
              <h2 className="font-['Cormorant_Garamond',serif] text-[1.375rem] font-bold text-white leading-[1.2] mb-2">Join 12,400+ professionals</h2>
              <p className="text-[0.8125rem] text-[rgba(156,213,255,0.82)] leading-[1.6] mb-5 tracking-[0.005em]">Build your network, join communities, and engage in conversations that move your career forward.</p>
              <div className="flex items-center gap-3">
                <div className="flex">
                  {["A","S","P","R"].map((letter, i) => (
                    <div key={i} className={`w-[30px] h-[30px] rounded-full border-2 border-pn-steel flex items-center justify-center text-[0.6875rem] font-bold text-white ${i > 0 ? "-ml-2" : ""}`}
                      style={{ background: i === 0 ? "linear-gradient(135deg,#7AAACE,#355872)" : i === 1 ? "linear-gradient(135deg,#355872,#1A2733)" : i === 2 ? "linear-gradient(135deg,#9CD5FF,#7AAACE)" : "linear-gradient(135deg,#8FABD4,#355872)" }}>
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="text-[0.8125rem] text-[rgba(156,213,255,0.85)] leading-[1.4]"><strong className="text-pn-pale">+47 people</strong> joined this week</span>
              </div>
            </div>

            <div className="relative z-1">
              <div className="flex items-center gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <div className="flex items-baseline gap-[5px]">
                  <span className="text-[0.875rem] font-bold text-pn-pale tabular-nums">840+</span>
                  <span className="text-[0.7rem] text-[rgba(156,213,255,0.7)]">communities</span>
                </div>
                <span className="w-[3px] h-[3px] rounded-full bg-[rgba(156,213,255,0.3)]" />
                <div className="flex items-baseline gap-[5px]">
                  <span className="text-[0.875rem] font-bold text-pn-pale tabular-nums">95k+</span>
                  <span className="text-[0.7rem] text-[rgba(156,213,255,0.7)]">posts shared</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-pn-white px-[clamp(28px,3.5vw,44px)] py-[clamp(28px,3.5vw,44px)] flex flex-col justify-center">
            <h1 className="font-['Cormorant_Garamond',serif] text-[1.375rem] font-bold text-pn-navy leading-[1.15] mb-1">Create account</h1>
            <p className="text-[0.8125rem] text-pn-muted mb-6">Join the leading network for design system professionals</p>

            {serverError && (
              <div className="flex items-start gap-[10px] bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] rounded-[11px] px-[14px] py-3 text-[0.8125rem] text-pn-red mb-[18px] leading-[1.5]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 mt-[1px]"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {serverError}
              </div>
            )}

            <form onSubmit={submit} noValidate className="flex flex-col gap-[14px]">
              <Field id="username" label="Username" error={fieldErrors.username}>
                <input id="username" type="text" value={form.username} onChange={set("username")} className={inputCls(fieldErrors.username)} placeholder="j.walker" />
              </Field>

              <Field id="fullname" label="Full name" error={fieldErrors.fullname}>
                <input id="fullname" type="text" value={form.fullname} onChange={set("fullname")} className={inputCls(fieldErrors.fullname)} placeholder="Jamie Walker" />
              </Field>

              <Field id="email" label="Email address" error={fieldErrors.email}>
                <input id="email" type="email" value={form.email} onChange={set("email")} className={inputCls(fieldErrors.email)} placeholder="you@example.com" />
              </Field>

              <Field id="password" label="Password" error={fieldErrors.password}>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} className={inputCls(fieldErrors.password) + " pr-10"} placeholder="Min 8 characters, 1 uppercase, 1 number" />
                  <span onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-pn-lm cursor-pointer hover:text-pn-steel text-[0.95rem] select-none">👁</span>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`flex-1 h-[3px] rounded ${i <= pwStrength.level - 1 ? (
                          pwStrength.level <= 3 ? "bg-pn-red" : pwStrength.level === 4 ? "bg-[#E67E22]" : "bg-pn-green"
                        ) : "bg-pn-border"}`} />
                      ))}
                    </div>
                    <span className={`text-[0.75rem] font-semibold ${
                      pwStrength.level <= 2 ? "text-pn-red" : pwStrength.level === 3 ? "text-[#B87E20]" : "text-pn-green"
                    }`}>{pwStrength.label}</span>
                  </div>
                )}
              </Field>

              <div>
                <label className="block text-[0.8125rem] font-medium text-pn-navy mb-[6px]">
                  Confirm password <span className="text-pn-red ml-[2px]">*</span>
                </label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPw} onChange={onConfirmPw}
                    className={inputCls(fieldErrors.confirmPw) + " pr-10"} placeholder="Repeat your password" />
                  <span onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-pn-lm cursor-pointer hover:text-pn-steel text-[0.95rem] select-none">👁</span>
                </div>
                {fieldErrors.confirmPw
                  ? <ErrorLine message={fieldErrors.confirmPw} />
                  : <div className="text-[0.75rem] text-pn-muted mt-1">Must match the password above.</div>
                }
              </div>

              <div>
                <label className="flex items-center justify-between text-[0.8125rem] font-medium text-pn-navy mb-[6px]">
                  <span className="flex items-center gap-2">
                    Bio
                    <OptionalBadge />
                  </span>
                  <span className="text-[0.75rem] font-normal text-pn-muted tabular-nums">{bio.length} / 300</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 300))}
                  rows={3}
                  className="w-full bg-pn-bg border-[1.5px] border-pn-border rounded-[11px] px-4 py-3 text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-muted focus:border-pn-sky focus:shadow-[0_0_0_3px_rgba(122,170,206,0.14)] transition-all resize-y leading-[1.6]"
                  placeholder="Tell others a little about yourself…"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[0.8125rem] font-medium text-pn-navy mb-[6px]">
                  Profile picture
                  <OptionalBadge />
                </label>
                <div className="flex items-center gap-4">
                  <label className="relative w-[64px] h-[64px] rounded-full cursor-pointer shrink-0 border-[2px] border-dashed border-pn-border hover:border-pn-sky transition-colors overflow-hidden flex items-center justify-center bg-pn-bg">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pn-lm">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                    <input type="file" accept="image/*" onChange={handlePicture} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </label>
                  <div className="text-[0.75rem] text-pn-muted leading-[1.5]">
                    {profilePicture ? (
                      <button type="button" onClick={() => { setProfilePicture(""); setProfilePictureFile(null); }} className="text-[#9B3A3A] font-semibold hover:underline cursor-pointer">Remove</button>
                    ) : (
                      <>Click the circle to upload.<br />PNG or JPG up to 20 MB.</>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-pn-steel text-white font-semibold text-[0.875rem] py-3 rounded-[11px] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(53,88,114,0.24)] hover:bg-[#2a4760] hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(53,88,114,0.3)] transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><div className="w-4 h-4 border-2.5 border-[rgba(255,255,255,0.35)] border-t-white rounded-full animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>

            <div className="flex flex-col gap-2 mt-4">
              <p className="text-[0.75rem] text-pn-muted text-center leading-[1.55]">
                By creating an account you agree to PulseNet's terms.
              </p>
              <p className="text-center text-[0.8125rem] text-pn-muted">
                Already have an account? <Link to="/login" className="text-pn-steel font-semibold hover:underline">Sign in →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
