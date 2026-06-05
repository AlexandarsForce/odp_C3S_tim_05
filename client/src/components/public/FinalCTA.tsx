import { Link } from "react-router-dom";

export function FinalCTA() {
  return (
    <section className="bg-pn-steel py-[clamp(60px,8vw,90px)] relative overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="max-w-[1120px] mx-auto px-6 text-center relative z-1">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-pn-pale mb-4">Get Started Today</p>
        <h2 className="font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2rem,4vw,3rem)] font-bold text-white mb-4 tracking-[-0.01em]">Ready to join the network?</h2>
        <p className="text-[1rem] text-[rgba(156,213,255,0.8)] max-w-[440px] mx-auto mb-9 leading-[1.65]">
          Create your free account and access the full PulseNet experience — feeds, communities, messaging, and more.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/register" className="inline-flex items-center gap-2 bg-pn-surface text-pn-steel font-bold text-[0.95rem] px-8 py-[13px] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-pn-white hover:-translate-y-[2px] transition-all">
            Create Free Account →
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 bg-[rgba(255,255,255,0.1)] text-white font-medium text-[0.95rem] px-7 py-[13px] rounded-xl border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.18)] transition-all">
            Already a member? Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
