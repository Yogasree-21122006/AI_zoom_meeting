import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { Wifi, WifiOff, AlertTriangle, X, Brain, Presentation } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useMeetingStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Wifi className="w-5 h-5 text-emerald-600" />;
          let borderClass = 'border-emerald-500/20';
          let bgClass = 'bg-white/95 text-slate-800';

          if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
            borderClass = 'border-amber-500/20';
          } else if (toast.type === 'error') {
            icon = <WifiOff className="w-5 h-5 text-rose-500" />;
            borderClass = 'border-rose-500/20';
          } else if (toast.type === 'predictive') {
            icon = <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />;
            borderClass = 'border-indigo-500/30';
            bgClass = 'bg-indigo-50/95 text-indigo-950';
          } else if (toast.type === 'document') {
            icon = <Presentation className="w-5 h-5 text-blue-600 animate-bounce" />;
            borderClass = 'border-blue-500/30 ring-2 ring-blue-400/20';
            bgClass = 'bg-blue-50/95 text-slate-800';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${borderClass} ${bgClass} shadow-xl backdrop-blur-md`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-grow text-xs leading-snug font-medium space-y-2">
                <div>{toast.text}</div>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] transition-colors shadow-sm inline-block"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1"
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

export default ToastNotification;
