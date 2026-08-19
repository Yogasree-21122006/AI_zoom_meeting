import React, { useRef, useEffect } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Waveform } from './Waveform';
import { VideoOff, MicOff, WifiOff, Camera, Hand } from 'lucide-react';

interface MeetingGridProps {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
}

// Helper component to bind MediaStream to <video> tags
const VideoTile: React.FC<{ stream: MediaStream | null; isLocal: boolean; className?: string }> = ({ stream, isLocal, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={className}
    />
  );
};

export const MeetingGrid: React.FC<MeetingGridProps> = ({ localStream, remoteStreams }) => {
  const { 
    participants, 
    bandwidthTier, 
    isMuted, 
    isCameraOn,
    isHandRaised,
    isPresentationViewerOpen 
  } = useMeetingStore();

  const gridColsClass = isPresentationViewerOpen 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`w-full ${isPresentationViewerOpen ? 'max-w-none' : 'max-w-6xl'} mx-auto px-2 sm:px-4 flex-grow flex items-center justify-center py-2 min-h-[260px]`}>
      {/* High Bandwidth: Video Grid */}
      {bandwidthTier === 'high' && (
        <motion.div 
          layout 
          className={`grid ${gridColsClass} gap-3 sm:gap-4 w-full`}
        >
          {participants.map((participant) => {
            const isLocal = participant.id === 'local-user';
            
            // Sync local settings with store
            const pCameraOn = isLocal ? isCameraOn : participant.isCameraOn;
            const pMuted = isLocal ? isMuted : participant.isMuted;
            const pHandRaised = isLocal ? isHandRaised : participant.isHandRaised;
            const isSpeaking = participant.isSpeaking;
            const activeStream = isLocal ? localStream : remoteStreams[participant.id];
            const reaction = participant.lastReaction;

            return (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`relative aspect-video rounded-2xl overflow-hidden glass-card transition-all duration-300 flex flex-col items-center justify-center border ${
                  pHandRaised
                    ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-400'
                    : isSpeaking 
                    ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] border-blue-400' 
                    : 'border-purple-200/60 bg-white/70 shadow-sm'
                }`}
              >
                {/* Hand Raised Banner */}
                {pHandRaised && (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 bg-amber-500 text-white font-bold text-[10px] rounded-full shadow-lg border border-white/20 flex items-center gap-1 animate-bounce">
                    <Hand className="w-3 h-3 fill-white" />
                    <span>Hand Raised</span>
                  </div>
                )}

                {/* Floating Reaction Bubble on Participant Tile */}
                <AnimatePresence>
                  {reaction && (
                    <motion.div
                      initial={{ scale: 0.2, y: 15, opacity: 0 }}
                      animate={{ scale: 1.2, y: 0, opacity: 1 }}
                      exit={{ scale: 0.8, y: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute z-30 bottom-12 right-4 text-3xl filter drop-shadow-md bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-purple-200"
                    >
                      {reaction}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Video Stream (if camera is on & stream exists) */}
                {pCameraOn && activeStream ? (
                  <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <VideoTile 
                      stream={activeStream} 
                      isLocal={isLocal} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Camera Indicator Icon */}
                    <Camera className="absolute top-3 left-3 w-4 h-4 text-white/80 drop-shadow-md" />
                  </div>
                ) : (
                  // Camera is off
                  <div className="absolute inset-0 w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 sm:gap-3">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold text-white shadow-md ${participant.avatarColor} border border-white/20`}>
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 bg-white border border-slate-200/60 px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm">
                      <VideoOff className="w-3 h-3 text-rose-500" /> Camera Off
                    </span>
                    {!isLocal && activeStream && (
                      <div className="hidden">
                        <VideoTile stream={activeStream} isLocal={false} />
                      </div>
                    )}
                  </div>
                )}

                {/* Participant Label & Indicators */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                  <span className="text-[11px] sm:text-xs font-semibold text-white bg-slate-950/75 py-0.5 px-2 rounded-lg border border-white/10 backdrop-blur-sm truncate max-w-[70%]">
                    {participant.name}
                    {participant.role === 'teacher' && (
                      <span className="ml-1.5 text-[8px] sm:text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                        T
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    {pMuted && (
                      <span className="p-1 rounded-lg bg-rose-500/20 text-rose-600 border border-rose-500/30 backdrop-blur-sm">
                        <MicOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </span>
                    )}
                    {isSpeaking && (
                      <span className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
                        <Waveform isSpeaking={true} colorClass="bg-emerald-500" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Medium Bandwidth: Audio Only Grid */}
      {bandwidthTier === 'medium' && (
        <motion.div 
          layout 
          className={`grid ${gridColsClass} gap-3 sm:gap-4 w-full`}
        >
          {participants.map((participant) => {
            const isLocal = participant.id === 'local-user';
            const pMuted = isLocal ? isMuted : participant.isMuted;
            const pHandRaised = isLocal ? isHandRaised : participant.isHandRaised;
            const isSpeaking = participant.isSpeaking;
            const activeStream = isLocal ? localStream : remoteStreams[participant.id];
            const reaction = participant.lastReaction;

            return (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-2xl border bg-white/75 border-purple-200/60 shadow-sm backdrop-blur-sm transition-all duration-300 flex items-center gap-3.5 relative ${
                  pHandRaised
                    ? 'ring-2 ring-amber-400 border-amber-300'
                    : isSpeaking 
                    ? 'border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30' 
                    : ''
                }`}
              >
                {/* Hand Raised badge */}
                {pHandRaised && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white font-bold text-[9px] rounded-full flex items-center gap-1 animate-pulse">
                    <Hand className="w-2.5 h-2.5 fill-white" />
                    <span>Raised</span>
                  </div>
                )}

                {/* Reaction badge */}
                {reaction && (
                  <div className="absolute -top-2 right-12 text-2xl bg-white shadow-md rounded-full px-1 border border-purple-200 animate-bounce">
                    {reaction}
                  </div>
                )}

                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shadow-sm ${participant.avatarColor} border border-white/20`}>
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {isSpeaking && (
                    <span className="absolute -inset-1 rounded-full border border-emerald-400/50 animate-ping opacity-75 pointer-events-none" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{participant.name}</span>
                    {participant.role === 'teacher' && (
                      <span className="text-[8px] bg-blue-50/50 text-blue-600 border border-blue-200 px-1 py-0.2 rounded font-bold uppercase">
                        Teacher
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    {pMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Active Audio'}
                  </span>
                </div>

                <div className="flex-shrink-0">
                  {pMuted ? (
                    <span className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 inline-block">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 h-9 w-10 flex items-center justify-center">
                      <Waveform isSpeaking={isSpeaking} colorClass={isSpeaking ? "bg-emerald-500" : "bg-slate-400"} />
                    </div>
                  )}
                </div>

                {!isLocal && activeStream && (
                  <div className="hidden">
                    <VideoTile stream={activeStream} isLocal={false} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Low Bandwidth: Caption-Only Dashboard */}
      {bandwidthTier === 'low' && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl bg-white border border-rose-200 rounded-3xl p-6 text-center shadow-md space-y-5"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
            <WifiOff className="w-7 h-7 animate-pulse" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">Low Bandwidth Mode</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Streaming video paused to save data. Transcripts are updating live with Supabase & Whisper AI.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Class Participants ({participants.length})
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-slate-700">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${participant.avatarColor}`}>
                    {participant.name[0]}
                  </div>
                  <span className="truncate font-medium">{participant.name}</span>
                  {participant.isHandRaised && <span className="text-[10px]">✋</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MeetingGrid;
