import React from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { Mic, MicOff, Video, VideoOff, LogOut, FileText, Wifi } from 'lucide-react';

export const ControlBar: React.FC = () => {
  const {
    isMuted,
    isCameraOn,
    isTranscriptOpen,
    bandwidthTier,
    toggleMute,
    toggleCamera,
    toggleTranscript,
    leaveMeeting,
  } = useMeetingStore();

  const isCameraDisabled = bandwidthTier === 'medium' || bandwidthTier === 'low';
  const isMicDisabled = bandwidthTier === 'low';

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-lg shadow-2xl max-w-4xl mx-auto w-full no-print">
      {/* Active Mode Label */}
      <div className="flex items-center gap-2">
        <Wifi className={`w-4 h-4 ${
          bandwidthTier === 'high' ? 'text-emerald-400' : 
          bandwidthTier === 'medium' ? 'text-amber-400' : 'text-rose-400'
        }`} />
        <span className="text-xs text-slate-300 font-medium hidden sm:inline">
          {bandwidthTier === 'high' && 'High Bandwidth Mode (Video)'}
          {bandwidthTier === 'medium' && 'Medium Bandwidth Mode (Audio-Only)'}
          {bandwidthTier === 'low' && 'Low Bandwidth Mode (Captions-Only)'}
        </span>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Microphone Toggle */}
        <div className="relative group">
          <button
            onClick={toggleMute}
            disabled={isMicDisabled}
            className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${
              isMicDisabled
                ? 'bg-slate-950/40 border-rose-500/20 text-rose-500/50 cursor-not-allowed'
                : isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-700'
            }`}
            title={isMicDisabled ? "Mic disabled in Low Bandwidth mode" : isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted || isMicDisabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {isMicDisabled && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-rose-400 text-[10px] py-1 px-2 rounded-md shadow-lg border border-rose-500/20 whitespace-nowrap">
              Blocked in low bandwidth
            </div>
          )}
        </div>

        {/* Camera Toggle */}
        <div className="relative group">
          <button
            onClick={toggleCamera}
            disabled={isCameraDisabled}
            className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${
              isCameraDisabled
                ? 'bg-slate-950/40 border-rose-500/20 text-rose-500/50 cursor-not-allowed'
                : !isCameraOn
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-700'
            }`}
            title={isCameraDisabled ? "Camera disabled to save bandwidth" : isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {!isCameraOn || isCameraDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          {isCameraDisabled && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-rose-400 text-[10px] py-1 px-2 rounded-md shadow-lg border border-rose-500/20 whitespace-nowrap">
              {bandwidthTier === 'medium' ? 'Disabled in audio mode' : 'Disabled in captions mode'}
            </div>
          )}
        </div>

        {/* End / Leave Meeting */}
        <button
          onClick={leaveMeeting}
          className="px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-2 transition-colors border border-rose-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          title="Leave Class"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:inline text-sm">Leave Class</span>
        </button>
      </div>

      {/* Auxiliary actions */}
      <div>
        <button
          onClick={toggleTranscript}
          className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
            isTranscriptOpen
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Toggle Transcript Panel"
        >
          <FileText className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">Notes & Transcript</span>
        </button>
      </div>
    </div>
  );
};
