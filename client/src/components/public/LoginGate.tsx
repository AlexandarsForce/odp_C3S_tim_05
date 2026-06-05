import { Link } from "react-router-dom";

export function LoginGate({ icon = "🔒", title, subtitle, showLogin = true }: {
  icon?: string; title: string; subtitle: string; showLogin?: boolean;
}) {
  return (
    <div className="bg-pn-white border border-pn-border rounded-2xl px-9 py-12 text-center shadow-[0_16px_48px_rgba(53,88,114,0.1)] mb-[14px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(247,248,240,0.85)] to-pn-white pointer-events-none" />
      <div className="relative z-1">
        <div className="w-14 h-14 rounded-[16px] bg-[rgba(53,88,114,0.09)] flex items-center justify-center mx-auto mb-[18px] text-[1.4rem]">{icon}</div>
        <h2 className="font-['Cormorant_Garamond',serif] text-[1.7rem] font-bold text-pn-navy mb-[10px]">{title}</h2>
        <p className="text-[0.9rem] text-pn-muted leading-[1.65] max-w-[380px] mx-auto mb-6">{subtitle}</p>
        <div className="flex gap-[10px] justify-center flex-wrap">
          <Link to="/register" className="inline-flex items-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.9rem] px-[26px] py-[11px] rounded-[10px] shadow-[0_5px_16px_rgba(53,88,114,0.22)] hover:bg-[#2a4760] transition-colors">
            Create Free Account →
          </Link>
          {showLogin && (
            <Link to="/login" className="inline-flex items-center gap-[7px] bg-pn-white text-pn-steel font-semibold text-[0.9rem] px-[22px] py-[10px] rounded-[10px] border-[1.5px] border-pn-border hover:border-pn-sky transition-colors">
              Log In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
