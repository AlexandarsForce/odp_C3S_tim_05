import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { Footer } from "../../components/layout/Footer";
import { CommunityAvatar } from "../../components/communities/CommunityAvatar";
import { communityApi } from "../../api_services/communities/CommunityAPIService";

const MIN_DESCRIPTION_LENGTH = 15;
const RULES_MAX = 200;
const AVATAR_URL_MAX = 500;

const isValidHttpUrl = (v: string): boolean => {
  if (!v) return true; // empty allowed
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [avatarPicture, setAvatarPicture] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [descTouched, setDescTouched] = useState(false);
  const [avatarTouched, setAvatarTouched] = useState(false);

  const descTrimmedLen = description.trim().length;
  const descValid = descTrimmedLen >= MIN_DESCRIPTION_LENGTH;
  const nameValid = name.trim().length >= 2;
  const avatarValid = isValidHttpUrl(avatarPicture.trim()) && avatarPicture.trim().length <= AVATAR_URL_MAX;
  const rulesValid = rules.trim().length <= RULES_MAX;
  const canSubmit = nameValid && descValid && avatarValid && rulesValid;
  const showDescError = descTouched && !descValid;
  const showAvatarError = avatarTouched && !avatarValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const r = await communityApi.create({
      name: name.trim(),
      description: description.trim(),
      rules: rules.trim(),
      avatarPicture: avatarPicture.trim(),
      type,
    });
    if (r.success && r.data && r.data.id) {
      navigate(`/community/${r.data.id}`);
    } else if (r.success) {
      navigate("/my-communities");
    } else {
      setError(r.message || "Failed to create community");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[1080px] mx-auto px-6 py-10 pb-20 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[0.78rem] font-semibold text-pn-muted uppercase tracking-wider mb-3">
            <span className="w-[6px] h-[6px] rounded-full bg-pn-sky animate-pulse-dot" />
            New Community
          </div>
          <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(2rem,4vw,2.6rem)] font-bold text-pn-navy leading-[1.1]">
            Create a Professional Community
          </h1>
          <p className="text-[1rem] leading-[1.7] text-pn-muted mt-2 max-w-[600px]">
            Build a focused space for professionals to exchange ideas, discussions, and meaningful industry insights.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-7 items-start max-lg:grid-cols-1">
          <div className="bg-pn-white border border-pn-border rounded-3xl p-8 max-sm:p-6 shadow-[0_10px_30px_rgba(53,88,114,0.06)]">
            <div className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-1">Community Information</div>
            <p className="text-[0.875rem] text-pn-muted mb-6">Define the identity, purpose, and visibility of your space.</p>

            {error && (
              <div className="flex items-start gap-[10px] bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] rounded-[11px] px-[14px] py-3 text-[0.82rem] text-pn-red mb-6 leading-[1.5]">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[0.875rem] font-semibold text-pn-steel mb-2">Community Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-pn-bg border border-pn-border rounded-xl text-[0.92rem] text-pn-navy outline-none focus:border-pn-sky focus:bg-pn-white transition-colors placeholder:text-pn-lm"
                placeholder="Design Systems Collective"
              />
            </div>

            <div className="mb-5">
              <label className="block text-[0.875rem] font-semibold text-pn-steel mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setDescTouched(true)}
                rows={5}
                className="w-full px-4 py-3 bg-pn-bg border border-pn-border rounded-xl text-[0.92rem] text-pn-navy outline-none focus:border-pn-sky focus:bg-pn-white transition-colors resize-y leading-[1.65] placeholder:text-pn-lm"
                placeholder="Describe the purpose, topics, and focus of this community..."
              />
              <div className="flex items-center justify-between mt-2 text-[0.78rem]">
                <span className={showDescError ? "text-pn-red font-medium" : descValid ? "text-pn-green font-medium" : "text-pn-muted"}>
                  {descValid
                    ? "✓ Looks good"
                    : showDescError
                      ? `At least ${MIN_DESCRIPTION_LENGTH} characters required (${descTrimmedLen}/${MIN_DESCRIPTION_LENGTH})`
                      : `Tell people what this community is about (min ${MIN_DESCRIPTION_LENGTH} chars).`}
                </span>
                <span className="text-pn-lm">{descTrimmedLen}/500</span>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="cc-avatar" className="block text-[0.875rem] font-semibold text-pn-steel mb-2">
                Avatar image URL <span className="text-pn-lm font-normal">· optional</span>
              </label>
              <input
                id="cc-avatar"
                type="url"
                value={avatarPicture}
                onChange={(e) => setAvatarPicture(e.target.value)}
                onBlur={() => setAvatarTouched(true)}
                className="w-full px-4 py-3 bg-pn-bg border border-pn-border rounded-xl text-[0.92rem] text-pn-navy outline-none focus:border-pn-sky focus:bg-pn-white transition-colors placeholder:text-pn-lm"
                placeholder="https://example.com/avatar.png"
              />
              <div className="mt-2 text-[0.78rem]">
                {showAvatarError ? (
                  <span className="text-pn-red font-medium">Enter a valid http(s) URL or leave it blank.</span>
                ) : (
                  <span className="text-pn-muted">Paste a public image URL — shown across community headers and cards.</span>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="cc-rules" className="block text-[0.875rem] font-semibold text-pn-steel mb-2">
                Community rules <span className="text-pn-lm font-normal">· optional</span>
              </label>
              <textarea
                id="cc-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                maxLength={RULES_MAX}
                className="w-full px-4 py-3 bg-pn-bg border border-pn-border rounded-xl text-[0.92rem] text-pn-navy outline-none focus:border-pn-sky focus:bg-pn-white transition-colors resize-y leading-[1.65] placeholder:text-pn-lm"
                placeholder={"1. Be respectful.\n2. Keep posts on-topic.\n3. No self-promotion."}
              />
              <div className="flex items-center justify-between mt-2 text-[0.78rem]">
                <span className="text-pn-muted">Shown to anyone viewing the community.</span>
                <span className="text-pn-lm">{rules.length}/{RULES_MAX}</span>
              </div>
            </div>

            <div className="h-px bg-pn-border my-7" />

            <div className="mb-2">
              <label className="block text-[0.875rem] font-semibold text-pn-steel mb-2">Community Visibility</label>
              <div className="bg-pn-bg border border-pn-border rounded-2xl p-[18px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[0.95rem] font-semibold text-pn-navy mb-[2px]">
                      {type === "public" ? "Public" : "Private"}
                    </div>
                    <div className="text-[0.8rem] text-pn-muted leading-[1.55]">
                      {type === "public"
                        ? "Discoverable across the network."
                        : "Invitation-based access only."}
                    </div>
                  </div>
                  <button
                    onClick={() => setType(type === "public" ? "private" : "public")}
                    aria-label={`Toggle to ${type === "public" ? "private" : "public"}`}
                    type="button"
                    className="relative w-[64px] h-9 rounded-full border-none cursor-pointer shrink-0 transition-colors"
                    style={{ background: type === "public" ? "#355872" : "#D6D8D2" }}
                  >
                    <div
                      className="absolute top-[3px] w-[30px] h-[30px] rounded-full bg-white transition-all shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                      style={{ left: type === "public" ? "31px" : "3px" }}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-pn-border my-7" />

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                type="button"
                className="inline-flex items-center justify-center bg-pn-steel text-white font-semibold text-[0.92rem] px-7 py-[12px] rounded-xl shadow-[0_6px_18px_rgba(53,88,114,0.18)] hover:bg-[#2a4760] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {submitting ? "Creating..." : "Create Community"}
              </button>
              {!canSubmit && !submitting && (
                <span className="text-[0.78rem] text-pn-lm leading-[1.5]">
                  {!nameValid && !descTrimmedLen
                    ? "Add a name and a short description to continue."
                    : !nameValid
                      ? "Add a name (min 2 characters)."
                      : `Description needs ${MIN_DESCRIPTION_LENGTH - descTrimmedLen} more character${MIN_DESCRIPTION_LENGTH - descTrimmedLen === 1 ? "" : "s"}.`}
                </span>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-[80px]">
            <div className="relative overflow-hidden rounded-2xl border border-pn-border bg-gradient-to-br from-pn-navy via-pn-steel to-[#2a4760] p-5 h-[150px] shadow-[0_10px_28px_rgba(26,39,51,0.18)]">
              <svg
                className="absolute inset-0 w-full h-full opacity-[0.6] pointer-events-none"
                viewBox="0 0 320 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="cc-glow" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#9CD5FF" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="cc-line" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#7AAACE" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <circle cx="160" cy="75" r="85" fill="url(#cc-glow)" />
                <g stroke="url(#cc-line)" strokeWidth="1">
                  <line x1="160" y1="75" x2="45" y2="30" />
                  <line x1="160" y1="75" x2="275" y2="35" />
                  <line x1="160" y1="75" x2="55" y2="120" />
                  <line x1="160" y1="75" x2="265" y2="125" />
                  <line x1="45" y1="30" x2="55" y2="120" />
                  <line x1="275" y1="35" x2="265" y2="125" />
                </g>
                <g fill="#9CD5FF">
                  <circle cx="45" cy="30" r="3" opacity="0.8" />
                  <circle cx="275" cy="35" r="3" opacity="0.75" />
                  <circle cx="55" cy="120" r="2.5" opacity="0.7" />
                  <circle cx="265" cy="125" r="3" opacity="0.8" />
                </g>
                <circle cx="160" cy="75" r="8" fill="#9CD5FF" opacity="0.25" />
                <circle cx="160" cy="75" r="5" fill="#fff" className="animate-pulse-dot" />
              </svg>
              <div className="relative">
                <span className="inline-flex items-center gap-[6px] text-[0.66rem] font-bold uppercase tracking-[0.14em] text-pn-pale">
                  <span className="w-[6px] h-[6px] rounded-full bg-pn-pale animate-pulse-dot" />
                  PulseNet
                </span>
                <p className="font-['Cormorant_Garamond',serif] text-[1.1rem] leading-[1.25] font-semibold text-white mt-[10px]">
                  Every network<br />starts with one voice.
                </p>
              </div>
            </div>

            <div className="bg-pn-white border border-pn-border rounded-2xl p-5 shadow-[0_6px_18px_rgba(53,88,114,0.05)]">
              <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-pn-muted mb-4">
                <span className="w-[6px] h-[6px] rounded-full bg-pn-green animate-pulse-dot" />
                Live preview
              </div>
              <div className="flex gap-3 mb-3">
                <CommunityAvatar
                  name={name || "C"}
                  avatarUrl={avatarValid ? avatarPicture.trim() : undefined}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-['Cormorant_Garamond',serif] text-[1.15rem] font-semibold text-pn-navy leading-tight truncate">
                    {name || <span className="text-pn-lm italic font-normal">Community name</span>}
                  </div>
                  <div className="inline-flex items-center gap-[5px] text-[0.7rem] font-medium text-pn-steel bg-[rgba(53,88,114,0.08)] px-2 py-[2px] rounded-full mt-[6px]">
                    <span className={`w-[5px] h-[5px] rounded-full ${type === "public" ? "bg-pn-green" : "bg-pn-muted"}`} />
                    {type === "public" ? "Public" : "Private"}
                  </div>
                </div>
              </div>
              <p className={`text-[0.82rem] leading-[1.6] line-clamp-4 ${description ? "text-pn-muted" : "text-pn-lm italic"}`}>
                {description || "Your description appears here as you type…"}
              </p>
              {rules.trim().length > 0 && (
                <div className="mt-4 pt-4 border-t border-pn-border">
                  <div className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-pn-muted mb-[6px]">
                    Rules preview
                  </div>
                  <p className="text-[0.78rem] leading-[1.55] text-pn-muted whitespace-pre-wrap line-clamp-4">
                    {rules}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
