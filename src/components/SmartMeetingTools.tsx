import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  Award, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  MessageSquare,
  BarChart3,
  FileSpreadsheet,
  CheckSquare,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SmartMeetingTools: React.FC = () => {
  const {
    isSmartToolsOpen,
    toggleSmartTools,
    activeSmartToolTab,
    setActiveSmartToolTab,
    quizzes,
    isGeneratingQuiz,
    generateQuiz,
    submitQuizAnswer,
    studyNotes,
    isGeneratingNotes,
    generateStudyNotes,
    decisionItems,
    actionItemsList,
    toggleActionItemCompleted,
    addActionItem,
    meetingQuestions,
    toggleQuestionAnswered,
    speakerStats,
    topicChapters,
    generateTopicTimeline,
    meetingHealth,
    transcript
  } = useMeetingStore();

  const [copiedNotes, setCopiedNotes] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'unanswered'>('all');

  if (!isSmartToolsOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSelectQuizOption = (questionId: string, optionIdx: number, correctIdx: number) => {
    submitQuizAnswer(questionId, optionIdx);
    if (optionIdx === correctIdx) {
      triggerConfetti();
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addActionItem(newTaskText.trim(), newTaskAssignee.trim() || 'All Students');
    setNewTaskText('');
    setNewTaskAssignee('');
  };

  const copyStudyNotes = () => {
    if (!studyNotes) return;
    const text = `# ${studyNotes.title}\n\n## Overview\n${studyNotes.subjectOverview}\n\n## Key Definitions\n${studyNotes.keyDefinitions.map(d => `- **${d.term}**: ${d.definition}`).join('\n')}\n\n## Core Concepts\n${studyNotes.coreConcepts.map(c => `### ${c.title}\n${c.explanation}\n> Key Takeaway: ${c.keyPoint}`).join('\n\n')}\n\n## Exam Highlights\n${studyNotes.examHighlights.map(e => `- ${e}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const filteredQuestions = meetingQuestions.filter(q => 
    questionFilter === 'all' ? true : !q.isAnswered
  );

  const TABS = [
    { id: 'quiz', label: 'Live Quiz', icon: HelpCircle, badge: quizzes.length > 0 ? `${quizzes.length}` : '' },
    { id: 'notes', label: 'Study Notes', icon: BookOpen, badge: studyNotes ? 'Ready' : '' },
    { id: 'decisions', label: 'Decisions & Tasks', icon: CheckSquare, badge: `${actionItemsList.length + decisionItems.length}` },
    { id: 'questions', label: 'Questions', icon: MessageSquare, badge: `${meetingQuestions.length}` },
    { id: 'timeline', label: 'Timeline', icon: Clock, badge: topicChapters.length > 0 ? `${topicChapters.length}` : '' },
    { id: 'stats', label: 'Speaker Analytics', icon: BarChart3, badge: '' },
    { id: 'debrief', label: 'Debrief Sheet', icon: FileSpreadsheet, badge: '' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-4xl w-full h-[92vh] max-h-[740px] flex flex-col overflow-hidden relative">
        
        {/* Sticky Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 border-b border-purple-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-purple-600 text-white rounded-2xl shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-850">Smart Classroom AI Studio</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold">
                  AI Companion Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Live Quizzes, Study Notes, Decisions, Question Collector & Speaker Analytics</p>
            </div>
          </div>

          <button
            onClick={() => toggleSmartTools(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-white/80 transition-all flex-shrink-0"
            title="Close AI Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALWAYS VISIBLE STICKY TABS BAR (High Contrast Navigation) */}
        <div className="sticky top-0 z-30 bg-white border-b border-purple-100 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSmartToolTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSmartToolTab(tab.id as any)}
                className={`py-2 px-3 sm:px-3.5 rounded-xl font-bold text-xs flex-shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-900 border border-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-50/50">
          
          {/* TAB 1: INTERACTIVE QUIZ GENERATOR (Feature 18) */}
          {activeSmartToolTab === 'quiz' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-850">Classroom Understanding Quiz</h4>
                  <p className="text-xs text-slate-500">Auto-generated from live discussion to test student concept retention</p>
                </div>
                <button
                  onClick={() => generateQuiz()}
                  disabled={isGeneratingQuiz}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingQuiz ? 'Generating Quiz...' : quizzes.length > 0 ? 'Regenerate Quiz' : '⚡ Generate Quiz Now'}</span>
                </button>
              </div>

              {isGeneratingQuiz ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-purple-100 p-8 shadow-xs">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 animate-pulse">Generating MCQs from Lecture...</h4>
                  <p className="text-xs text-slate-400">Analyzing key definitions, mechanisms and creating test questions.</p>
                </div>
              ) : quizzes.length > 0 ? (
                <div className="space-y-4">
                  {quizzes.map((q, qIdx) => {
                    const isAnswered = q.selectedAnswer !== undefined;
                    const isCorrect = isAnswered && q.selectedAnswer === q.correctIndex;

                    return (
                      <div key={q.id || qIdx} className="bg-white border border-purple-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-extrabold text-blue-600">Question {qIdx + 1}</span>
                          {isAnswered && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              <span>{isCorrect ? 'Correct (+10 pts)' : 'Review Needed'}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-800 leading-snug">{q.question}</p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            let btnStyle = 'border-purple-100 hover:border-blue-400 bg-purple-50/20 text-slate-700';

                            if (isAnswered) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                              } else if (optIdx === q.selectedAnswer) {
                                btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold';
                              } else {
                                btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isAnswered}
                                onClick={() => handleSelectQuizOption(q.id, optIdx, q.correctIndex)}
                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${btnStyle}`}
                              >
                                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {isAnswered && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-slate-800 block mb-0.5">💡 Concept Explanation:</strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center bg-white border border-dashed border-purple-200 rounded-3xl space-y-3 shadow-xs">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Ready to Test Your Understanding?</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Turn what you just spoke or heard in class into an interactive MCQ practice test!
                  </p>
                  <button
                    onClick={() => generateQuiz()}
                    className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    ⚡ Generate Quiz Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LECTURE-TO-STUDY NOTES (Feature 17) */}
          {activeSmartToolTab === 'notes' && (
            <div className="space-y-5 max-w-3xl mx-auto animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-850">Lecture Revision & Cheat Sheet</h4>
                  <p className="text-xs text-slate-500">Definitions, formulas, and key revision takeaways</p>
                </div>
                <div className="flex items-center gap-2">
                  {studyNotes && (
                    <button
                      onClick={copyStudyNotes}
                      className="px-3 py-1.5 bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-xs"
                    >
                      {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNotes ? 'Copied' : 'Copy Notes'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => generateStudyNotes()}
                    disabled={isGeneratingNotes}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isGeneratingNotes ? 'Creating...' : studyNotes ? 'Refresh Notes' : '⚡ Create Study Notes'}</span>
                  </button>
                </div>
              </div>

              {isGeneratingNotes ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-purple-100 p-8 shadow-xs">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 animate-pulse">Structuring Notes & Definitions...</h4>
                  <p className="text-xs text-slate-400">Compiling key lecture concepts and exam highlights.</p>
                </div>
              ) : studyNotes ? (
                <div className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="border-b border-purple-100 pb-3">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Subject Revision Sheet</span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{studyNotes.title}</h3>
                    <p className="text-xs text-slate-650 mt-1 leading-relaxed">{studyNotes.subjectOverview}</p>
                  </div>

                  {/* Key Definitions */}
                  {studyNotes.keyDefinitions?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        <span>Key Definitions</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {studyNotes.keyDefinitions.map((def, idx) => (
                          <div key={idx} className="p-3 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-1">
                            <span className="font-extrabold text-slate-900 text-xs block text-purple-950">{def.term}</span>
                            <p className="text-xs text-slate-650 leading-relaxed">{def.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core Concepts */}
                  {studyNotes.coreConcepts?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Core Concepts & Mechanisms</span>
                      </h4>
                      <div className="space-y-2.5">
                        {studyNotes.coreConcepts.map((c, idx) => (
                          <div key={idx} className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-1.5">
                            <h5 className="font-bold text-xs text-blue-950">{c.title}</h5>
                            <p className="text-xs text-slate-700 leading-relaxed">{c.explanation}</p>
                            <div className="p-2 bg-white rounded-xl border border-blue-100 text-[11px] font-medium text-blue-800 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span><strong>Key Takeaway:</strong> {c.keyPoint}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exam Highlights & Revision Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {studyNotes.examHighlights?.length > 0 && (
                      <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
                        <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Exam Highlights</span>
                        </h5>
                        <ul className="space-y-1 text-xs text-amber-950 pl-2">
                          {studyNotes.examHighlights.map((ex, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {studyNotes.revisionChecklist?.length > 0 && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                        <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Revision Checklist</span>
                        </h5>
                        <ul className="space-y-1 text-xs text-emerald-950 pl-2">
                          {studyNotes.revisionChecklist.map((ch, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{ch}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-white border border-dashed border-purple-200 rounded-3xl space-y-3 shadow-xs">
                  <div className="p-3.5 bg-purple-50 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Create Study Notes</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click below to compile all discussed topics into clean definitions, key formulas, and exam revision highlights.
                  </p>
                  <button
                    onClick={() => generateStudyNotes()}
                    className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    ⚡ Create Study Notes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DECISION & ACTION ITEM TRACKER (Features 7 & 8) */}
          {activeSmartToolTab === 'decisions' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
              {/* Add New Task Form */}
              <form onSubmit={handleAddNewTask} className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs space-y-3">
                <span className="text-xs font-extrabold text-slate-800">Add Action Item / Task</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Task description (e.g. Prepare presentation for next week)..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-grow bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Assignee (e.g. Yoga)"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full sm:w-36 bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Action Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Action Items & Deliverables ({actionItemsList.length})</h4>
                {actionItemsList.length > 0 ? (
                  <div className="space-y-2">
                    {actionItemsList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleActionItemCompleted(item.id)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          item.isCompleted 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                            : 'bg-white border-purple-100 hover:border-purple-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            item.isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {item.isCompleted && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-xs block font-medium ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {item.task}
                            </span>
                            <span className="text-[10px] font-bold text-purple-600">Assignee: {item.assignee}</span>
                          </div>
                        </div>
                        {item.deadline && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                            {item.deadline}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-purple-100 text-slate-400 space-y-1">
                    <p className="text-xs font-semibold text-slate-600">No action items yet.</p>
                    <p className="text-[11px]">Tasks will auto-populate as teacher assigns them, or add one above.</p>
                  </div>
                )}
              </div>

              {/* Decisions Made */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Class Decisions & Consensus ({decisionItems.length})</h4>
                {decisionItems.length > 0 ? (
                  <div className="space-y-2">
                    {decisionItems.map((dec) => (
                      <div key={dec.id} className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-purple-200 text-purple-800 font-bold">🤝</span>
                          <span className="font-semibold text-slate-800">{dec.text}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{dec.timestamp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-purple-100 text-slate-400 space-y-1">
                    <p className="text-xs font-semibold text-slate-600">No decisions recorded yet.</p>
                    <p className="text-[11px]">Key agreements will be highlighted here in real-time.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QUESTION COLLECTOR & CONFUSION DETECTOR (Features 14, 15, 16) */}
          {activeSmartToolTab === 'questions' && (
            <div className="space-y-5 max-w-2xl mx-auto animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-850">Student Question Collector</h4>
                  <p className="text-xs text-slate-500">Auto-detects questions asked during class</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setQuestionFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${questionFilter === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    All ({meetingQuestions.length})
                  </button>
                  <button
                    onClick={() => setQuestionFilter('unanswered')}
                    className={`px-3 py-1 rounded-lg transition-all ${questionFilter === 'unanswered' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Unanswered ({meetingQuestions.filter(q => !q.isAnswered).length})
                  </button>
                </div>
              </div>

              {filteredQuestions.length > 0 ? (
                <div className="space-y-3">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-600">Asked by {q.askedBy} at {q.timestamp}</span>
                        <button
                          onClick={() => toggleQuestionAnswered(q.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                            q.isAnswered 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                              : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{q.isAnswered ? 'Answered' : 'Mark as Answered'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">"{q.text}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-white border border-dashed border-purple-200 rounded-3xl space-y-2 shadow-xs">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-850">All Questions Handled!</h4>
                  <p className="text-xs text-slate-500">No unanswered questions detected at this moment.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TOPIC TIMELINE (Feature 9 & 23) */}
          {activeSmartToolTab === 'timeline' && (
            <div className="space-y-5 max-w-2xl mx-auto animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-slate-850">Class Topic Timeline Chapters</h4>
                  <p className="text-xs text-slate-500">Lecture segments organized chronologically</p>
                </div>
                <button
                  onClick={() => generateTopicTimeline()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  ⚡ Categorize Timeline
                </button>
              </div>

              {topicChapters.length > 0 ? (
                <div className="space-y-3 relative pl-6 border-l-2 border-purple-200 ml-3">
                  {topicChapters.map((ch, idx) => (
                    <div key={ch.id || idx} className="relative bg-white border border-purple-100 rounded-2xl p-4 shadow-xs space-y-1">
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-850">{ch.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{ch.time}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                        {ch.category}
                      </span>
                      <p className="text-xs text-slate-650 leading-relaxed pt-1">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-white border border-dashed border-purple-200 rounded-3xl space-y-3 shadow-xs">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-850">Timeline Ready to Categorize</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Categorize Timeline" to organize your meeting discussion into chapters.
                  </p>
                  <button
                    onClick={() => generateTopicTimeline()}
                    className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    ⚡ Categorize Timeline Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SPEAKER ANALYTICS & HEALTH SCORE (Features 13 & 20) */}
          {activeSmartToolTab === 'stats' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
              {/* Meeting Health Score Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold">Meeting Health & Quality Index</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 uppercase">
                    {meetingHealth.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <span className="text-2xl font-black text-white">{meetingHealth.overallScore}</span>
                    <span className="text-[10px] text-slate-300 block uppercase font-bold mt-0.5">Health Score</span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <span className="text-2xl font-black text-blue-400">{meetingHealth.latencyMs}ms</span>
                    <span className="text-[10px] text-slate-300 block uppercase font-bold mt-0.5">Avg Latency</span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <span className="text-2xl font-black text-purple-400">{meetingHealth.participationScore}%</span>
                    <span className="text-[10px] text-slate-300 block uppercase font-bold mt-0.5">Participation</span>
                  </div>
                </div>
              </div>

              {/* Speaker Participation Breakdown */}
              <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Speaker Contribution Analysis</h4>
                
                {speakerStats.length > 0 ? (
                  <div className="space-y-3">
                    {/* Visual bar */}
                    <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-100">
                      {speakerStats.map((sp, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${sp.percentage}%`, backgroundColor: sp.color }}
                          title={`${sp.name}: ${sp.percentage}%`}
                          className="h-full transition-all"
                        />
                      ))}
                    </div>

                    {/* Stats List */}
                    <div className="space-y-2 pt-2">
                      {speakerStats.map((sp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sp.color }} />
                            <span className="font-bold text-slate-800">{sp.name}</span>
                            <span className="text-[10px] font-semibold text-slate-400 capitalize">({sp.role})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono">{sp.wordCount} words</span>
                            <span className="font-extrabold text-slate-900 w-10 text-right">{sp.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400">
                    <p className="text-xs">Stats populate automatically as participants speak in the meeting.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: EXECUTIVE DEBRIEF (Feature 24) */}
          {activeSmartToolTab === 'debrief' && (
            <div className="space-y-5 max-w-2xl mx-auto bg-white border border-purple-100 rounded-3xl p-6 shadow-sm animate-fadeIn">
              <div className="border-b border-purple-100 pb-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Post-Meeting Executive Summary</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Meeting-to-Resume Debrief Sheet</h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs text-blue-900 mb-1">1. What We Discussed</h4>
                  <p className="text-slate-650 pl-3 border-l-2 border-blue-500">
                    {transcript.length > 0 ? `Covered ${transcript.length} dialogue points across key subject areas with active student engagement.` : 'Discussion in progress.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs text-emerald-900 mb-1">2. What Was Completed & Agreed</h4>
                  <ul className="list-disc pl-5 text-slate-650 space-y-1">
                    {decisionItems.length > 0 ? decisionItems.map((d, i) => <li key={i}>{d.text}</li>) : <li>Key lecture concepts and examples reviewed.</li>}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs text-purple-900 mb-1">3. Deliverables & Pending Action Items</h4>
                  <ul className="list-disc pl-5 text-slate-650 space-y-1">
                    {actionItemsList.length > 0 ? actionItemsList.map((a, i) => (
                      <li key={i}><strong>{a.assignee}:</strong> {a.task}</li>
                    )) : <li>Review lecture notes and complete practice questions.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SmartMeetingTools;
