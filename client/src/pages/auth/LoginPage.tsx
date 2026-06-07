import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api_services/auth/AuthAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";

type LoginErrors = Partial<Record<"username" | "password", string>>;

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-[5px] text-[0.73rem] text-pn-red mt-1 leading-[1.5]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-[3px]">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  }, [isAuthenticated, user, navigate]);

  const inputCls = (err?: string) =>
    `w-full bg-pn-bg border-[1.5px] rounded-[11px] px-4 py-3 text-[0.9rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky focus:bg-pn-white focus:shadow-[0_0_0_4px_rgba(122,170,206,0.24)] transition-all ${
      err ? "border-pn-red shadow-[0_0_0_3px_rgba(192,57,43,0.1)]" : "border-pn-border"
    }`;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const errors: LoginErrors = {};
    if (!username || username.trim() === "") errors.username = "Username is required";
    if (!password) errors.password = "Password is required";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    const res = await authApi.login(username, password);
    setLoading(false);
    if (!res.success || !res.data) { setServerError(res.message ?? "Invalid credentials"); return; }
    login(res.data);
  };

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

      <div className="flex-1 flex items-center justify-center px-6 py-[clamp(24px,4vw,48px)]">
        <div className="w-full max-w-[780px] grid grid-cols-[1fr_1.15fr] rounded-[22px] overflow-hidden border border-pn-border shadow-[0_20px_60px_rgba(53,88,114,0.12)] animate-fade-up max-[580px]:grid-cols-1">

          {/* ── Left panel ── */}
          <div className="bg-pn-steel px-[clamp(28px,3.5vw,40px)] py-[clamp(32px,4vw,52px)] flex flex-col relative overflow-hidden max-[580px]:hidden">
            <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

            {/* Logo — centered */}
            <div className="relative z-1 flex justify-center mb-[clamp(28px,3.5vw,44px)]">
              <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.65rem] font-bold text-pn-pale tracking-[-0.01em]">
                Pulse<span className="text-white">Net</span>
              </Link>
            </div>

            {/* Main content — vertically centered */}
            <div className="relative z-1 flex-1 flex flex-col justify-center gap-5">
              <div>
                <h2 className="font-['Cormorant_Garamond',serif] text-[1.05rem] font-semibold text-[#A8C8E0] leading-[1.3] mb-3">
                  Good to have you back
                </h2>
                <p className="text-[0.84rem] text-[rgba(196,230,255,0.92)] leading-[1.65]">
                  Your communities are waiting. Pick up right where you left off.
                </p>
              </div>

              {/* Quote card — clean glass, no italic, DM Sans */}
              <div className="rounded-[14px] p-[18px_20px] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.06) 100%)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(8px)",
                }}>
                {/* Subtle inner highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
                <p className="font-['DM_Sans',sans-serif] text-[0.83rem] text-[rgba(220,240,255,0.93)] leading-[1.65] mb-[14px]">
                  "PulseNet is the only place where design system discussions are actually signal, not noise. I open it every morning."
                </p>
                <div className="flex items-center gap-[10px]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pn-sky to-[#2a4760] flex items-center justify-center text-[0.72rem] font-bold text-white shrink-0">P</div>
                  <div>
                    <div className="text-[0.78rem] font-semibold text-white">Priya Nair</div>
                    <div className="text-[0.7rem] text-[rgba(156,213,255,0.6)]">Design Systems · Figma</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bullets — anchored to bottom */}
            <div className="relative z-1 mt-[clamp(24px,3vw,40px)]">
              <div className="flex flex-col gap-[9px]">
                {["Your feed, updated in real-time", "Signal over noise, always"].map((t) => (
                  <div key={t} className="flex items-center gap-[9px]">
                    <span className="w-[5px] h-[5px] rounded-full bg-pn-sky shrink-0" />
                    <span className="text-[0.77rem] text-[rgba(156,213,255,0.72)]">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="bg-pn-white px-[clamp(28px,3.5vw,44px)] py-[clamp(32px,4vw,52px)] flex flex-col justify-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-pn-sky mb-[7px]">Welcome back</p>
            <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.7rem,2.5vw,2.1rem)] font-bold text-pn-navy leading-[1.1] mb-2">Sign in</h1>
            <p className="text-[0.84rem] text-pn-muted mb-8 leading-[1.55]">Sign in to pick up where you left off.</p>

            {serverError && (
              <div className="flex items-start gap-[10px] bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] rounded-[11px] px-[14px] py-3 text-[0.82rem] text-[#9B3A3A] mb-[18px] leading-[1.5]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 mt-[1px]"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {serverError}
              </div>
            )}

            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <div>
                <label className="block text-[0.8rem] font-semibold text-pn-steel mb-[6px]">
                  Username <span className="text-pn-red ml-[2px]">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setFieldErrors(fe => ({ ...fe, username: undefined })); }}
                  className={inputCls(fieldErrors.username)}
                  placeholder="Your username"
                />
                {fieldErrors.username && <ErrorLine message={fieldErrors.username} />}
              </div>

              <div>
                <label className="block text-[0.8rem] font-semibold text-pn-steel mb-[6px]">
                  Password <span className="text-pn-red ml-[2px]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({ ...fe, password: undefined })); }}
                    className={inputCls(fieldErrors.password) + " pr-10"}
                    placeholder="Your password"
                  />
                  <span onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-pn-lm cursor-pointer hover:text-pn-steel text-[1rem] select-none">👁</span>
                </div>
                {fieldErrors.password && <ErrorLine message={fieldErrors.password} />}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-pn-steel text-white font-semibold text-[0.95rem] py-3 rounded-[11px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(53,88,114,0.16)] hover:bg-[#2a4760] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(53,88,114,0.22)] transition-all mt-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.35)] border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>

            <div className="flex items-center gap-[10px] my-6 text-[0.72rem] text-pn-lm">
              <div className="flex-1 h-px bg-pn-border" />
              <span>or</span>
              <div className="flex-1 h-px bg-pn-border" />
            </div>

            <p className="text-center text-[0.8rem] text-pn-lm">
              Don't have an account? <Link to="/register" className="text-pn-steel font-semibold hover:underline">Create one free →</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
