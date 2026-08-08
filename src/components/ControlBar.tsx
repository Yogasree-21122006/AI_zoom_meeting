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
    transcriptLanguage,
    setTranscriptLanguage,
    transcriptionService,
    setTranscriptionService,
  } = useMeetingStore();

  const isCameraDisabled = bandwidthTier === 'medium' || bandwidthTier === 'low';
  const isMicDisabled = bandwidthTier === 'low';

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white/80 border border-purple-200 rounded-2xl backdrop-blur-lg shadow-lg max-w-4xl mx-auto w-full no-print">
      {/* Active Mode Label */}
      <div className="flex items-center gap-2">
        <Wifi className={`w-4 h-4 ${
          bandwidthTier === 'high' ? 'text-emerald-600' : 
          bandwidthTier === 'medium' ? 'text-amber-600' : 'text-rose-600'
        }`} />
        <span className="text-xs text-slate-600 font-bold hidden sm:inline">
          {bandwidthTier === 'high' && 'High Bandwidth Mode (Video)'}
          {bandwidthTier === 'medium' && 'Medium Bandwidth Mode (Audio-Only)'}
          {bandwidthTier === 'low' && 'Low Bandwidth Mode (Captions-Only)'}
        </span>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Transcription Service Selector */}
        <select
          value={transcriptionService}
          disabled={isMicDisabled}
          onChange={(e) => setTranscriptionService(e.target.value as 'webspeech' | 'whisper')}
          className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-3 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Transcription Engine"
        >
          <option value="webspeech">🎙️ Web Speech API</option>
          <option value="whisper">✨ Whisper AI (Cloud)</option>
        </select>

        {/* Language Selection */}
        <select
          value={transcriptLanguage}
          disabled={isMicDisabled}
          onChange={(e) => setTranscriptLanguage(e.target.value as 'ta-IN' | 'en-US')}
          className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-3 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Microphone Transcription Language"
        >
          <option value="ta-IN">Tamil (தமிழ்)</option>
          <option value="en-US">English (US)</option>
        </select>

        {/* Microphone Toggle */}
        <div className="relative group">
          <button
            onClick={toggleMute}
            disabled={isMicDisabled}
            className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${
              isMicDisabled
                ? 'bg-slate-50 border-rose-200 text-rose-300 cursor-not-allowed'
                : isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isMicDisabled ? "Mic disabled in Low Bandwidth mode" : isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted || isMicDisabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {isMicDisabled && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-rose-400 text-[10px] py-1 px-2 rounded-md shadow-lg border border-rose-500/20 whitespace-nowrap z-50">
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
                ? 'bg-slate-50 border-rose-200 text-rose-300 cursor-not-allowed'
                : !isCameraOn
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isCameraDisabled ? "Camera disabled to save bandwidth" : isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {!isCameraOn || isCameraDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          {isCameraDisabled && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-rose-400 text-[10px] py-1 px-2 rounded-md shadow-lg border border-rose-500/20 whitespace-nowrap z-50">
              {bandwidthTier === 'medium' ? 'Disabled in audio mode' : 'Disabled in captions mode'}
            </div>
          )}
        </div>

        {/* End / Leave Meeting */}
        <button
          onClick={leaveMeeting}
          className="px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 transition-colors border border-rose-500/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)]"
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
              ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-800'
          }`}
          title="Toggle Transcript Panel"
        >
          <FileText className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-bold">Notes & Transcript</span>
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
