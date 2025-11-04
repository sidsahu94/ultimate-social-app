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
      <div aria-live="polite" className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} role="status" className={`max-w-xs px-4 py-2 rounded shadow-lg text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>{t.msg}</div>
              <button onClick={() => remove(t.id)} aria-label="Dismiss" className="ml-3">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
