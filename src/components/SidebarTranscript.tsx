import React, { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Download, 
  Bot, 
  Send, 
  Sparkles, 
  Search, 
  Lightbulb, 
  Tag
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const SidebarTranscript: React.FC = () => {
  const {
    isTranscriptOpen,
    toggleTranscript,
    transcript,
    bandwidthTier,
    sendChatMessageFn,
    aiSummaryData,
    isSummarizing,
    generateAiSummary,
    customGeminiKey,
    searchFilter,
    setSearchFilter,
    simplifyTranscriptEntry,
    isSimplifyingId,
    toggleSmartTools,
    setActiveSmartToolTab
  } = useMeetingStore();

  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'ask-ai'>('transcript');
  
  // Ask AI Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState<{ question: string; answer: string; time: string }[]>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when transcript updates (if not actively searching)
  useEffect(() => {
    if (scrollRef.current && !searchFilter) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript.length, isTranscriptOpen, searchFilter]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !sendChatMessageFn) return;
    sendChatMessageFn(messageText.trim());
    setMessageText('');
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || isAskingAi) return;

    const currentQ = aiQuestion.trim();
    setAiQuestion('');
    setIsAskingAi(true);

    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
          transcript: transcript.filter(t => t.sender !== 'System'),
          apiKey: customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      setAiAnswers(prev => [
        ...prev,
        {
          question: currentQ,
          answer: data.answer || 'No response generated.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setAiAnswers(prev => [
        ...prev,
        {
          question: currentQ,
          answer: `Could not answer: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAskingAi(false);
      setTimeout(() => {
        if (aiScrollRef.current) {
          aiScrollRef.current.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Filter transcripts by search keyword (Feature 19)
  const displayedTranscripts = searchFilter.trim()
    ? transcript.filter(t => 
        t.text.toLowerCase().includes(searchFilter.toLowerCase()) || 
        t.sender.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : transcript;

  return (
    <AnimatePresence>
      {isTranscriptOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white border-l border-purple-200 shadow-2xl flex flex-col z-30 no-print"
        >
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Class Notes & AI Studio</h3>
                <p className="text-[10px] text-slate-500">Live Multi-Speaker Attribution & Supabase Synced</p>
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

          {/* Tabs Selector (Notes, Summary, Ask AI) */}
          <div className="flex border-b border-purple-100 bg-white text-xs font-bold">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'transcript'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('ask-ai')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ask-ai'
                  ? 'border-purple-600 text-purple-700 bg-purple-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-600" />
              <span>Ask AI</span>
            </button>
          </div>

          {/* Transcript Entries list (Dialogue Tab with Search & Multi-Speaker tags) */}
          {activeTab === 'transcript' && (
            <>
              {/* Meeting Knowledge Search Bar (Feature 19) */}
              <div className="p-2.5 bg-slate-50 border-b border-purple-100 flex items-center gap-2">
                <div className="relative flex-grow">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dialogue keywords..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50"
              >
                {displayedTranscripts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <FileText className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300" />
                    <p className="text-sm font-semibold">{searchFilter ? 'No matching dialogue found.' : 'No messages captured yet.'}</p>
                    <p className="text-xs text-slate-400 mt-1">Transcripts populate automatically with exact speaker names.</p>
                  </div>
                ) : (
                  displayedTranscripts.map((entry) => {
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

                    // Multi-Speaker Color Palette
                    const speakerColors = ['bg-blue-600 text-blue-700', 'bg-purple-600 text-purple-700', 'bg-emerald-600 text-emerald-700', 'bg-amber-600 text-amber-700'];
                    const colorIdx = Math.abs(entry.sender.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % speakerColors.length;

                    return (
                      <div key={entry.id} className="group bg-white border border-purple-100 rounded-2xl p-3 shadow-xs space-y-1.5 transition-all hover:border-purple-200">
                        {/* Speaker Header & Moment Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isTeacher ? 'bg-blue-600' : speakerColors[colorIdx].split(' ')[0]}`}>
                              {entry.sender.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {entry.sender}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${
                              isTeacher 
                                ? 'border-blue-200 text-blue-600 bg-blue-50/50' 
                                : 'border-purple-200 text-purple-600 bg-purple-50/50'
                            }`}>
                              {isTeacher ? 'Teacher' : 'Student'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Moment Tag Badge (Feature 6) */}
                            {entry.momentTag && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase ${
                                entry.momentTag === 'deadline' ? 'bg-rose-50 border border-rose-200 text-rose-700' :
                                entry.momentTag === 'decision' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                                entry.momentTag === 'exam' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                                entry.momentTag === 'question' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                                'bg-purple-50 border border-purple-200 text-purple-700'
                              }`}>
                                <Tag className="w-2.5 h-2.5" />
                                <span>{entry.momentTag}</span>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">{entry.timestamp}</span>
                          </div>
                        </div>

                        {/* Spoken Text */}
                        <div className="text-xs text-slate-750 font-normal leading-relaxed pl-6">
                          {entry.text}
                        </div>

                        {/* Simplified Concept View if generated (Feature 11 & 12) */}
                        {entry.simplifiedText && (
                          <div className="mt-2 ml-6 p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl text-[11px] text-purple-950 leading-relaxed space-y-1">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-purple-700 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-500" />
                              <span>Simplified Concept (Tanglish)</span>
                            </span>
                            <p>{entry.simplifiedText}</p>
                          </div>
                        )}

                        {/* 1-Click Simplify Button */}
                        <div className="pl-6 pt-1 flex items-center justify-end">
                          <button
                            onClick={() => simplifyTranscriptEntry(entry.id, 'tanglish')}
                            disabled={isSimplifyingId === entry.id}
                            className="text-[10px] text-purple-600 hover:text-purple-850 hover:bg-purple-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-semibold"
                          >
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            <span>{isSimplifyingId === entry.id ? 'Simplifying...' : 'Simplify Concept'}</span>
                          </button>
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
                  placeholder={sendChatMessageFn ? "Type a message to peers..." : "Chat connecting..."}
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
            </>
          )}

          {/* AI Notes Summary Tab */}
          {activeTab === 'summary' && (
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-16 text-center flex-grow animate-fadeIn">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 animate-pulse">Generating English Summary...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                    Analyzing discussion and translating into structured English notes.
                  </p>
                </div>
              ) : aiSummaryData ? (
                <div className="space-y-4 flex-grow animate-fadeIn">
                  <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="border-b border-purple-100 pb-2">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Meeting Topic</span>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-0.5 leading-snug">{aiSummaryData.title}</h4>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">💡 Key Takeaways</h5>
                      <ul className="space-y-1.5 pl-1">
                        {aiSummaryData.keyTakeaways?.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-blue-600 font-bold">•</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {aiSummaryData.decisions && aiSummaryData.decisions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">🤝 Decisions & Highlights</h5>
                        <ul className="space-y-1.5 pl-1">
                          {aiSummaryData.decisions.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSummaryData.actionItems && aiSummaryData.actionItems.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">📋 Action Items</h5>
                        <div className="space-y-1.5">
                          {aiSummaryData.actionItems.map((item: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-purple-50/40 border border-purple-100 rounded-xl text-xs">
                              <span className="font-bold text-purple-800 block text-[9px] uppercase tracking-wider">Assignee: {item.assignee}</span>
                              <p className="text-slate-750 mt-0.5 font-medium">{item.task}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => generateAiSummary()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Regenerate English Summary
                    </button>
                    <button
                      onClick={() => {
                        setActiveSmartToolTab('notes');
                        toggleSmartTools(true);
                      }}
                      className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-colors border border-purple-200"
                    >
                      Open Revision Studio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center flex-grow p-4 animate-fadeIn">
                  <div className="p-3.5 bg-purple-50 border border-purple-100 text-purple-650 rounded-full mb-3 shadow-sm">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Summarize this Class</h4>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
                    Generate an official English summary with key takeaways, decisions, and action items using Gemini AI.
                  </p>
                  
                  <button
                    onClick={() => generateAiSummary()}
                    className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-blue-500/15 active:scale-95"
                  >
                    Generate English Summary
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ask AI / In-Meeting Queries Tab */}
          {activeTab === 'ask-ai' && (
            <div className="flex-grow flex flex-col justify-between bg-slate-50/50 overflow-hidden">
              <div ref={aiScrollRef} className="flex-grow p-3.5 overflow-y-auto space-y-3.5">
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>AI Assistant (Antigravity Companion)</span>
                  </div>
                  <p className="text-[11px] text-purple-750 leading-relaxed">
                    Ask anything — about this Zoom meeting, lecture concepts, coding, or any general topics. Answers are structured with clean bullet points!
                  </p>
                </div>

                {aiAnswers.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 animate-fadeIn">
                    <div className="bg-blue-600 text-white p-2.5 px-3 rounded-2xl rounded-tr-xs text-xs ml-8 shadow-xs">
                      <span className="font-semibold">{item.question}</span>
                    </div>

                    <div className="bg-white border border-purple-100 p-3.5 rounded-2xl rounded-tl-xs text-xs mr-2 text-slate-800 shadow-sm leading-relaxed space-y-2">
                      <div className="flex items-center justify-between text-[9px] text-purple-600 font-bold uppercase tracking-wider border-b border-purple-50 pb-1.5">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-purple-600" />
                          <span>Gemini AI Response</span>
                        </span>
                        <span className="text-slate-400 font-mono">{item.time}</span>
                      </div>
                      
                      <MarkdownRenderer content={item.answer} />
                    </div>
                  </div>
                ))}

                {isAskingAi && (
                  <div className="p-3 bg-white border border-purple-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2 animate-pulse shadow-xs">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing and formulating response...</span>
                  </div>
                )}
              </div>

              {/* Ask AI Input Box */}
              <form onSubmit={handleAskAi} className="p-3 bg-white border-t border-purple-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything (meeting notes, coding, concepts)..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="flex-grow bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!aiQuestion.trim() || isAskingAi}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold p-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Quick info footer */}
          <div className="p-3 bg-purple-50/50 border-t border-purple-100 text-[10px] text-slate-500 flex justify-between items-center font-semibold">
            <span>Bandwidth status: <strong className="capitalize text-blue-600">{bandwidthTier}</strong></span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3 text-slate-400" /> Supabase Synced</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidebarTranscript;
