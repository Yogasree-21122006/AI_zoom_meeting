import React from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { ShieldAlert, AlertTriangle, CheckCircle, X } from 'lucide-react';

export const StudentFocusAlerts: React.FC = () => {
  const {
    userRole,
    teacherNudgeMessage,
    clearTeacherNudgeMessage,
    studentReturnedNotice,
    clearStudentReturnedNotice
  } = useMeetingStore();

  // Only render for students
  if (userRole !== 'student') return null;

  return (
    <>
      {/* 1. Teacher Nudge Direct Alert Modal */}
      {teacherNudgeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-300 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-scaleUp relative">
            <div className="w-16 h-16 bg-rose-100 border-2 border-rose-300 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black tracking-widest text-rose-600 uppercase bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                Attention Required
              </span>
              <h3 className="text-lg font-black text-slate-800">
                Direct Teacher Focus Notice
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pt-1 font-medium bg-slate-50 border border-slate-200 rounded-xl p-3">
                {teacherNudgeMessage}
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Your tab visibility and engagement is actively monitored during this session.
            </p>

            <button
              type="button"
              onClick={clearTeacherNudgeMessage}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>I am Back & Paying Attention</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Warning Banner upon returning from tab switch */}
      {studentReturnedNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] sm:w-auto bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <div className="p-1.5 bg-amber-200 rounded-xl text-amber-800 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">
                Tab Inactivity Warning ({studentReturnedNotice.duration}s away)
              </p>
              <p className="text-[11px] text-amber-700">
                You navigated away from class. The teacher has been alerted! (Violation #{studentReturnedNotice.violationCount})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearStudentReturnedNotice}
            className="p-1 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default StudentFocusAlerts;
