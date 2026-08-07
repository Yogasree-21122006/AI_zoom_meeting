import React, { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Award, User } from 'lucide-react';

export const SidebarTranscript: React.FC = () => {
  const {
    isTranscriptOpen,
    toggleTranscript,
    transcript,
    bandwidthTier,
    sendChatMessageFn
  } = useMeetingStore();

  const [messageText, setMessageText] = useState('');
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !sendChatMessageFn) return;
    sendChatMessageFn(messageText.trim());
    setMessageText('');
  };

  return (
    <AnimatePresence>
      {isTranscriptOpen && (
        <motion.div
          initial={{ x: 380, opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-80 md:w-96 bg-white border-l border-purple-200 shadow-2xl flex flex-col z-30 no-print"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Class Notes & Transcript</h3>
                <p className="text-[10px] text-slate-500">Captured in real-time</p>
              </div>
            </div>
            <button
              onClick={toggleTranscript}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript Entries list */}
          <div 
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50"
          >
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <FileText className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300" />
                <p className="text-sm font-semibold">No messages captured yet.</p>
                <p className="text-xs text-slate-400 mt-1">Transcripts populate automatically as people speak.</p>
              </div>
            ) : (
              transcript.map((entry) => {
                const isTeacher = entry.role === 'teacher' || entry.sender.toLowerCase().includes('prof');
                const isSystem = entry.sender === 'System';

                if (isSystem) {
                  return (
                    <div key={entry.id} className="text-center py-1">
                      <span className="inline-block px-3 py-1 bg-slate-200 text-slate-600 text-[10px] rounded-full border border-slate-300 font-mono font-semibold">
                        {entry.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={entry.id} className="group flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-0.5 rounded-md ${isTeacher ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {isTeacher ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </span>
                        <span className={`text-xs font-bold ${isTeacher ? 'text-blue-700' : 'text-slate-700'}`}>
                          {entry.sender}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${
                          isTeacher 
                            ? 'border-blue-200 text-blue-600 bg-blue-50/30' 
                            : 'border-slate-200 text-slate-500 bg-slate-100/50'
                        }`}>
                          {isTeacher ? 'Teacher' : 'Student'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{entry.timestamp}</span>
                    </div>
                    <div className="pl-6 text-sm text-slate-600 font-normal leading-relaxed border-l-2 border-slate-200 group-hover:border-slate-300 transition-colors py-0.5">
                      {entry.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Send Input Box */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-purple-100 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={sendChatMessageFn ? "Type a message to peers..." : "Chat disabled (connecting...)"}
              value={messageText}
              disabled={!sendChatMessageFn}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-grow bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || !sendChatMessageFn}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm"
            >
              Send
            </button>
          </form>

          {/* Quick info footer */}
          <div className="p-3 bg-purple-50/50 border-t border-purple-100 text-[10px] text-slate-500 flex justify-between items-center font-semibold">
            <span>Bandwidth status: <strong className="capitalize text-blue-600">{bandwidthTier}</strong></span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3 text-slate-400" /> Auto-saved local session</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
