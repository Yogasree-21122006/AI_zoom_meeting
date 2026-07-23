import React, { useEffect, useRef } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { MeetingGrid } from '../components/MeetingGrid';
import { ControlBar } from '../components/ControlBar';
import { LiveCaptions } from '../components/LiveCaptions';
import { SidebarTranscript } from '../components/SidebarTranscript';
import { BandwidthSimulator } from '../components/BandwidthSimulator';
import { ToastNotification } from '../components/ToastNotification';
import { useNetworkDetection } from '../hooks/useNetworkDetection';
import { Users, Clock } from 'lucide-react';

const SIMULATED_DIALOGUE = [
  { sender: 'Prof. Sarah Jenkins', text: "Welcome to today's Geography class! We will discuss the water cycle and groundwater aquifers.", role: 'teacher' },
  { sender: 'Rohan Sharma', text: "Professor, how does rainfall replenish underground water levels in dry rural areas?", role: 'student' },
  { sender: 'Prof. Sarah Jenkins', text: "Precipitation seeps down through soil layers in a process called percolation, Rohan.", role: 'teacher' },
  { sender: 'Priya Patel', text: "Does soil type affect the speed of aquifer recharge?", role: 'student' },
  { sender: 'Prof. Sarah Jenkins', text: "Absolutely, Priya! Sandy soils percolation is much faster compared to compact clay.", role: 'teacher' },
  { sender: 'Amit Kumar', text: "Oh, so that is why clay soils lead to flash floods and surface run-offs?", role: 'student' },
  { sender: 'Prof. Sarah Jenkins', text: "Spot on, Amit! Clay traps water on the surface, preventing it from replenishing the reservoir.", role: 'teacher' },
  { sender: 'Rohan Sharma', text: "Should we draw the percolation diagram in our notebooks for the exam?", role: 'student' },
  { sender: 'Prof. Sarah Jenkins', text: "Yes, focus on labeling transpiration, evaporation, and percolation rates. It will be on the quiz.", role: 'teacher' }
];

export const MeetingRoom: React.FC = () => {
  const {
    roomId,
    userName,
    meetingDuration,
    isTranscriptOpen,
    participants,
    setParticipants,
    addTranscriptEntry,
    setCaptions,
    incrementDuration,
    bandwidthTier,
    simulatedLatency,
    setTierFromDetection,
  } = useMeetingStore();

  const { currentTier, downlinkSpeed, effectiveType } = useNetworkDetection(bandwidthTier);

  // Synchronize detected network speed tier with Zustand state
  useEffect(() => {
    setTierFromDetection(currentTier);
  }, [currentTier, setTierFromDetection]);

  const dialogueIndexRef = useRef(0);

  // Format meeting duration: HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Clock Timer
  useEffect(() => {
    const clockInterval = setInterval(() => {
      incrementDuration();
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [incrementDuration]);

  // Dialogue simulation loop
  useEffect(() => {
    const dialogTimer = setInterval(() => {
      // Pick current dialogue item
      const item = SIMULATED_DIALOGUE[dialogueIndexRef.current];
      
      // Update captions and transcript logs
      setCaptions(`${item.sender}: "${item.text}"`);
      addTranscriptEntry(item.text, item.sender, item.role as 'teacher' | 'student');

      // Set that participant as speaking in state
      setParticipants(
        participants.map((p) => {
          const isCurrentSpeaker = p.name.includes(item.sender) || (item.sender.includes('Sarah') && p.role === 'teacher');
          return {
            ...p,
            isSpeaking: isCurrentSpeaker
          };
        })
      );

      // Stop speaking 4 seconds later (before next message starts)
      setTimeout(() => {
        setParticipants(
          participants.map((p) => ({ ...p, isSpeaking: false }))
        );
      }, 4000);

      // Rotate dialogue index
      dialogueIndexRef.current = (dialogueIndexRef.current + 1) % SIMULATED_DIALOGUE.length;
    }, 7000);

    return () => clearInterval(dialogTimer);
  }, [participants, setParticipants, addTranscriptEntry, setCaptions]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden relative text-slate-100 font-sans">
      {/* Toast popup center */}
      <ToastNotification />

      {/* Floating Network Simulator Dashboard */}
      <BandwidthSimulator downlinkSpeed={downlinkSpeed} effectiveType={effectiveType} />

      {/* Top Header bar */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 relative z-20 no-print">
        {/* Left Side: Room Info */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-slate-200">Room: {roomId}</h2>
            <p className="text-[10px] text-slate-400">Rural Education Portal</p>
          </div>
          <div className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(meetingDuration)}</span>
          </div>
        </div>

        {/* Center: Bandwidth Mode Badges */}
        <div className="flex items-center gap-2">
          {bandwidthTier === 'high' && (
            <div className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Network: Good ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'medium' && (
            <div className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Network: Constrained ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'low' && (
            <div className="px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>Network: Critical ({simulatedLatency}ms)</span>
            </div>
          )}
        </div>

        {/* Right Side: Participant Count & User Initials */}
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{participants.length} Active</span>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-slate-100">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className={`flex-grow flex relative transition-all duration-300 ${isTranscriptOpen ? 'pr-80 md:pr-96' : 'pr-0'}`}>
        {/* Video conference grids & Captions */}
        <div className="flex-grow flex flex-col justify-between py-6 relative z-10 gap-6">
          {/* Active grid of participant boxes */}
          <MeetingGrid />

          {/* YouTube styled caption overlay */}
          <LiveCaptions />

          {/* Bottom control switches bar */}
          <ControlBar />
        </div>

        {/* Slide-out logs panel */}
        <SidebarTranscript />
      </main>
    </div>
  );
};
