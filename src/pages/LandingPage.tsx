import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import type { BandwidthTier } from '../types';
import { createMeetingSession, joinMeetingSession } from '../lib/supabase';
import {
  Video, BookOpen, Users, Wifi, AlertCircle,
  Copy, Check, Lock, Key, Loader2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';

// ─── Host password reveal modal ──────────────────────────────────────────────
interface HostPasswordModalProps {
  roomId: string;
  password: string;
  onConfirm: () => void;
}

const HostPasswordModal: React.FC<HostPasswordModalProps> = ({ roomId, password, onConfirm }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Room: ${roomId}  |  Password: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 p-8 max-w-sm w-full mx-4 relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-[-30%] right-[-20%] w-48 h-48 bg-blue-100/40 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>

          <h3 className="text-center text-xl font-black text-slate-800 mb-1">
            Your Meeting Password
          </h3>
          <p className="text-center text-xs text-slate-500 mb-6">
            Share this password with your students so they can join.<br />
            <span className="font-semibold text-blue-600">A new password is generated each time.</span>
          </p>

          {/* Room badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Room Code</span>
            <span className="font-mono font-bold text-slate-700 text-sm">{roomId}</span>
          </div>

          {/* Password badge */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-4 py-4 mb-4 flex items-center justify-between shadow-lg shadow-blue-500/20">
            <div>
              <p className="text-blue-100 text-[10px] font-semibold mb-0.5">SESSION PASSWORD</p>
              <p className="font-mono font-black text-white text-2xl tracking-widest">{password}</p>
            </div>
            <button
              onClick={handleCopy}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-lg border border-white/30"
              title="Copy Room + Password"
            >
              {copied
                ? <Check className="w-4 h-4 text-emerald-300" />
                : <Copy className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          {copied && (
            <p className="text-emerald-600 text-[10px] font-semibold text-center -mt-2 mb-3">
              ✓ Copied to clipboard!
            </p>
          )}

          <p className="text-center text-[10px] text-slate-400 mb-4">
            🔒 Password expires when you end the meeting
          </p>

          <button
            id="host-start-meeting-btn"
            onClick={onConfirm}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500"
          >
            Start Meeting →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const { joinMeeting, roomId: storeRoomId } = useMeetingStore();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(storeRoomId || '');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [startTier, setStartTier] = useState<BandwidthTier>('high');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Host password modal state
  const [hostModal, setHostModal] = useState<{
    visible: boolean;
    sessionId: string;
    generatedPassword: string;
  }>({ visible: false, sessionId: '', generatedPassword: '' });

  // Sync state if store gets updated from URL mount check
  useEffect(() => {
    if (storeRoomId) {
      setRoomId(storeRoomId);
    }
  }, [storeRoomId]);

  const generateRoomId = () => {
    const part1 = Math.random().toString(36).substring(2, 6);
    const part2 = Math.random().toString(36).substring(2, 6);
    return `${part1}-${part2}`;
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const origin = window.location.origin;
    const inviteUrl = `${origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── HOST FLOW ────────────────────────────────────────────────────────────
  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }

    let activeRoomId = roomId.trim();
    if (!activeRoomId) {
      activeRoomId = generateRoomId();
      setRoomId(activeRoomId);
    }

    setIsLoading(true);
    try {
      // Create session in Supabase → get unique session_id + password
      const session = await createMeetingSession(activeRoomId, name.trim());

      if (!session) {
        setError('Could not create session. Check your connection and try again.');
        return;
      }

      // Show host modal with the generated password
      setHostModal({
        visible: true,
        sessionId: session.session_id,
        generatedPassword: session.password
      });
    } catch (err: any) {
      setError('Failed to create session: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // When host clicks "Start Meeting" in the modal
  const handleHostConfirm = () => {
    setHostModal(prev => ({ ...prev, visible: false }));
    window.history.pushState(null, '', `/room/${roomId}`);
    joinMeeting(
      name,
      roomId,
      'teacher',
      startTier,
      hostModal.sessionId,
      hostModal.generatedPassword
    );
  };

  // ── JOINER FLOW ──────────────────────────────────────────────────────────
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!roomId.trim()) { setError('Please enter a room code.'); return; }
    if (!password.trim()) { setError('Please enter the meeting password.'); return; }

    setIsLoading(true);
    try {
      // Validate room_id + password → get session_id
      const sessionId = await joinMeetingSession(roomId.trim(), password.trim());

      if (!sessionId) {
        setError('❌ Invalid Room Code or Password. Please try again.');
        return;
      }

      window.history.pushState(null, '', `/room/${roomId}`);
      joinMeeting(name, roomId.trim(), role, startTier, sessionId, password.trim().toUpperCase());
    } catch (err: any) {
      setError('Failed to join: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSharedLink = !!storeRoomId;

  return (
    <>
      {/* Host Password Modal */}
      {hostModal.visible && (
        <HostPasswordModal
          roomId={roomId}
          password={hostModal.generatedPassword}
          onConfirm={handleHostConfirm}
        />
      )}

      <div className="min-grow flex flex-col justify-between overflow-x-hidden text-slate-800 relative min-h-screen">
        {/* Background glowing blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-blue-200/20 blur-3xl" />

        {/* Top Navigation */}
        <header className="px-4 py-4 sm:px-6 sm:py-6 border-b border-purple-100 relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-slate-800">
                Smart Meet
              </h1>
              <p className="text-[10px] text-blue-600 font-mono tracking-wider font-bold">RURAL CONNECTIVITY</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-600 font-semibold shadow-sm">
            <Wifi className="w-3.5 h-3.5" /> Adaptive Engine Active
          </div>
        </header>

        {/* Hero Section & Form */}
        <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">

            {/* Tagline and Features list */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-bold">
                🎓 Supporting Digital Classrooms Everywhere
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight text-slate-800">
                Smarter Meetings. <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Even at 45 Kbps.
                </span>
              </h2>

              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl">
                An intelligent WebRTC-adapted virtual classroom that constantly monitors bandwidth constraints.
                It transitions gracefully from HD streams to low-latency audio or caption-only transcripts
                so rural learning never stops.
              </p>

              {/* Micro details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl">
                <div className="p-4 rounded-2xl bg-white/70 border border-purple-100/50 space-y-1 shadow-sm">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-xs text-slate-800">Classroom-First</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Tailored for online lectures, notes integration, and offline summaries.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/70 border border-purple-100/50 space-y-1 shadow-sm">
                  <Wifi className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-xs text-slate-800">Adaptive Stream</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Automated media degradation to preserve system connectivity.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/70 border border-purple-100/50 space-y-1 shadow-sm">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-xs text-slate-800">Post-Class Summaries</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">Instant summaries and full transcripts downloadable in PDF format.</p>
                </div>
              </div>

              {/* Session security note */}
              <div className="flex items-center gap-2 max-w-xl bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[11px] text-emerald-700 font-medium">
                  <strong>Collision-Proof Sessions:</strong> Each meeting gets a unique password — even if two groups use the same room code, they stay completely isolated.
                </p>
              </div>
            </div>

            {/* Form Widget */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto">
              <div className="bg-white/85 border border-purple-200 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/35 to-transparent blur-xl" />

                <h3 className="text-lg font-bold text-slate-800">
                  {isSharedLink ? 'Join Shared Room' : 'Join the Classroom'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure your details and enter the session</p>

                {error && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form className="mt-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name-input" className="block text-xs font-bold text-slate-500 mb-1.5">
                      Your Name
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. Priyesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Room ID with copy flow */}
                  <div>
                    <label htmlFor="room-input" className="block text-xs font-bold text-slate-500 mb-1.5">
                      Room Code
                    </label>
                    <div className="relative">
                      <input
                        id="room-input"
                        type="text"
                        placeholder="e.g. geo-101-rural"
                        value={roomId}
                        disabled={isSharedLink}
                        onChange={(e) => setRoomId(e.target.value)}
                        className={`w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors ${
                          isSharedLink ? 'bg-slate-50 text-slate-400 font-mono' : ''
                        }`}
                      />
                      {roomId && (
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 p-1.5 rounded-lg border border-slate-200 shadow-sm"
                          title="Copy Invitation Link"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    {copied && (
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                        ✓ Meeting link copied to clipboard! (Invitation Flow)
                      </span>
                    )}
                  </div>

                  {/* Password input — only shown to joiners */}
                  <div>
                    <label htmlFor="password-input" className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Session Password
                      <span className="text-slate-400 font-normal ml-1">(required to join)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="e.g. SPARK-4291"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      🔑 Get this from your teacher/host. Hosts don't need to enter this.
                    </p>
                  </div>

                  {/* Role and Start Tier Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="role-select" className="block text-xs font-bold text-slate-500 mb-1.5">
                        Your Role
                      </label>
                      <select
                        id="role-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="network-select" className="block text-xs font-bold text-slate-500 mb-1.5">
                        Start Network
                      </label>
                      <select
                        id="network-select"
                        value={startTier}
                        onChange={(e) => setStartTier(e.target.value as BandwidthTier)}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="high">High (Video)</option>
                        <option value="medium">Medium (Audio)</option>
                        <option value="low">Low (Captions)</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    {/* JOIN CLASS — needs password */}
                    <button
                      id="join-class-btn"
                      type="button"
                      onClick={handleJoinSubmit}
                      disabled={isLoading}
                      className="w-full py-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {isLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Lock className="w-3.5 h-3.5" />
                      }
                      Join Class
                    </button>

                    {/* HOST CLASS — generates password */}
                    <button
                      id="host-class-btn"
                      type="submit"
                      onClick={handleHostSubmit}
                      disabled={isLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-[0_0_15px_rgba(37,99,235,0.25)] border border-blue-500 flex items-center justify-center gap-1.5"
                    >
                      {isLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <ShieldCheck className="w-3.5 h-3.5" />
                      }
                      Host Class (Teacher)
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-purple-100 text-center text-xs text-slate-500 relative z-10 max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Smart Meet Technologies. Project built for Remote Rural Classrooms.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
