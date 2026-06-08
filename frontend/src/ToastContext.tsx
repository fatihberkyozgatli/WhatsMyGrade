import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckIcon, AlertTriangleIcon, InfoIcon, XIcon } from './components/icons';

type ToastVariant = 'success' | 'error' | 'info' | 'destructive';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration: number;
}

interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  destructive: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const variantStyles: Record<ToastVariant, { Icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; border: string }> = {
  success: { Icon: CheckIcon, color: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900' },
  error: { Icon: AlertTriangleIcon, color: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900' },
  info: { Icon: InfoIcon, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900' },
  destructive: { Icon: CheckIcon, color: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900' },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const reduce = useReducedMotion();
  const { Icon, color, border } = variantStyles[toast.variant];
  const timer = useRef<number>();

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const start = useCallback(() => {
    stop();
    timer.current = window.setTimeout(() => onDismiss(toast.id), toast.duration);
  }, [stop, onDismiss, toast.id, toast.duration]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={stop}
      onMouseLeave={start}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border ${border} bg-white p-3.5 shadow-lg dark:bg-slate-800`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <p className="flex-1 text-sm text-gray-800 dark:text-slate-100">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 rounded text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant, options?: ToastOptions) => {
    const id = ++idRef.current;
    const duration = options?.duration ?? (options?.action ? 7000 : 4000);
    setToasts((prev) => [...prev, { id, message, variant, action: options?.action, duration }]);
  }, []);

  const api = useRef<ToastApi>({
    success: (message, options) => push(message, 'success', options),
    error: (message, options) => push(message, 'error', options),
    info: (message, options) => push(message, 'info', options),
    destructive: (message, options) => push(message, 'destructive', options),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-[var(--app-header-h,0px)] z-[100] flex flex-col items-center gap-2 p-4">
            <AnimatePresence initial={false}>
              {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
