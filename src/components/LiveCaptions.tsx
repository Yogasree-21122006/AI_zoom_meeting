import React from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ClosedCaption } from 'lucide-react';

export const LiveCaptions: React.FC = () => {
  const { captions, bandwidthTier } = useMeetingStore();

  const isLowBandwidth = bandwidthTier === 'low';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 no-print">
      <div 
        className={`relative w-full rounded-2xl flex items-center gap-4 transition-all duration-300 ${
          isLowBandwidth 
            ? 'bg-black border border-rose-500/20 py-5 px-6 shadow-[0_0_20px_rgba(239,68,68,0.05)]' 
            : 'bg-slate-950/80 border border-white/5 py-4 px-5 backdrop-blur-md'
        }`}
      >
        {/* Caption Icon Indicator */}
        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold border-r border-white/10 pr-3.5">
          <ClosedCaption className={`w-5 h-5 ${isLowBandwidth ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span className="hidden sm:inline">Live CC</span>
        </div>

        {/* Caption scrolling area */}
        <div className="flex-grow overflow-hidden min-h-[44px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={captions}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className={`leading-relaxed w-full font-medium ${
                isLowBandwidth
                  ? 'text-yellow-300 text-lg sm:text-xl font-bold font-mono tracking-wide'
                  : 'text-slate-100 text-sm sm:text-base'
              }`}
            >
              {captions || "Waiting for audio/captions..."}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
