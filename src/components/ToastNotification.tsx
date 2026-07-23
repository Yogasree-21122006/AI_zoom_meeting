import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useMeetingStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Wifi className="w-5 h-5 text-emerald-400" />;
          let borderClass = 'border-emerald-500/30';
          let bgClass = 'bg-slate-900/90';

          if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
            borderClass = 'border-amber-500/30';
          } else if (toast.type === 'error') {
            icon = <WifiOff className="w-5 h-5 text-rose-400" />;
            borderClass = 'border-rose-500/30';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderClass} ${bgClass} shadow-xl backdrop-blur-md text-white`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-grow text-sm leading-snug font-medium text-slate-100">
                {toast.text}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
