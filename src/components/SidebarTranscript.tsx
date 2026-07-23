import React, { useEffect, useRef } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Award, User } from 'lucide-react';

export const SidebarTranscript: React.FC = () => {
  const {
    isTranscriptOpen,
    toggleTranscript,
    transcript,
    bandwidthTier
  } = useMeetingStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript.length, isTranscriptOpen]);

  return (
    <AnimatePresence>
      {isTranscriptOpen && (
        <motion.div
          initial={{ x: 380, opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-80 md:w-96 bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col z-30 no-print"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Class Notes & Transcript</h3>
                <p className="text-[10px] text-slate-400">Captured in real-time</p>
              </div>
            </div>
            <button
              onClick={toggleTranscript}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript Entries list */}
          <div 
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-900/50"
          >
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                <FileText className="w-12 h-12 mb-3 stroke-[1.5] text-slate-600" />
                <p className="text-sm font-medium">No messages captured yet.</p>
                <p className="text-xs text-slate-600 mt-1">Transcripts populate automatically as people speak.</p>
              </div>
            ) : (
              transcript.map((entry) => {
                const isTeacher = entry.role === 'teacher' || entry.sender.toLowerCase().includes('prof');
                const isSystem = entry.sender === 'System';

                if (isSystem) {
                  return (
                    <div key={entry.id} className="text-center py-1">
                      <span className="inline-block px-3 py-1 bg-slate-950/60 text-slate-400 text-[10px] rounded-full border border-white/5 font-mono">
                        {entry.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={entry.id} className="group flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-0.5 rounded-md ${isTeacher ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                          {isTeacher ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </span>
                        <span className={`text-xs font-semibold ${isTeacher ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {entry.sender}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border uppercase ${
                          isTeacher 
                            ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' 
                            : 'border-slate-800 text-slate-400 bg-slate-800/10'
                        }`}>
                          {isTeacher ? 'Teacher' : 'Student'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                    </div>
                    <div className="pl-6 text-sm text-slate-300 font-normal leading-relaxed border-l-2 border-slate-800 group-hover:border-slate-700 transition-colors py-0.5">
                      {entry.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick info footer */}
          <div className="p-3 bg-slate-950/40 border-t border-white/10 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Bandwidth status: <strong className="capitalize">{bandwidthTier}</strong></span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Auto-saved local session</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
