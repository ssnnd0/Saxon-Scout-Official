import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ 
  toasts, 
  removeToast 
}) => {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-400" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-amber-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/20 border-emerald-800 text-emerald-200';
      case 'error':
        return 'bg-red-900/20 border-red-800 text-red-200';
      case 'warning':
        return 'bg-amber-900/20 border-amber-800 text-amber-200';
      default:
        return 'bg-blue-900/20 border-blue-800 text-blue-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-none md:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md ${getBgColor(
            toast.type
          )} animate-slide-up pointer-events-auto shadow-lg`}
        >
          <div className="flex-shrink-0 pt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{toast.message}</p>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="text-xs font-bold mt-2 hover:underline opacity-80 hover:opacity-100"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
