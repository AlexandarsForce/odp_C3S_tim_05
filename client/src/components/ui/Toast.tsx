import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
  push: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Must be used inside <ToastProvider>; ctx is guaranteed present there.
  return ctx!;
}

const AUTO_DISMISS_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-[10px] items-end pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const accent =
    toast.kind === "success"
      ? "border-[rgba(44,122,75,0.25)] bg-[rgba(44,122,75,0.06)] text-pn-green"
      : toast.kind === "error"
        ? "border-[rgba(155,58,58,0.25)] bg-[rgba(155,58,58,0.06)] text-pn-red"
        : "border-pn-border bg-pn-white text-pn-navy";

  return (
    <div
      role="status"
      className={`pointer-events-auto min-w-[240px] max-w-[360px] flex items-start gap-3 px-4 py-3 rounded-xl border shadow-[0_12px_32px_rgba(26,39,51,0.14)] backdrop-blur-sm bg-pn-white/95 ${accent}`}
      style={{ animation: "toastIn 260ms cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <ToastIcon kind={toast.kind} />
      <p className="text-[0.86rem] leading-[1.45] font-medium text-pn-navy flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-pn-lm hover:text-pn-navy transition-colors cursor-pointer shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") {
    return (
      <span className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-full bg-pn-green/15 flex items-center justify-center text-pn-green">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (kind === "error") {
    return (
      <span className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-full bg-pn-red/15 flex items-center justify-center text-pn-red">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-full bg-pn-sky/15 flex items-center justify-center text-pn-steel">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </span>
  );
}
