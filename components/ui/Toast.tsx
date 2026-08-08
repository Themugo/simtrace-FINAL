import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { MODULE_THEMES, SimTraceModule } from '../../lib/design-tokens';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'module';
  module?: SimTraceModule;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastItem = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast Stack Display */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const theme = MODULE_THEMES[toast.module || 'device-dna'];

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
            module: <Info className="w-5 h-5 shrink-0" style={{ color: theme.primaryHex }} />,
          };

          const variant = toast.variant || 'info';

          return (
            <div
              key={toast.id}
              className="pointer-events-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-200 text-xs relative overflow-hidden"
              style={
                variant === 'module'
                  ? { borderLeft: `4px solid ${theme.primaryHex}` }
                  : variant === 'success'
                  ? { borderLeft: '4px solid #34d399' }
                  : variant === 'error'
                  ? { borderLeft: '4px solid #fb7185' }
                  : variant === 'warning'
                  ? { borderLeft: '4px solid #fbbf24' }
                  : { borderLeft: '4px solid #38bdf8' }
              }
            >
              {icons[variant]}

              <div className="flex-1 space-y-0.5">
                {toast.title && <div className="font-bold text-white text-xs">{toast.title}</div>}
                <div className="text-slate-300 leading-snug">{toast.message}</div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
