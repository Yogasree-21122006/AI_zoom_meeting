import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  FileText, 
  Printer, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowLeft, 
  CheckSquare, 
  Lightbulb, 
  FileSpreadsheet 
} from 'lucide-react';

export const PostMeetingSummary: React.FC = () => {
  const { 
    transcript, 
    participants, 
    meetingDuration, 
    roomId, 
    setMeetingStatus 
  } = useMeetingStore();

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  // Format seconds to readable MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Mock AI summary data
  const aiSummary = {
    title: "Geography 101: Water Cycle & Aquifers",
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    keyTakeaways: [
      "Reviewed the main stages of the water cycle: Evaporation, Transpiration, Condensation, and Precipitation.",
      "Discussed how soil density impacts percolation. Sand features high percolation rates due to spacing, whereas compact clay blocks infiltration.",
      "Identified that clay-rich ground surfaces trigger immediate runoff, leading to increased erosion and preventing aquifer recharging.",
      "Clarified that transpiration is water loss specifically from plants/leaves, which is separate from standard ground evaporation."
    ],
    decisions: [
      "Midterm exam will officially require drawing and labeling the percolation-groundwater flow diagram.",
      "Weekly lab class will be dedicated to testing water infiltration rates in different local soil samples."
    ],
    actionItems: [
      { assignee: "All Students", task: "Complete worksheets on transpiration vs. evaporation comparisons." },
      { assignee: "All Students", task: "Read chapter 4 on Aquifer Layers (Pages 120-135) for Monday." },
      { assignee: "Prof. Sarah", task: "Post the percolation diagram reference sheet on the portal." }
    ]
  };

  // Triggers browser print, which matches the styled PDF layout via CSS @media print
  const handlePrintPDF = () => {
    window.print();
  };

  // Secondary Text Download for offline reference
  const handleDownloadText = () => {
    const header = `CLASS REPORT: ${aiSummary.title}\nDate: ${aiSummary.date}\nRoom Code: ${roomId}\nDuration: ${formatDuration(meetingDuration)}\n\n`;
    
    const takeawaysText = `--- KEY TAKEAWAYS ---\n` + aiSummary.keyTakeaways.map(t => `- ${t}`).join('\n') + `\n\n`;
    const decisionsText = `--- DECISIONS MADE ---\n` + aiSummary.decisions.map(d => `- ${d}`).join('\n') + `\n\n`;
    const actionsText = `--- ACTION ITEMS ---\n` + aiSummary.actionItems.map(a => `- [${a.assignee}]: ${a.task}`).join('\n') + `\n\n`;
    
    const transcriptText = `--- DIALOGUE TRANSCRIPT ---\n` + 
      transcript.map(entry => `[${entry.timestamp}] ${entry.sender}: ${entry.text}`).join('\n');
      
    const fullTextBlob = header + takeawaysText + decisionsText + actionsText + transcriptText;
    
    const element = document.createElement("a");
    const file = new Blob([fullTextBlob], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Class_Summary_${roomId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[5%] w-[40%] aspect-square rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-[-5%] right-[5%] w-[45%] aspect-square rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between no-print">
          <button 
            onClick={() => setMeetingStatus('landing')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/5 py-2 px-3.5 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Landing Page
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadText}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-white/5 bg-slate-900/60 hover:bg-slate-800 py-2 px-4 rounded-xl"
            >
              <Download className="w-4 h-4 text-slate-400" /> Save Notes (TXT)
            </button>
            <button 
              onClick={handlePrintPDF}
              className="flex items-center gap-2 text-xs font-semibold text-white transition-colors border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/10"
            >
              <Printer className="w-4 h-4" /> Download PDF Summary
            </button>
          </div>
        </div>

        {/* Print Layout Header (Invisible on standard dark mode screen) */}
        <div className="hidden print:block text-black space-y-2 border-b-2 border-slate-300 pb-4">
          <h1 className="text-2xl font-bold">{aiSummary.title}</h1>
          <p className="text-sm text-slate-600">{aiSummary.date} | Room Code: {roomId}</p>
          <p className="text-xs text-slate-500">Duration: {formatDuration(meetingDuration)} | Attendees: {participants.map(p=>p.name).join(', ')}</p>
        </div>

        {/* Main report layout */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl print-card border border-white/10">
          
          {/* Metadata banner */}
          <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-6 print:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 print:text-black">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Class Title</span>
                <span className="font-bold text-slate-200 text-sm truncate block max-w-[150px] sm:max-w-none print:text-black">{aiSummary.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 print:text-black">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Duration</span>
                <span className="font-bold text-slate-200 text-sm print:text-black">{formatDuration(meetingDuration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 print:text-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Attendees</span>
                <span className="font-bold text-slate-200 text-sm print:text-black">{participants.length} Active</span>
              </div>
            </div>
          </div>

          {/* AI generated takeaways block */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 print:text-black">
              <Lightbulb className="w-4 h-4" /> Key Discussion Points
            </h3>
            <ul className="space-y-2.5 pl-5 list-disc text-sm text-slate-300 print:text-black leading-relaxed">
              {aiSummary.keyTakeaways.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Decisions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 print:text-black">
              <FileSpreadsheet className="w-4 h-4" /> Decisions Made
            </h3>
            <ul className="space-y-2.5 pl-5 list-disc text-sm text-slate-300 print:text-black leading-relaxed">
              {aiSummary.decisions.map((decision, index) => (
                <li key={index} className="marker:text-emerald-400 print:marker:text-black">
                  {decision}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 print:text-black">
              <CheckSquare className="w-4 h-4" /> Action Items
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiSummary.actionItems.map((action, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 print:border-slate-300 print:bg-white flex flex-col gap-1 justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">
                    Assignee: {action.assignee}
                  </span>
                  <p className="text-sm text-slate-200 font-medium print:text-black mt-1 leading-normal">
                    {action.task}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Participant attendance list */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 print:text-black">
              <Users className="w-4 h-4" /> Roster Attendance Log
            </h3>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {participants.map((p) => (
                <span 
                  key={p.id} 
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    p.role === 'teacher' 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 print:text-black print:border-slate-300' 
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 print:text-black print:border-slate-300'
                  }`}
                >
                  {p.name} ({p.role})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable Transcript Accordion (Hidden on printing unless expanded) */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/10 print:border-slate-300 print:bg-white text-slate-200 print:text-black overflow-hidden">
          <button 
            onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
            className="w-full flex items-center justify-between text-left focus:outline-none no-print"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-sm">Full Class Dialogue Transcript ({transcript.length} logs)</h3>
                <p className="text-[10px] text-slate-400">Expand to view exact transcript history</p>
              </div>
            </div>
            {isTranscriptExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Print Header for Transcript (always visible when printed if expanded) */}
          <div className="hidden print:block text-black font-bold border-b border-slate-300 pb-2 mb-4">
            Full Dialogue Transcript
          </div>

          {(isTranscriptExpanded || window.matchMedia('print').matches) && (
            <div className={`mt-6 space-y-4 max-h-96 overflow-y-auto pr-2 pt-2 border-t border-white/10 print:border-slate-200 print:max-h-none ${!isTranscriptExpanded ? 'print:block hidden' : 'block'}`}>
              {transcript.map((entry) => {
                const isTeacher = entry.role === 'teacher' || entry.sender.toLowerCase().includes('prof');
                if (entry.sender === 'System') return null;

                return (
                  <div key={entry.id} className="text-xs leading-normal">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 print:text-slate-600 mb-1">
                      <span className={`font-semibold ${isTeacher ? 'text-indigo-400 print:text-indigo-800' : 'text-slate-200 print:text-slate-900'}`}>
                        {entry.sender} ({isTeacher ? 'Teacher' : 'Student'})
                      </span>
                      <span className="font-mono">{entry.timestamp}</span>
                    </div>
                    <p className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5 text-slate-300 print:bg-white print:border-slate-200 print:text-black italic">
                      "{entry.text}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
