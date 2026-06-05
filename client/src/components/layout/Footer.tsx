import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/AlexandarsForce/odp_C3S_tim_05";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-pn-white border-t border-pn-border">
      <div className="max-w-[1120px] mx-auto px-6 pt-12 pb-8 lg:pt-14 lg:pb-10">
        <div className="md:flex md:items-start md:justify-between">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-[7px] font-['Cormorant_Garamond',serif] text-[1.45rem] font-bold text-pn-steel leading-none tracking-tight"
            aria-label="PulseNet"
          >
            <span>
              Pulse<span className="text-pn-sky">Net</span>
            </span>
            <span className="relative inline-flex w-[7px] h-[7px] shrink-0" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-pn-sky animate-pulse-dot" />
              <span className="absolute inset-0 rounded-full bg-pn-sky opacity-40 blur-[3px] group-hover:opacity-70 transition-opacity" />
            </span>
          </Link>

          <ul className="flex list-none mt-5 md:mt-0 gap-3">
            <li>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pn-bg border border-pn-border text-pn-steel hover:bg-pn-steel hover:text-white hover:border-pn-steel transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-pn-border mt-6 pt-6 md:mt-5 md:pt-6 flex flex-wrap items-center justify-between gap-3 text-[0.82rem] leading-[1.7] text-pn-muted">
          <div>© {year} PulseNet</div>
          <div className="text-pn-lm italic">A pulse for every conversation.</div>
        </div>
      </div>
    </footer>
  );
}
