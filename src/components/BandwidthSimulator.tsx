import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { usePredictiveNetwork } from '../hooks/usePredictiveNetwork';
import type { BandwidthTier } from '../types';
import { 
  Wifi, 
  WifiOff, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Server, 
  Brain, 
  Compass 
} from 'lucide-react';

interface BandwidthSimulatorProps {
  downlinkSpeed: number;
  effectiveType: string;
}

export const BandwidthSimulator: React.FC<BandwidthSimulatorProps> = ({ downlinkSpeed, effectiveType }) => {
  const { 
    bandwidthTier, 
    realDetectedTier,
    simulatedLatency, 
    simulatedLoss,
    predictiveModeEnabled,
    setPrediction,
    setPredictiveModeEnabled,
    isAutoNetworkMode,
    manualTier,
    setIsAutoNetworkMode,
    setManualTier
  } = useMeetingStore();

  const [isOpen, setIsOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Initialize the predictive hook
  const {
    predictedTier,
    confidence,
    detectedLocation,
    detectedWeather,
    isLoading: isPredictiveLoading,
    setSelectedLocationOverride,
  } = usePredictiveNetwork();

  // Sync predictions to Zustand store
  useEffect(() => {
    if (predictedTier) {
      setPrediction(predictedTier, confidence);
    }
  }, [predictedTier, confidence, setPrediction]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTierColor = (tier: BandwidthTier) => {
    switch (tier) {
      case 'high': return 'text-emerald-600 border-emerald-500/20 bg-emerald-50';
      case 'medium': return 'text-amber-600 border-amber-500/20 bg-amber-50';
      case 'low': return 'text-rose-600 border-rose-500/20 bg-rose-50';
    }
  };

  const getSignalIcon = (tier: BandwidthTier, className = "w-5 h-5") => {
    switch (tier) {
      case 'high': return <SignalHigh className={`${className} text-emerald-600`} />;
      case 'medium': return <SignalMedium className={`${className} text-amber-600`} />;
      case 'low': return <SignalLow className={`${className} text-rose-600`} />;
    }
  };

  const getWeatherEmoji = (weather: string) => {
    if (weather === 'rain') return '🌧️';
    if (weather === 'fog') return '🌫️';
    return '☀️';
  };

  return (
    <div className="absolute top-4 left-4 z-40 w-80 glass-panel rounded-2xl shadow-xl overflow-hidden no-print border border-purple-200 bg-white/90 text-slate-800">
      {/* Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-purple-100 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="font-semibold text-slate-800">Connection Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
            !isOnline 
              ? 'text-rose-600 border-rose-500/20 bg-rose-50' 
              : getTierColor(bandwidthTier)
          }`}>
            {!isOnline ? 'OFFLINE' : bandwidthTier.toUpperCase()}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Connection Mode Controller */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Network Mode</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoNetworkMode(true)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                    isAutoNetworkMode 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setIsAutoNetworkMode(false)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                    !isAutoNetworkMode 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {isAutoNetworkMode ? (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50">
                <div className="flex-shrink-0">
                  {!isOnline ? (
                    <WifiOff className="w-8 h-8 text-rose-600" />
                  ) : (
                    getSignalIcon(realDetectedTier, "w-8 h-8")
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-600">Automatic Detection</h4>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    {!isOnline 
                      ? 'Offline. Please check connection.'
                      : 'Adjusting streams reactively based on speed.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                <span className="text-[10px] text-slate-500 font-bold">Manual Force Tier:</span>
                <select
                  value={manualTier}
                  onChange={(e) => setManualTier(e.target.value as BandwidthTier)}
                  className="bg-white border border-purple-100 text-slate-700 text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  <option value="high">High (Video)</option>
                  <option value="medium">Medium (Audio)</option>
                  <option value="low">Low (Captions)</option>
                </select>
              </div>
            )}
          </div>

          {/* Metrics dashboard */}
          <div className="bg-white border border-purple-100 rounded-xl p-3 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-slate-400" /> Measured Speed:
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {!isOnline ? '0' : downlinkSpeed} Mbps
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-slate-400" /> Connection Type:
              </span>
              <span className="font-mono font-semibold text-slate-800 uppercase">
                {!isOnline ? 'none' : effectiveType}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" /> Latency (RTT):
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {!isOnline ? '∞' : `${simulatedLatency} ms`}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" /> Packet Loss:
              </span>
              <span className={`font-mono font-semibold ${
                !isOnline ? 'text-rose-600' :
                simulatedLoss > 5 ? 'text-rose-600' : simulatedLoss > 1 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {!isOnline ? '100%' : `${simulatedLoss}%`}
              </span>
            </div>

            {/* Visual health bar indicator */}
            <div className="pt-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    !isOnline ? 'bg-rose-500 w-0' :
                    bandwidthTier === 'high' ? 'bg-emerald-500 w-full' : 
                    bandwidthTier === 'medium' ? 'bg-amber-500 w-1/2' : 'bg-rose-500 w-[12%]'
                  }`} 
                />
              </div>
            </div>
          </div>

          {/* Predictive Insight (Beta) Section */}
          <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-600" />
                Predictive Mode (Beta)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={predictiveModeEnabled} 
                  onChange={(e) => setPredictiveModeEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              {/* Location Select (Fallback/Override) */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Location:
                </span>
                <select
                  value={detectedLocation}
                  onChange={(e) => setSelectedLocationOverride(e.target.value)}
                  className="bg-white border border-purple-100 text-slate-700 text-[10px] rounded-lg px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Coimbatore City">Coimbatore City</option>
                  <option value="Ooty">Ooty</option>
                  <option value="Kodaikanal">Kodaikanal</option>
                </select>
              </div>

              {/* Weather Info */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Weather Forecast:</span>
                <span className="font-semibold text-slate-700 capitalize flex items-center gap-1">
                  {getWeatherEmoji(detectedWeather)} {detectedWeather}
                </span>
              </div>

              {/* Predicted Tier */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Predicted Tier:</span>
                <span className={`font-semibold capitalize ${
                  predictedTier === 'high' ? 'text-emerald-600' :
                  predictedTier === 'medium' ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {isPredictiveLoading ? 'Loading...' : predictedTier}
                </span>
              </div>

              {/* Confidence Score */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Confidence Score:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {isPredictiveLoading ? '...' : `${Math.round(confidence * 100)}%`}
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 leading-normal border-t border-purple-100/50 pt-2 italic">
              ℹ️ Based on demo dataset — will improve with real usage data.
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2 rounded-lg border border-slate-100">
            💡 <strong className="text-slate-700">Simulate Throttling:</strong> Open browser DevTools, select <strong className="text-blue-600">Network</strong> tab, and change throttling preset to <strong className="text-amber-600">Fast 3G</strong> or <strong className="text-rose-600">Slow 3G</strong>.
          </div>
        </div>
      )}
    </div>
  );
};

export default BandwidthSimulator;
