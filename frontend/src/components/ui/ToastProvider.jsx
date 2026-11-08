// frontend/src/components/ui/ToastProvider.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, opts = {}) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const toast = { id, msg, type: opts.type || "info", timeout: opts.timeout ?? 3500 };
    setToasts(t => [toast, ...t]);
    if (toast.timeout > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.timeout);
    return id;
  }, []);
  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div aria-live="polite" className="fixed right-6 bottom-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => {
          let style = "bg-[#070B14]/95 text-[#F8FAFC] border border-[rgba(226,232,240,0.18)] shadow-silverGlass";
          if (t.type === 'error') {
            style = "bg-[#052E24] text-white border border-red-500/40 shadow-[0_8px_30px_rgba(139,0,24,0.6)]";
          } else if (t.type === 'success') {
            style = "bg-[#0F766E]/95 text-white border border-[#14B8A6]/40 shadow-[0_8px_30px_rgba(15,118,110,0.6)]";
          }
          return (
            <div key={t.id} role="status" className={`pointer-events-auto max-w-sm px-4 py-3 rounded-2xl backdrop-blur-xl text-sm transition-all duration-300 ${style}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{t.msg}</div>
                <button onClick={() => remove(t.id)} aria-label="Dismiss" className="ml-3 opacity-60 hover:opacity-100 transition-opacity">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
