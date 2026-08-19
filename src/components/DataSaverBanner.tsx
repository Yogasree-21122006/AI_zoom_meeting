import React from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  History, 
  X, 
  Activity, 
  TrendingDown,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const DataSaverBanner: React.FC = () => {
  const {
    dataSaverMode,
    toggleDataSaverMode,
    emergencyAudioMode,
    toggleEmergencyAudioMode,
    dataUsageMB,
    predictedTotalMB,
    smartRejoinInfo,
    dismissSmartRejoin,
    toggleSmartTools,
    setActiveSmartToolTab
  } = useMeetingStore();

  return (
    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto px-4 pt-2 z-20">
      {/* Smart Rejoin / Late Joiner Catch-up Alert (Features 1 & 21) */}
      {smartRejoinInfo && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-3.5 px-4 shadow-xl border border-purple-400/30 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl flex-shrink-0">
              <History className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-purple-200">Smart Rejoin Memory</span>
                <span className="text-[10px] bg-purple-400/20 px-2 py-0.2 rounded-full font-bold">
                  Missed ~{Math.ceil(smartRejoinInfo.missedSeconds / 60)} mins
                </span>
              </div>
              <p className="text-xs text-slate-200 truncate mt-0.5 font-medium">
                {smartRejoinInfo.missedSummary || 'Catch-up debrief is ready to review.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setActiveSmartToolTab('debrief');
                toggleSmartTools(true);
                dismissSmartRejoin();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              View Catch-Up
            </button>
            <button
              onClick={dismissSmartRejoin}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Live Data Usage, Data Saver & Emergency Audio Strip (Features 3, 4, 22) */}
      <div className="bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl p-2.5 px-4 shadow-sm flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* Left: MB Usage Predictor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-750">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Data Used: <strong className="text-blue-700 font-mono">{dataUsageMB} MB</strong></span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Est. 1 hr total: <strong className="text-slate-750 font-mono font-semibold">~{predictedTotalMB} MB</strong>
          </span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Smart Data Saver Toggle */}
          <button
            onClick={toggleDataSaverMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              dataSaverMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Automatically reduces video bitrate and quality to conserve mobile data"
          >
            <TrendingDown className={`w-3.5 h-3.5 ${dataSaverMode ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{dataSaverMode ? 'Data Saver: ON' : 'Data Saver'}</span>
          </button>

          {/* Emergency Audio / Text Mode Toggle */}
          <button
            onClick={toggleEmergencyAudioMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              emergencyAudioMode
                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs animate-pulse'
                : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200 text-slate-600'
            }`}
            title="Switches to ultra-low data text captions mode for critically weak internet"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${emergencyAudioMode ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>{emergencyAudioMode ? '🚨 Emergency Text ON' : 'Emergency Mode'}</span>
          </button>

          {/* Smart Tools Hub Trigger */}
          <button
            onClick={() => toggleSmartTools(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSaverBanner;
