import React, { useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import type { BandwidthTier } from '../types';
import { Video, BookOpen, Users, Wifi, AlertCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { joinMeeting } = useMeetingStore();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('geo-101-rural');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [startTier, setStartTier] = useState<BandwidthTier>('high');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent, isCreate: boolean) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a room code.');
      return;
    }
    setError('');
    
    // If creating, the role defaults to teacher; if joining, student (or as selected)
    const activeRole = isCreate ? 'teacher' : role;
    joinMeeting(name, roomId, activeRole, startTier);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between overflow-x-hidden text-slate-100 relative">
      {/* Background glowing blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Top Navigation */}
      <header className="px-6 py-6 border-b border-white/5 relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Smart Meet
            </h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-wider">RURAL CONNECTIVITY</p>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full text-xs text-emerald-400">
          <Wifi className="w-3.5 h-3.5" /> Adaptive Engine Active
        </div>
      </header>

      {/* Hero Section & Form */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Tagline and Features list */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-semibold">
              🎓 Supporting Digital Classrooms Everywhere
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
              Smarter Meetings. <br />
              <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Even at 45 Kbps.
              </span>
            </h2>
            
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
              An intelligent WebRTC-adapted virtual classroom that constantly monitors bandwidth constraints. It transitions gracefully from HD streams to low-latency audio or caption-only transcripts so rural learning never stops.
            </p>

            {/* Micro details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h4 className="font-semibold text-xs text-slate-200">Classroom-First</h4>
                <p className="text-[10px] text-slate-400 leading-normal">Tailored for online lectures, notes integration, and offline summaries.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-xs text-slate-200">Adaptive Stream</h4>
                <p className="text-[10px] text-slate-400 leading-normal">Automated media degradation to preserve system connectivity.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <Users className="w-5 h-5 text-purple-400" />
                <h4 className="font-semibold text-xs text-slate-200">Post-Class Summaries</h4>
                <p className="text-[10px] text-slate-400 leading-normal">Instant summaries and full transcripts downloadable in PDF format.</p>
              </div>
            </div>
          </div>

          {/* Form Widget */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-xl" />
              
              <h3 className="text-lg font-bold text-slate-100">Join the Classroom</h3>
              <p className="text-xs text-slate-400 mt-1">Configure your initials and join the session</p>

              {error && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    placeholder="e.g. Priyesh Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Room ID */}
                <div>
                  <label htmlFor="room-input" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Room Code
                  </label>
                  <input
                    id="room-input"
                    type="text"
                    placeholder="e.g. geo-101-rural"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Role and Start Tier Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="role-select" className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Your Role
                    </label>
                    <select
                      id="role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="network-select" className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Start Network
                    </label>
                    <select
                      id="network-select"
                      value={startTier}
                      onChange={(e) => setStartTier(e.target.value as BandwidthTier)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    >
                      <option value="high">High (Video)</option>
                      <option value="medium">Medium (Audio)</option>
                      <option value="low">Low (Captions)</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors shadow-lg"
                  >
                    Join Class
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e, true)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] border border-indigo-500/40"
                  >
                    Host Class (Teacher)
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500 relative z-10 max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Smart Meet Technologies. Project built for Remote Rural Classrooms.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
