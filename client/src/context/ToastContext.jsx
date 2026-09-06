import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: "border-good bg-good-soft text-good",
  error: "border-bad bg-bad-soft text-bad",
  info: "border-accent bg-accent-soft text-accent-ink",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 max-w-sm w-full md:w-auto border rounded-xl shadow-lg px-4 py-3 text-sm font-medium ${STYLES[t.type] || STYLES.info}`}
            >
              <Icon size={16} strokeWidth={2} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Returns a showToast(message, "success" | "error" | "info") function.
export function useToast() {
  return useContext(ToastContext);
}
