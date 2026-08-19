import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  LogOut, 
  FileText, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Circle, 
  Square,
  Smile,
  Hand,
  Presentation,
  Sparkles
} from 'lucide-react';
import { QUICK_EMOJIS } from './EmojiReactions';
import { PresentationUploadModal } from './PresentationViewer';

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
    isTtsEnabled,
    toggleTts,
    isRecording,
    startRecordingFn,
    stopRecordingFn,
    sendReaction,
    toggleHandRaise,
    isHandRaised,
    sharedDocument,
    isPresentationViewerOpen,
    togglePresentationViewer,
    toggleSmartTools,
  } = useMeetingStore();

  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isCameraDisabled = bandwidthTier === 'medium' || bandwidthTier === 'low';
  const isMicDisabled = bandwidthTier === 'low';

  return (
    <>
      <PresentationUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5 bg-white/85 border border-purple-200 rounded-2xl backdrop-blur-lg shadow-lg max-w-5xl mx-auto w-full no-print">
        {/* Top bar on mobile (Active status + Transcript toggle) / Standard Left Side on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto border-b border-purple-100/50 pb-2 md:border-b-0 md:pb-0">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${
              bandwidthTier === 'high' ? 'text-emerald-600' : 
              bandwidthTier === 'medium' ? 'text-amber-600' : 'text-rose-600'
            }`} />
            <span className="text-xs text-slate-600 font-bold hidden sm:inline">
              {bandwidthTier === 'high' && 'High Bandwidth (Video)'}
              {bandwidthTier === 'medium' && 'Medium Bandwidth (Audio-Only)'}
              {bandwidthTier === 'low' && 'Low Bandwidth (Captions-Only)'}
            </span>
          </div>

          {/* Mobile-only toggle notes trigger */}
          <div className="md:hidden flex items-center gap-2">
            {sharedDocument && (
              <button
                onClick={() => togglePresentationViewer()}
                className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>PPT</span>
              </button>
            )}
            <button
              onClick={toggleTranscript}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all duration-300 ${
                isTranscriptOpen
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle Transcript Panel"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold">Notes</span>
            </button>
          </div>
        </div>

        {/* Middle Section: Selectors & Core Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Selectors grid - side by side on mobile */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            {/* Transcription Service Selector */}
            <select
              value={transcriptionService}
              disabled={isMicDisabled}
              onChange={(e) => setTranscriptionService(e.target.value as 'webspeech' | 'whisper')}
              className="w-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2 py-2 md:px-2.5 md:py-2.5 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-ellipsis overflow-hidden"
              title="Transcription Engine (Whisper AI sends to Supabase)"
            >
              <option value="whisper">✨ Whisper AI (Supabase)</option>
              <option value="webspeech">🎙️ Web Speech</option>
            </select>

            {/* Language Selection */}
            <select
              value={transcriptLanguage}
              disabled={isMicDisabled}
              onChange={(e) => setTranscriptLanguage(e.target.value as 'ta-IN' | 'en-US' | 'tanglish')}
              className="w-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2 py-2 md:px-2.5 md:py-2.5 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-ellipsis overflow-hidden"
              title="Microphone Transcription Language"
            >
              <option value="ta-IN">Tamil (தமிழ்)</option>
              <option value="en-US">English (US)</option>
              <option value="tanglish">Tanglish (Tamil in English)</option>
            </select>
          </div>

          {/* Core buttons row */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0 flex-wrap">
            {/* Microphone Toggle */}
            <div className="relative group">
              <button
                onClick={toggleMute}
                disabled={isMicDisabled}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  isMicDisabled
                    ? 'bg-slate-50 border-rose-200 text-rose-350 cursor-not-allowed'
                    : isMuted
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                    : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                }`}
                title={isMicDisabled ? "Mic disabled in Low Bandwidth mode" : isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted || isMicDisabled ? (
                  <MicOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Mic className="w-4 h-4 text-white" />
                )}
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
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  isCameraDisabled
                    ? 'bg-slate-50 border-rose-200 text-rose-350 cursor-not-allowed'
                    : !isCameraOn
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                    : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.25)]'
                }`}
                title={isCameraDisabled ? "Camera disabled to save bandwidth" : isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {!isCameraOn || isCameraDisabled ? (
                  <VideoOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Video className="w-4 h-4 text-white" />
                )}
              </button>
              {isCameraDisabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-rose-400 text-[10px] py-1 px-2 rounded-md shadow-lg border border-rose-500/20 whitespace-nowrap z-50">
                  {bandwidthTier === 'medium' ? 'Disabled in audio mode' : 'Disabled in captions mode'}
                </div>
              )}
            </div>

            {/* Zoom-style Emoji Reactions Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactionMenu(!showReactionMenu)}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  showReactionMenu 
                    ? 'bg-amber-100 border-amber-300 text-amber-700' 
                    : isHandRaised
                    ? 'bg-amber-500 border-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }`}
                title="Send Emoji Reactions / Raise Hand"
              >
                {isHandRaised ? <Hand className="w-4 h-4 fill-white" /> : <Smile className="w-4 h-4 text-amber-500" />}
              </button>

              {showReactionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowReactionMenu(false)} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white/95 backdrop-blur-md border border-purple-200 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-2.5">
                    {/* Raise Hand Toggle Button */}
                    <button
                      onClick={() => {
                        toggleHandRaise();
                        setShowReactionMenu(false);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                        isHandRaised
                          ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                      }`}
                    >
                      <Hand className="w-4 h-4 text-amber-600" />
                      <span>{isHandRaised ? '✋ Lower Hand' : '✋ Raise Hand'}</span>
                    </button>

                    {/* Quick Emojis Grid */}
                    <div className="border-t border-purple-100 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Live Reactions
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {QUICK_EMOJIS.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              sendReaction(item.emoji);
                              setShowReactionMenu(false);
                            }}
                            className="text-xl p-1.5 hover:bg-purple-100 rounded-xl transition-all transform hover:scale-125 active:scale-95 flex items-center justify-center"
                            title={item.label}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Presentation Share / View Trigger */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (sharedDocument) {
                    togglePresentationViewer();
                  } else {
                    setShowUploadModal(true);
                  }
                }}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  isPresentationViewerOpen
                    ? 'bg-blue-600 border-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                    : sharedDocument
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }`}
                title={sharedDocument ? "Toggle Presentation Slide Viewer" : "Upload PPT / PDF Presentation"}
              >
                <Presentation className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50">
                {sharedDocument ? "View Presentation Slides" : "Share PPT / PDF"}
              </div>
            </div>

            {/* TTS Toggle Button */}
            <div className="relative group">
              <button
                onClick={toggleTts}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  isTtsEnabled
                    ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }`}
                title="Toggle Speech Feedback (Alt+S) for Blind Users"
              >
                {isTtsEnabled ? (
                  <Volume2 className="w-4 h-4 text-white" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50">
                TTS Reader (Alt+S)
              </div>
            </div>

            {/* Recording Toggle */}
            <div className="relative group">
              {isRecording ? (
                <button
                  onClick={() => stopRecordingFn && stopRecordingFn()}
                  className="p-3 rounded-xl border border-rose-600 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-pulse animate-duration-1000"
                  title="Stop Recording Meeting"
                >
                  <Square className="w-4 h-4 fill-rose-600" />
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowRecordMenu(!showRecordMenu)}
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                      showRecordMenu ? 'bg-slate-200 border-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Record Meeting (Video or Audio)"
                  >
                    <Circle className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                  
                  {showRecordMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRecordMenu(false)} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-purple-100 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50 animate-fadeIn">
                        <button
                          onClick={() => {
                            setShowRecordMenu(false);
                            if (startRecordingFn) startRecordingFn('video');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <span>🎥</span> Record Video + Audio
                        </button>
                        <button
                          onClick={() => {
                            setShowRecordMenu(false);
                            if (startRecordingFn) startRecordingFn('audio');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <span>🎙️</span> Record Audio Only
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-40">
                {isRecording ? "Stop Recording" : "Record Meeting"}
              </div>
            </div>

            {/* End / Leave Meeting */}
            <button
              onClick={leaveMeeting}
              className="flex-grow sm:flex-grow-0 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 transition-colors border border-rose-500/40 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)]"
              title="Leave Class"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Leave</span>
            </button>
          </div>
        </div>

        {/* Desktop-only Notes & Transcript button & AI Tools trigger */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => toggleSmartTools(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-purple-500/20"
            title="Open Smart Classroom AI Studio (Quiz, Notes, Decisions, Q&A, Analytics)"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs">AI Studio</span>
          </button>

          <button
            onClick={toggleTranscript}
            className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
              isTranscriptOpen
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-800'
            }`}
            title="Toggle Transcript Panel"
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold">Notes</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ControlBar;
