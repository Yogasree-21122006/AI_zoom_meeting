import React from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion } from 'framer-motion';
import { Waveform } from './Waveform';
import { VideoOff, MicOff, WifiOff, Camera } from 'lucide-react';

export const MeetingGrid: React.FC = () => {
  const { participants, bandwidthTier, isMuted, isCameraOn } = useMeetingStore();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex-grow flex items-center justify-center py-6 min-h-[400px]">
      {/* High Bandwidth: Video Grid */}
      {bandwidthTier === 'high' && (
        <motion.div 
          layout 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
        >
          {participants.map((participant) => {
            const isLocal = participant.id === 'local-user';
            
            // Sync local settings with store
            const pCameraOn = isLocal ? isCameraOn : participant.isCameraOn;
            const pMuted = isLocal ? isMuted : participant.isMuted;
            const isSpeaking = isLocal ? false : participant.isSpeaking;

            return (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`relative aspect-video rounded-2xl overflow-hidden glass-card transition-all duration-300 flex flex-col items-center justify-center ${
                  isSpeaking 
                    ? 'ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] border-emerald-400/40' 
                    : 'border-white/5'
                }`}
              >
                {/* Simulated Camera Video Stream */}
                {pCameraOn ? (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
                    {/* Visual noise / overlay effect */}
                    <div className="absolute inset-0 opacity-15 video-noise" />
                    
                    {/* Flowing background to simulate real-time action */}
                    <div className="w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
                    <div className="w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

                    {/* Camera Indicator Icon */}
                    <Camera className="absolute top-3 left-3 w-4 h-4 text-emerald-400/80" />

                    {/* Participant Initials Placeholder */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl ${participant.avatarColor}`}>
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                ) : (
                  // Camera is off
                  <div className="absolute inset-0 w-full h-full bg-slate-950/60 flex flex-col items-center justify-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-slate-100 shadow-lg ${participant.avatarColor} border border-white/10`}>
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded-full border border-white/5">
                      <VideoOff className="w-3 h-3 text-rose-400" /> Camera Off
                    </span>
                  </div>
                )}

                {/* Participant Label & Indicators */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <span className="text-xs font-semibold text-white bg-slate-950/75 py-1 px-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    {participant.name}
                    {participant.role === 'teacher' && (
                      <span className="ml-1.5 text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                        T
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {pMuted && (
                      <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 backdrop-blur-sm">
                        <MicOff className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isSpeaking && (
                      <span className="p-1 rounded-lg bg-teal-500/20 border border-teal-500/30 backdrop-blur-sm">
                        <Waveform isSpeaking={true} colorClass="bg-teal-400" />
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full"
        >
          {participants.map((participant) => {
            const isLocal = participant.id === 'local-user';
            const pMuted = isLocal ? isMuted : participant.isMuted;
            const isSpeaking = isLocal ? false : participant.isSpeaking;

            return (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-5 rounded-2xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-300 flex items-center gap-4 ${
                  isSpeaking 
                    ? 'border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30' 
                    : 'border-white/5'
                }`}
              >
                {/* Glowing speaking ring around avatar */}
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${participant.avatarColor} border border-white/10`}>
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {isSpeaking && (
                    <span className="absolute -inset-1 rounded-full border border-teal-400/50 animate-ping opacity-75 pointer-events-none" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-200 truncate">{participant.name}</span>
                    {participant.role === 'teacher' && (
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.2 rounded font-bold uppercase">
                        Teacher
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    {pMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Active Audio'}
                  </span>
                </div>

                <div className="flex-shrink-0">
                  {pMuted ? (
                    <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 inline-block">
                      <MicOff className="w-4 h-4" />
                    </span>
                  ) : (
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5 h-10 w-12 flex items-center justify-center">
                      <Waveform isSpeaking={isSpeaking} colorClass={isSpeaking ? "bg-teal-400" : "bg-slate-500"} />
                    </div>
                  )}
                </div>
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
          className="w-full max-w-2xl bg-slate-900/60 border border-rose-500/20 rounded-3xl p-6 text-center shadow-xl space-y-6"
        >
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <WifiOff className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-200">Bandwidth Critical</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Streaming media has been paused automatically to maintain your class connection. Read along with the high-contrast captions below.
            </p>
          </div>

          {/* Quick Participant list to show presence */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 text-left space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Class Roster ({participants.length})
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-slate-300">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${participant.avatarColor}`}>
                    {participant.name[0]}
                  </div>
                  <span className="truncate">{participant.name}</span>
                  {participant.role === 'teacher' && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 rounded uppercase">T</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 text-[11px] text-rose-400 border border-rose-500/15 bg-rose-500/5 px-3 py-1.5 rounded-xl max-w-sm mx-auto font-mono">
            ⚠️ Consuming ~15 Kbps (Saving 99% data)
          </div>
        </motion.div>
      )}
    </div>
  );
};
