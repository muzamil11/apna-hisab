import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, confirmLabel }
  const resolveRef = useRef(null);

  // Mirrors window.confirm's call shape (await confirm("...")) so it's a
  // drop-in swap at every call site, but resolves a real Promise instead of
  // blocking the whole tab like the native dialog does.
  const confirm = useCallback((message, confirmLabel = "Confirm") => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message, confirmLabel });
    });
  }, []);

  function settle(result) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-[100] p-0 md:p-4">
          <div className="bg-surface w-full md:max-w-sm md:rounded-2xl rounded-t-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-warn-soft text-warn flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={2} />
              </div>
              <p className="text-sm text-ink pt-1.5 leading-relaxed">{dialog.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => settle(false)}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-ink-muted hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => settle(true)}
                className="flex-1 bg-bad hover:bg-bad/90 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Returns a confirm(message) => Promise<boolean> function — await it exactly
// like window.confirm, e.g. `if (!(await confirm("Delete this?"))) return;`
export function useConfirm() {
  return useContext(ConfirmContext);
}
