import React, { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import { MeetingGrid } from '../components/MeetingGrid';
import { ControlBar } from '../components/ControlBar';
import { LiveCaptions } from '../components/LiveCaptions';
import { SidebarTranscript } from '../components/SidebarTranscript';
import { BandwidthSimulator } from '../components/BandwidthSimulator';
import { ToastNotification } from '../components/ToastNotification';
import { useNetworkDetection } from '../hooks/useNetworkDetection';
import { useWebRTC } from '../hooks/useWebRTC';
import { Users, Clock, Copy, Check } from 'lucide-react';

export const MeetingRoom: React.FC = () => {
  const {
    roomId,
    userName,
    userRole,
    meetingDuration,
    isTranscriptOpen,
    participants,
    setParticipants,
    addTranscriptEntry,
    setCaptions,
    incrementDuration,
    bandwidthTier,
    isMuted,
    simulatedLatency,
    setTierFromDetection,
    addToast,
  } = useMeetingStore();

  const { currentTier, downlinkSpeed, effectiveType } = useNetworkDetection(bandwidthTier);

  // Initialize REAL WebRTC Video/Audio calling hook
  const { localStream, remoteStreams, connectionState } = useWebRTC(roomId, userName, userRole);

  const [copied, setCopied] = useState(false);

  // Synchronize detected network speed tier with Zustand state
  useEffect(() => {
    setTierFromDetection(currentTier);
  }, [currentTier, setTierFromDetection]);

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

  const speakingTimeoutRef = useRef<any>(null);

  // Real-time Speech Recognition for live captions and transcripts
  const shouldListen = !isMuted && bandwidthTier !== 'low';
  const shouldListenRef = useRef(shouldListen);
  shouldListenRef.current = shouldListen;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      if (activeText.trim()) {
        // Set local captions overlay text
        setCaptions(`${userName} (You): "${activeText}"`);

        // Set local user as speaking to animate waveform
        setParticipants(
          participants.map((p) => 
            p.id === 'local-user' ? { ...p, isSpeaking: true } : p
          )
        );

        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }
        speakingTimeoutRef.current = setTimeout(() => {
          setParticipants(
            participants.map((p) => 
              p.id === 'local-user' ? { ...p, isSpeaking: false } : p
            )
          );
        }, 3000);

        // If it's a final sentence, add to transcript list and broadcast to other peers
        if (finalTranscript.trim()) {
          addTranscriptEntry(finalTranscript.trim(), `${userName} (You)`, userRole);
          if (useMeetingStore.getState().sendChatMessageFn) {
            useMeetingStore.getState().sendChatMessageFn!(finalTranscript.trim());
          }
        }
      }
    };

    recognition.onend = () => {
      // Auto restart if mic is still active
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Failed to restart speech recognition", err);
        }
      }
    };

    if (shouldListen) {
      try {
        recognition.start();
      } catch (err) {
        console.error("SpeechRecognition start error:", err);
      }
    }

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch (err) {
        // ignore
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [shouldListen, userName, userRole, setCaptions, addTranscriptEntry, participants, setParticipants]);

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    addToast('Meeting link copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-100 via-indigo-50 to-purple-200 flex flex-col justify-between overflow-hidden relative text-slate-800 font-sans">
      {/* Toast popup center */}
      <ToastNotification />

      {/* Floating Network Simulator Dashboard */}
      <BandwidthSimulator downlinkSpeed={downlinkSpeed} effectiveType={effectiveType} />

      {/* Top Header bar */}
      <header className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-white/70 backdrop-blur-md relative z-20 no-print shadow-sm">
        {/* Left Side: Room Info & Invite Copy Link */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Room: {roomId}</h2>
              <button
                onClick={handleCopyLink}
                className="text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg border border-slate-200 shadow-sm"
                title="Copy Meeting Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Rural Education Portal • Call State: <span className="font-semibold text-blue-600 uppercase">{connectionState}</span></p>
          </div>
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatTime(meetingDuration)}</span>
          </div>
        </div>

        {/* Center: Bandwidth Mode Badges */}
        <div className="flex items-center gap-2">
          {bandwidthTier === 'high' && (
            <div className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Good Network ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'medium' && (
            <div className="px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Audio-only Precautions ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'low' && (
            <div className="px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Caption-only Precautions ({simulatedLatency}ms)</span>
            </div>
          )}
        </div>

        {/* Right Side: Participant Count & User Initials */}
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>{participants.length} Active</span>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className={`flex-grow flex relative transition-all duration-300 ${isTranscriptOpen ? 'pr-80 md:pr-96' : 'pr-0'}`}>
        {/* Video conference grids & Captions */}
        <div className="flex-grow flex flex-col justify-between py-6 relative z-10 gap-6">
          {/* Active grid of real/simulated participant boxes */}
          <MeetingGrid localStream={localStream} remoteStreams={remoteStreams} />

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

export default MeetingRoom;
