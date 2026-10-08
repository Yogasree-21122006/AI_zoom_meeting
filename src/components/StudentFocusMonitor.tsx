import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { 
  ShieldAlert, 
  X, 
  Users, 
  Clock, 
  Bell, 
  Activity, 
  CheckCircle2, 
  EyeOff, 
  Send,
  Zap,
  Info
} from 'lucide-react';

export const StudentFocusMonitor: React.FC = () => {
  const {
    isFocusMonitorOpen,
    toggleFocusMonitor,
    participants,
    studentFocusMap,
    focusIncidents,
    sendTeacherNudge,
    recordRemoteTabSwitch,
    userRole
  } = useMeetingStore();

  const [customNudgeMsg, setCustomNudgeMsg] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Only render for teacher/host
  if (!isFocusMonitorOpen || userRole !== 'teacher') return null;

  // Filter students (exclude teachers)
  const students = participants.filter(p => p.role === 'student' && p.id !== 'local-user');

  // Compute stats
  const totalStudents = students.length;
  const awayStudents = students.filter(s => {
    const focusState = studentFocusMap[s.id];
    return focusState && !focusState.isFocused;
  });
  const awayCount = awayStudents.length;
  const attentiveCount = Math.max(0, totalStudents - awayCount);
  const totalViolations = Object.values(studentFocusMap).reduce((acc, curr) => acc + curr.violationCount, 0);
  const focusPercentage = totalStudents > 0 ? Math.round((attentiveCount / totalStudents) * 100) : 100;

  const handleSendNudge = (studentId: string, studentName: string) => {
    sendTeacherNudge(
      studentId, 
      studentName, 
      customNudgeMsg.trim() || `👨‍🏫 Teacher Alert: Please stay focused on the classroom lecture!`
    );
    setCustomNudgeMsg('');
    setSelectedStudentId(null);
  };

  // Demo simulation trigger for quick testing
  const handleSimulateStudentDistraction = () => {
    const demoName = students[0]?.name || 'Priyesh Patel (Student)';
    const demoId = students[0]?.id || 'demo-student-1';
    
    // Simulate away
    recordRemoteTabSwitch({
      id: `sim-${Date.now()}`,
      studentId: demoId,
      studentName: demoName,
      status: 'away',
      violationNumber: (studentFocusMap[demoId]?.violationCount || 0) + 1,
      category: 'social_or_external_tab',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Simulate return after 4 seconds
    setTimeout(() => {
      recordRemoteTabSwitch({
        id: `sim-ret-${Date.now()}`,
        studentId: demoId,
        studentName: demoName,
        status: 'returned',
        durationSeconds: 14,
        violationNumber: (studentFocusMap[demoId]?.violationCount || 0) + 1,
        category: 'social_or_external_tab',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-rose-200/80 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-red-600 to-indigo-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Student Anti-Distraction & Focus Monitor
                </h3>
                <span className="bg-white/25 text-rose-100 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Host-Only View
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Real-time Page Visibility API proctoring • Alerts when students switch to YouTube/Social/Games
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleFocusMonitor(false)}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Monitored Students</span>
              </div>
              <p className="text-2xl font-black text-slate-800">
                {totalStudents > 0 ? totalStudents : 1}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Attentive (In Tab)</span>
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {totalStudents > 0 ? attentiveCount : 1}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
                <EyeOff className="w-4 h-4 text-rose-600" />
                <span>Away / Distracted</span>
              </div>
              <p className="text-2xl font-black text-rose-700">
                {awayCount}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-semibold">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Class Focus Rate</span>
              </div>
              <p className="text-2xl font-black text-indigo-700">
                {focusPercentage}%
              </p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">
                How Anti-Distraction Detection Works:
              </p>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                When students navigate away from this meeting tab (to YouTube, Instagram, games, or social media), the browser's <strong>Page Visibility API</strong> immediately triggers a notification to you. Internal features (AI Quiz, Notes, and Presentation slides) are whitelisted inside the app and will never trigger warnings.
              </p>
            </div>
          </div>

          {/* Live Students Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>Active Students Focus Roster</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {students.length} Total
                </span>
              </h4>

              <button
                type="button"
                onClick={handleSimulateStudentDistraction}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Test Simulate Tab Switch</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {students.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No remote students have joined this session yet. You can click <strong>"Test Simulate Tab Switch"</strong> to see how notifications appear!
                </div>
              ) : (
                students.map((student) => {
                  const focusInfo = studentFocusMap[student.id];
                  const isAway = focusInfo ? !focusInfo.isFocused : false;
                  const violations = focusInfo?.violationCount || 0;
                  const totalAwaySec = focusInfo?.totalAwaySeconds || 0;

                  return (
                    <div
                      key={student.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAway
                          ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                            isAway ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'
                          }`}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">
                              {student.name}
                            </span>
                            {isAway ? (
                              <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                                🔴 Left Classroom Tab!
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                🟢 Attentive & Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>
                              Violations: <strong className={violations > 0 ? 'text-rose-600' : 'text-slate-700'}>{violations}</strong>
                            </span>
                            {totalAwaySec > 0 && (
                              <span>
                                Total Inactive: <strong>{totalAwaySec}s</strong>
                              </span>
                            )}
                            {focusInfo?.lastAwayTimestamp && (
                              <span className="text-slate-400">
                                Last seen away: {focusInfo.lastAwayTimestamp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedStudentId === student.id ? (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <input
                              type="text"
                              placeholder="Custom nudge message..."
                              value={customNudgeMsg}
                              onChange={(e) => setCustomNudgeMsg(e.target.value)}
                              className="text-xs bg-white border border-rose-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendNudge(student.id, student.name)}
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                              title="Send Warning Nudge"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(null)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(student.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Send Warning Nudge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Incident Timeline Log */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>Tab Switch Incident Audit Log</span>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                  {focusIncidents.length} Events
                </span>
              </h4>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-2">
              {focusIncidents.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">
                  No tab switch incidents recorded yet. All students are focused!
                </p>
              ) : (
                focusIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-start justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {incident.studentName}
                        </span>
                        {incident.status === 'away' ? (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            Left Classroom Window
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            Returned ({incident.durationSeconds || 0}s away)
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Violation #{incident.violationNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {incident.status === 'away'
                          ? 'Switched to external tab/window (Suspected: YouTube / Social Media / Game / Minimized)'
                          : `Refocused back to classroom lecture after ${incident.durationSeconds || 0} seconds.`}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {incident.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Total Class Inactivity Violations: <strong>{totalViolations}</strong>
          </span>
          <button
            type="button"
            onClick={() => toggleFocusMonitor(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentFocusMonitor;
