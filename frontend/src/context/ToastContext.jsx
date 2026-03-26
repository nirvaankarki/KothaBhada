import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

function getToastTheme(type) {
  if (type === 'error') {
    return {
      container: 'bg-[#FEF2F2] border-[#FECACA]',
      iconWrap: 'bg-[#FCA5A5]',
      icon: 'text-[#B91C1C]',
      title: 'text-[#7F1D1D]',
      message: 'text-[#991B1B]',
      close: 'text-[#EF4444]',
      Icon: AlertCircle,
      defaultTitle: 'Error',
    };
  }

  if (type === 'warning') {
    return {
      container: 'bg-[#FFFBEB] border-[#FDE68A]',
      iconWrap: 'bg-[#FCD34D]',
      icon: 'text-[#B45309]',
      title: 'text-[#78350F]',
      message: 'text-[#92400E]',
      close: 'text-[#D97706]',
      Icon: AlertCircle,
      defaultTitle: 'Warning',
    };
  }

  if (type === 'info') {
    return {
      container: 'bg-[#EFF6FF] border-[#BFDBFE]',
      iconWrap: 'bg-[#93C5FD]',
      icon: 'text-[#1D4ED8]',
      title: 'text-[#1E3A8A]',
      message: 'text-[#1D4ED8]',
      close: 'text-[#3B82F6]',
      Icon: Info,
      defaultTitle: 'Info',
    };
  }

  return {
    container: 'bg-[#F0FDF4] border-[#BBF7D0]',
    iconWrap: 'bg-[#A7F3D0]',
    icon: 'text-[#059669]',
    title: 'text-[#064E3B]',
    message: 'text-[#065F46]',
    close: 'text-[#10B981]',
    Icon: Check,
    defaultTitle: 'Success',
  };
}

function ToastItem({ toast, onClose }) {
  const theme = getToastTheme(toast.type);
  const title = toast.title || theme.defaultTitle;

  return (
    <div className={`flex items-center gap-4 p-4 border rounded-[1.5rem] shadow-sm w-[min(92vw,640px)] ${theme.container}`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${theme.iconWrap}`}>
        <theme.Icon className={`w-7 h-7 ${theme.icon}`} strokeWidth={2.8} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-lg font-bold leading-tight ${theme.title}`}>{title}</h3>
        <p className={`text-sm mt-0.5 leading-tight break-words ${theme.message}`}>{toast.message}</p>
      </div>

      <button
        type="button"
        aria-label="Close notification"
        onClick={() => onClose(toast.id)}
        className={`hover:opacity-70 transition-opacity self-center ${theme.close}`}
      >
        <X className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'success', title = '', message, duration = 3200 }) => {
    if (!message || !String(message).trim()) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = {
      id,
      type,
      title,
      message: String(message).trim(),
    };

    setToasts((prev) => {
      const compact = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
      return [...compact, nextToast];
    });

    if (duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={hideToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
