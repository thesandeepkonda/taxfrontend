// src/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { XCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (!message) return;

    const now = Date.now();
    const lastShown = recentToastsRef.current.get(message);

    // Suppress duplicate toasts triggered within 4 seconds
    if (lastShown && now - lastShown < 4000) {
      return;
    }

    recentToastsRef.current.set(message, now);

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      recentToastsRef.current.delete(message);
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Bottom Right Fixed Container */}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none w-[min(92vw,400px)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-50/95 text-rose-800 border-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 text-amber-800 border-amber-200'
                : 'bg-blue-50/95 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};