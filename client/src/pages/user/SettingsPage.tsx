import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { usersApi } from "../../api_services/users/UsersAPIService";

const GRADIENTS = [
  { key: "gradient:sky-steel",  cls: "from-pn-sky to-pn-steel",  label: "Sky" },
  { key: "gradient:steel-navy", cls: "from-pn-steel to-pn-navy", label: "Steel" },
  { key: "gradient:pale-sky",   cls: "from-pn-pale to-pn-sky",   label: "Pale" },
  { key: "gradient:lm-steel",   cls: "from-pn-lm to-pn-steel",   label: "Mist" },
  { key: "gradient:navy-sky",   cls: "from-pn-navy to-pn-sky",   label: "Midnight" },
  { key: "gradient:green-navy", cls: "from-pn-green to-pn-navy", label: "Pine" },
];

const SECTIONS = [
  { id: "identity",  label: "Identity",  icon: "person" },
  { id: "avatar",    label: "Avatar",    icon: "palette" },
  { id: "bio",       label: "Bio",       icon: "quote" },
  { id: "account",   label: "Account",   icon: "key" },
  { id: "danger",    label: "Sign Out",  icon: "logout" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const BIO_MAX = 500;
const MAX_PICTURE_BYTES = 20 * 1024 * 1024;

const isCustomPicture = (s: string) =>
  s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://");

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarKey, setAvatarKey] = useState<string>(GRADIENTS[0].key);
  const [customPicture, setCustomPicture] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");

  const [originalSnapshot, setOriginalSnapshot] = useState({ fullname: "", email: "", bio: "", avatarKey: GRADIENTS[0].key, customPicture: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<SectionId>("identity");

  const sectionRefs = useRef<Record<SectionId, HTMLElement | undefined>>({
    identity: undefined, avatar: undefined, bio: undefined, account: undefined, danger: undefined,
  });

  useEffect(() => {
    if (!user) return;
    usersApi.getById(user.id).then((r) => {
      if (r.success && r.data) {
        const fn = r.data.fullname ?? "";
        const em = r.data.email ?? "";
        const b  = r.data.bio ?? "";
        const pp = r.data.profilePicture ?? "";
        const custom = isCustomPicture(pp) ? pp : "";
        const ak = !custom ? (GRADIENTS.find((g) => g.key === pp)?.key ?? GRADIENTS[0].key) : GRADIENTS[0].key;
        setFullname(fn);
        setEmail(em);
        setBio(b);
        setAvatarKey(ak);
        setCustomPicture(custom);
        setOriginalSnapshot({ fullname: fn, email: em, bio: b, avatarKey: ak, customPicture: custom });
        if (r.data.createdAt) setCreatedAt(r.data.createdAt);
      }
      setLoading(false);
    });
  }, [user]);

  const dirty = useMemo(() => (
    fullname !== originalSnapshot.fullname ||
    email    !== originalSnapshot.email    ||
    bio      !== originalSnapshot.bio      ||
    avatarKey !== originalSnapshot.avatarKey ||
    customPicture !== originalSnapshot.customPicture
  ), [fullname, email, bio, avatarKey, customPicture, originalSnapshot]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(undefined), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveSection(visible[0].target.id as SectionId);
    }, { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });

    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSave = async () => {
    if (!user || !dirty || saving) return;
    setSaving(true);
    const profilePicture = customPicture || avatarKey;
    const r = await usersApi.updateMe({
      username: user.username,
      fullname,
      email,
      bio,
      profilePicture,
    });
    setSaving(false);
    if (r.success) {
      setOriginalSnapshot({ fullname, email, bio, avatarKey, customPicture });
      setSavedFlash(true);
      setToast({ kind: "success", msg: "Profile updated" });
      setTimeout(() => setSavedFlash(false), 1500);
      refreshUser();
    } else {
      setToast({ kind: "error", msg: r.message || "Failed to save changes" });
    }
  };

  const handleRevert = () => {
    setFullname(originalSnapshot.fullname);
    setEmail(originalSnapshot.email);
    setBio(originalSnapshot.bio);
    setAvatarKey(originalSnapshot.avatarKey);
    setCustomPicture(originalSnapshot.customPicture);
  };

  const handlePictureFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setToast({ kind: "error", msg: "Only image files are allowed." });
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      setToast({ kind: "error", msg: "Image must be 20 MB or less." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCustomPicture(reader.result);
    };
    reader.onerror = () => setToast({ kind: "error", msg: "Could not read the image." });
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => setCustomPicture("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentGradient = GRADIENTS.find((g) => g.key === avatarKey) ?? GRADIENTS[0];
  const initial = (user?.username ?? "U").charAt(0).toUpperCase();
  const bioPct = Math.min(100, (bio.length / BIO_MAX) * 100);
  const bioRingColor = bioPct < 80 ? "stroke-pn-sky" : bioPct < 95 ? "stroke-amber-500" : "stroke-pn-red";

  if (loading) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="h-[160px] rounded-[24px] animate-shimmer bg-pn-white border border-pn-border" />
          <div className="mt-6 grid grid-cols-[230px_1fr] gap-7 max-md:grid-cols-1">
            <div className="h-[260px] rounded-[20px] animate-shimmer bg-pn-white border border-pn-border" />
            <div className="space-y-4">
              <div className="h-[180px] rounded-[20px] animate-shimmer bg-pn-white border border-pn-border" />
              <div className="h-[180px] rounded-[20px] animate-shimmer bg-pn-white border border-pn-border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      {/* HERO with live preview */}
      <div className="relative overflow-hidden border-b border-pn-border">
        <div className="absolute inset-0 animate-aurora bg-[linear-gradient(120deg,#1A2733_0%,#355872_30%,#7AAACE_55%,#9CD5FF_75%,#355872_100%)] opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_85%_-10%,rgba(156,213,255,0.35),transparent_60%),radial-gradient(800px_300px_at_5%_120%,rgba(122,170,206,0.35),transparent_60%)] pointer-events-none" />

        <div className="relative max-w-[1100px] mx-auto px-6 pt-9 pb-12 flex items-center gap-7 flex-wrap">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-white/20 blur-2xl" />
            {customPicture ? (
              <img
                src={customPicture}
                alt="Profile preview"
                className="relative w-[120px] h-[120px] rounded-full object-cover border-[4px] border-white/80 shadow-[0_18px_50px_rgba(15,30,46,0.35)] animate-ring-glow bg-pn-bg"
              />
            ) : (
              <div className={`relative w-[120px] h-[120px] rounded-full bg-gradient-to-br ${currentGradient.cls} border-[4px] border-white/80 flex items-center justify-center font-['Cormorant_Garamond',serif] text-[3rem] font-bold text-white shadow-[0_18px_50px_rgba(15,30,46,0.35)] animate-ring-glow`}>
                {initial}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-pn-steel flex items-center justify-center text-[0.78rem] font-bold shadow-md border border-pn-border" title="Live preview">
              ✦
            </span>
          </div>

          <div className="flex-1 min-w-[260px] text-white">
            <div className="inline-flex items-center gap-2 px-3 py-[5px] rounded-full bg-white/15 backdrop-blur border border-white/25 text-[0.72rem] font-semibold uppercase tracking-wider mb-3">
              <span className="w-[6px] h-[6px] rounded-full bg-pn-pale animate-pulse-dot" />
              Live preview
            </div>
            <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(2rem,4vw,2.8rem)] font-bold leading-[1.05] drop-shadow-[0_2px_18px_rgba(0,0,0,0.25)]">
              {fullname || user?.username || "Your Name"}
            </h1>
            <div className="text-[0.92rem] text-white/85 mt-1">
              @{user?.username ?? "user"}
              {createdAt && <> · Member since {formatDate(createdAt)}</>}
            </div>
            <p className="text-[0.92rem] text-white/85 leading-[1.65] mt-3 max-w-[560px] line-clamp-3">
              {bio || <span className="italic text-white/65">Add a short bio so the network knows who you are.</span>}
            </p>
          </div>

          <div className="flex flex-col gap-2 ml-auto">
            <Link to="/profile/me"
              className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-pn-steel font-semibold text-[0.85rem] px-4 py-[10px] rounded-xl border border-white/40 shadow-[0_10px_30px_rgba(15,30,46,0.18)] transition-all">
              View public profile →
            </Link>
            {dirty && (
              <button onClick={handleRevert}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-[0.78rem] px-4 py-[7px] rounded-xl border border-white/25 transition-all cursor-pointer">
                ↺ Revert changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-[1100px] mx-auto px-6 py-9 pb-32 grid grid-cols-[230px_1fr] gap-7 items-start max-md:grid-cols-1">
        {/* STICKY TOC */}
        <nav className="sticky top-[86px] max-md:hidden">
          <div className="text-[0.68rem] font-bold tracking-wider uppercase text-pn-lm mb-2 px-[10px]">Settings</div>
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            const isDanger = s.id === "danger";
            return (
              <button key={s.id} onClick={() => scrollToSection(s.id)}
                className={`group flex items-center gap-[10px] w-full px-3 py-[9px] rounded-lg text-[0.875rem] font-medium mb-[2px] cursor-pointer transition-all relative ${
                  isActive
                    ? isDanger
                      ? "bg-[rgba(155,58,58,0.1)] text-pn-red font-semibold"
                      : "bg-[rgba(53,88,114,0.1)] text-pn-steel font-semibold"
                    : isDanger
                      ? "text-pn-red/70 hover:bg-[rgba(155,58,58,0.06)]"
                      : "text-pn-muted hover:bg-[rgba(53,88,114,0.06)] hover:text-pn-steel"
                }`}>
                {isActive && !isDanger && (
                  <span aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-pn-sky rounded-r-full shadow-[0_0_10px_rgba(122,170,206,0.6)]" />
                )}
                <SectionIcon name={s.icon} className="shrink-0" />
                {s.label}
                {isActive && !isDanger && <span className="ml-auto w-[6px] h-[6px] rounded-full bg-pn-sky animate-pulse-dot" />}
              </button>
            );
          })}
          {dirty && (
            <div className="mt-4 rounded-xl border border-pn-border bg-pn-white p-3 text-[0.78rem] text-pn-muted">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-[7px] h-[7px] rounded-full bg-amber-500 animate-pulse-dot" />
                <span className="font-semibold text-pn-navy">Unsaved changes</span>
              </div>
              <p className="leading-[1.5]">Hit <span className="font-semibold text-pn-steel">Save</span> below to keep them.</p>
            </div>
          )}
        </nav>

        {/* SECTIONS */}
        <div className="space-y-5">
          {/* IDENTITY */}
          <section
            id="identity"
            ref={(el) => { sectionRefs.current.identity = el; }}
            className="scroll-mt-[86px] bg-pn-white border border-pn-border rounded-[22px] p-7 shadow-[0_6px_22px_rgba(53,88,114,0.06)] animate-fade-up"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-steel">Section · 01</span>
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-1">Identity</div>
            <p className="text-[0.82rem] text-pn-muted mb-6">Your display name and email — visible across communities and posts.</p>

            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <FloatingInput label="Display name" value={fullname} onChange={setFullname} placeholder="e.g. Ada Lovelace" />
              <FloatingInput label="Email address" type="email" value={email} onChange={setEmail} placeholder="ada@pulsenet.io" />
            </div>
          </section>

          {/* AVATAR */}
          <section
            id="avatar"
            ref={(el) => { sectionRefs.current.avatar = el; }}
            className="scroll-mt-[86px] bg-pn-white border border-pn-border rounded-[22px] p-7 shadow-[0_6px_22px_rgba(53,88,114,0.06)] animate-fade-up-1"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-steel">Section · 02</span>
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-1">Avatar</div>
            <p className="text-[0.82rem] text-pn-muted mb-6">
              {customPicture
                ? "Your uploaded picture is shown across the whole network."
                : "Upload a picture or pick a gradient — gradients power your initial across the network."}
            </p>

            <div className="flex items-center gap-7 flex-wrap">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-pn-sky/15 blur-xl animate-ring-glow" />
                {customPicture ? (
                  <img
                    src={customPicture}
                    alt="Avatar preview"
                    className="relative w-[88px] h-[88px] rounded-full object-cover border-[3px] border-pn-white shadow-[0_10px_30px_rgba(53,88,114,0.25)] transition-all duration-500 bg-pn-bg"
                  />
                ) : (
                  <div className={`relative w-[88px] h-[88px] rounded-full bg-gradient-to-br ${currentGradient.cls} border-[3px] border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] text-[2.1rem] font-bold text-white shadow-[0_10px_30px_rgba(53,88,114,0.25)] transition-all duration-500`}>
                    {initial}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[0.85rem] font-semibold text-white bg-pn-steel hover:bg-[#2a4760] px-4 py-[9px] rounded-xl shadow-[0_4px_12px_rgba(53,88,114,0.18)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {customPicture ? "Replace picture" : "Upload picture"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePictureFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {customPicture && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-pn-red bg-[rgba(155,58,58,0.08)] hover:bg-[rgba(155,58,58,0.16)] px-4 py-[9px] rounded-xl border border-[rgba(155,58,58,0.25)] transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                      Remove
                    </button>
                  )}
                  <span className="text-[0.72rem] text-pn-lm">PNG or JPG up to 20 MB.</span>
                </div>

                {!customPicture && (
                  <>
                    <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-pn-lm mt-5 mb-2">Or pick a gradient</div>
                    <div className="flex flex-wrap gap-3">
                      {GRADIENTS.map((g) => {
                        const selected = g.key === avatarKey;
                        return (
                          <button key={g.key} type="button" onClick={() => setAvatarKey(g.key)}
                            className={`group flex flex-col items-center gap-2 cursor-pointer transition-all ${selected ? "scale-[1.04]" : "hover:scale-[1.02]"}`}>
                            <div className={`relative w-[54px] h-[54px] rounded-full bg-gradient-to-br ${g.cls} border-[2px] transition-all ${
                              selected
                                ? "border-pn-sky shadow-[0_0_0_3px_rgba(122,170,206,0.25),0_6px_20px_rgba(53,88,114,0.25)]"
                                : "border-pn-border group-hover:border-pn-sky"
                            }`}>
                              {selected && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pn-sky text-white flex items-center justify-center text-[0.7rem] shadow-md">
                                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <span className={`text-[0.7rem] font-semibold transition-colors ${selected ? "text-pn-steel" : "text-pn-muted group-hover:text-pn-steel"}`}>{g.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* BIO */}
          <section
            id="bio"
            ref={(el) => { sectionRefs.current.bio = el; }}
            className="scroll-mt-[86px] bg-pn-white border border-pn-border rounded-[22px] p-7 shadow-[0_6px_22px_rgba(53,88,114,0.06)] animate-fade-up-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-steel">Section · 03</span>
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-1">Professional Bio</div>
            <p className="text-[0.82rem] text-pn-muted mb-6">A short paragraph about what you build, where you focus, and what you're curious about.</p>

            <div className="relative bg-pn-bg border-[1.5px] border-pn-border rounded-xl focus-within:border-pn-sky transition-colors">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={5}
                className="w-full px-4 py-3 pr-[68px] bg-transparent border-none outline-none text-[0.92rem] text-pn-navy leading-[1.7] resize-y font-['DM_Sans',sans-serif]"
                placeholder="Designer & engineer focused on inclusive interfaces. Currently exploring the intersection of design systems and ML…"
              />
              <div className="absolute right-3 top-3 w-[44px] h-[44px]">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-pn-border" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    className={`${bioRingColor} transition-all duration-300`}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${(bioPct / 100) * 2 * Math.PI * 15} ${2 * Math.PI * 15}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold text-pn-steel">
                  {bio.length}
                </div>
              </div>
            </div>
            <div className="text-[0.72rem] text-pn-lm mt-2">Markdown not supported here. Keep it tight — under {BIO_MAX} characters.</div>
          </section>

          {/* ACCOUNT */}
          <section
            id="account"
            ref={(el) => { sectionRefs.current.account = el; }}
            className="scroll-mt-[86px] bg-pn-white border border-pn-border rounded-[22px] p-7 shadow-[0_6px_22px_rgba(53,88,114,0.06)] animate-fade-up-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-steel">Section · 04</span>
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-1">Account</div>
            <p className="text-[0.82rem] text-pn-muted mb-6">Read-only details locked at registration.</p>

            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              {[
                { lbl: "Username", val: `@${user?.username ?? "user"}` },
                { lbl: "Role",     val: user?.role ?? "user" },
                { lbl: "Joined",   val: createdAt ? formatDate(createdAt) : "—" },
              ].map((d) => (
                <div key={d.lbl} className="bg-pn-bg border border-pn-border rounded-xl p-[14px] hover:border-pn-sky transition-colors">
                  <div className="text-[0.68rem] font-bold uppercase tracking-wider text-pn-lm mb-[6px]">{d.lbl}</div>
                  <div className="text-[0.9rem] font-semibold text-pn-navy truncate">{d.val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* DANGER */}
          <section
            id="danger"
            ref={(el) => { sectionRefs.current.danger = el; }}
            className="scroll-mt-[86px] bg-[rgba(155,58,58,0.04)] border border-[rgba(155,58,58,0.18)] rounded-[22px] p-7 animate-fade-up-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-red" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-pn-red">Section · 05</span>
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-red mb-1">Sign Out</div>
            <p className="text-[0.82rem] text-pn-muted mb-5 leading-[1.6]">
              Ends your session on this device. You'll need to log back in to access your communities.
            </p>
            <button onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-[rgba(155,58,58,0.08)] hover:bg-[rgba(155,58,58,0.16)] text-pn-red font-semibold text-[0.875rem] px-5 py-[10px] rounded-xl border border-[rgba(155,58,58,0.25)] cursor-pointer transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </section>
        </div>
      </div>

      {/* STICKY SAVE BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ${dirty || savedFlash ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
        <div className="max-w-[1100px] mx-auto px-6 pb-5">
          <div className="bg-pn-white/95 backdrop-blur-md border border-pn-border rounded-2xl shadow-[0_20px_60px_rgba(15,30,46,0.18)] p-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 pl-3">
              <span className={`w-[8px] h-[8px] rounded-full ${savedFlash ? "bg-pn-green" : "bg-amber-500"} ${savedFlash ? "" : "animate-pulse-dot"}`} />
              <div>
                <div className="text-[0.85rem] font-semibold text-pn-navy leading-tight">
                  {savedFlash ? "All changes saved" : "You have unsaved changes"}
                </div>
                <div className="text-[0.72rem] text-pn-muted leading-tight">
                  {savedFlash ? "Your profile is up to date." : "Save now to publish them across PulseNet."}
                </div>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={handleRevert} disabled={!dirty || saving}
                className="text-[0.85rem] font-semibold text-pn-muted px-4 py-[10px] rounded-xl border border-pn-border hover:border-pn-sky hover:text-pn-steel disabled:opacity-40 transition-all cursor-pointer">
                Revert
              </button>
              <button onClick={handleSave} disabled={!dirty || saving}
                className={`relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold text-[0.88rem] px-6 py-[10px] rounded-xl text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_8px_24px_rgba(53,88,114,0.28)] ${
                  savedFlash ? "bg-pn-green" : "bg-pn-steel hover:bg-[#2a4760]"
                }`}>
                {saving ? (
                  <>
                    <span className="w-[14px] h-[14px] rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Saving…
                  </>
                ) : savedFlash ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    Save changes
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-[110px] left-1/2 z-50 animate-toast-in">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-[0_18px_50px_rgba(15,30,46,0.25)] border ${
            toast.kind === "success"
              ? "bg-pn-green text-white border-pn-green/40"
              : "bg-pn-red text-white border-pn-red/40"
          }`}>
            {toast.kind === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span className="text-[0.9rem] font-semibold">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

type FloatingInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
};

function FloatingInput({ label, value, onChange, type = "text", placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  return (
    <label className="relative block">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={lifted ? placeholder : ""}
        className={`peer w-full px-4 pt-[22px] pb-2 bg-pn-bg border-[1.5px] rounded-xl text-[0.92rem] text-pn-navy outline-none transition-all ${
          focused
            ? "border-pn-sky shadow-[0_0_0_4px_rgba(122,170,206,0.15)]"
            : "border-pn-border"
        }`}
      />
      <span className={`absolute left-4 pointer-events-none font-semibold transition-all duration-200 ${
        lifted
          ? "top-[7px] text-[0.65rem] uppercase tracking-wider text-pn-steel"
          : "top-1/2 -translate-y-1/2 text-[0.92rem] text-pn-muted"
      }`}>
        {label}
      </span>
    </label>
  );
}

type IconName = "person" | "palette" | "quote" | "key" | "logout";

function SectionIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  if (name === "person")  return (<svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
  if (name === "palette") return (<svg {...p}><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125 0-.946.756-1.688 1.688-1.688h1.996c3.094 0 5.605-2.512 5.605-5.605C22 6.78 17.521 2 12 2z" /></svg>);
  if (name === "quote")   return (<svg {...p}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v8c0 1.25.75 2 2 2h1c0 2-1 4-2 4v2z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v8c0 1.25.75 2 2 2h1c0 2-1 4-2 4v2z" /></svg>);
  if (name === "key")     return (<svg {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>);
  return (<svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
}
