import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="bg-pn-white border-t border-pn-border py-10">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.15rem] text-pn-steel font-semibold">
              Pulse<span className="text-pn-sky">Net</span>
            </div>
            <p className="text-[0.82rem] text-pn-muted italic mt-1">Distributed Professional Network</p>
          </div>
          <nav className="flex gap-6 flex-wrap">
            <Link to="/"         className="text-[1rem] font-semibold text-pn-steel hover:text-pn-sky transition-colors">Communities</Link>
            <Link to="/login"    className="text-[1rem] font-semibold text-pn-steel hover:text-pn-sky transition-colors">Sign In</Link>
            <Link to="/register" className="text-[1rem] font-semibold text-pn-steel hover:text-pn-sky transition-colors">Register</Link>
          </nav>
        </div>
        <div className="mt-6 pt-5 border-t border-pn-border">
          <p className="text-[0.82rem] text-pn-muted text-center">© 2026 PulseNet. Built for professionals who value signal over noise.</p>
        </div>
      </div>
    </footer>
  );
}
