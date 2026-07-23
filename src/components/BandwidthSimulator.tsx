import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import type { BandwidthTier } from '../types';
import { Wifi, SignalHigh, SignalMedium, SignalLow, Activity, ChevronDown, ChevronUp, Cpu, Server } from 'lucide-react';

interface BandwidthSimulatorProps {
  downlinkSpeed: number;
  effectiveType: string;
}

export const BandwidthSimulator: React.FC<BandwidthSimulatorProps> = ({ downlinkSpeed, effectiveType }) => {
  const { 
    bandwidthTier, 
    simulatedLatency, 
    simulatedLoss 
  } = useMeetingStore();

  const [isOpen, setIsOpen] = useState(true);

  const getTierColor = (tier: BandwidthTier) => {
    switch (tier) {
      case 'high': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'low': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  const getSignalIcon = (tier: BandwidthTier, className = "w-5 h-5") => {
    switch (tier) {
      case 'high': return <SignalHigh className={`${className} text-emerald-400`} />;
      case 'medium': return <SignalMedium className={`${className} text-amber-400`} />;
      case 'low': return <SignalLow className={`${className} text-rose-400`} />;
    }
  };

  return (
    <div className="absolute top-4 left-4 z-40 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden no-print">
      {/* Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Network Connection</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getTierColor(bandwidthTier)}`}>
            {bandwidthTier.toUpperCase()}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-4 text-slate-300">
          {/* Read-Only Status Indicator */}
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
            <div className="flex-shrink-0">
              {getSignalIcon(bandwidthTier, "w-8 h-8")}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300">Automatic Detection</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Classroom streams are adjusted in real-time based on active speed.
              </p>
            </div>
          </div>

          {/* Metrics dashboard */}
          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> Measured Speed:
              </span>
              <span className="font-mono font-semibold text-slate-200">{downlinkSpeed} Mbps</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> Connection Type:
              </span>
              <span className="font-mono font-semibold text-slate-200 uppercase">{effectiveType}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Latency (RTT):
              </span>
              <span className="font-mono font-semibold text-slate-200">{simulatedLatency} ms</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Packet Loss:
              </span>
              <span className={`font-mono font-semibold ${simulatedLoss > 5 ? 'text-rose-400' : simulatedLoss > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {simulatedLoss}%
              </span>
            </div>

            {/* Visual health bar indicator */}
            <div className="pt-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    bandwidthTier === 'high' ? 'bg-emerald-500 w-full' : 
                    bandwidthTier === 'medium' ? 'bg-amber-500 w-1/2' : 'bg-rose-500 w-[12%]'
                  }`} 
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal bg-slate-950/20 p-2 rounded-lg border border-white/5">
            💡 <strong className="text-slate-300">Simulate Throttling:</strong> Open browser DevTools, select <strong className="text-indigo-400">Network</strong> tab, and change throttling preset to <strong className="text-amber-400">Fast 3G</strong> or <strong className="text-rose-400">Slow 3G</strong>.
          </div>
        </div>
      )}
    </div>
  );
};
export default BandwidthSimulator;
