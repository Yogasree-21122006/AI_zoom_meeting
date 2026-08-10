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
    transcriptLanguage,
    transcriptionService,
    sendAudioChunkFn,
    transcript,
    isTtsEnabled,
    isRecording,
    recordingDuration
  } = useMeetingStore();

  const { currentTier, downlinkSpeed, effectiveType } = useNetworkDetection(bandwidthTier);

  // Initialize REAL WebRTC Video/Audio calling hook
  const { localStream, remoteStreams, connectionState } = useWebRTC(roomId, userName, userRole);

  const [copied, setCopied] = useState(false);
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);

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
  const shouldListen = !isMuted && bandwidthTier !== 'low' && transcriptionService === 'webspeech';
  const shouldListenRef = useRef(shouldListen);
  shouldListenRef.current = shouldListen;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
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
          const currentParts = useMeetingStore.getState().participants;
          setParticipants(
            currentParts.map((p) => 
              p.id === 'local-user' ? { ...p, isSpeaking: true } : p
            )
          );

          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
          }
          speakingTimeoutRef.current = setTimeout(() => {
            const checkParts = useMeetingStore.getState().participants;
            setParticipants(
              checkParts.map((p) => 
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

      rec.onerror = (event: any) => {
        console.warn("Speech recognition warning:", event.error);
      };

      rec.onend = () => {
        // Auto restart with 400ms delay if mic is still active
        if (shouldListenRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (err) {
              console.warn("Failed to restart speech recognition", err);
            }
          }, 400);
        }
      };

      recognitionRef.current = rec;
    }

    // Dynamically update the language setting
    recognitionRef.current.lang = transcriptLanguage === 'tanglish' ? 'ta-IN' : transcriptLanguage;

    if (shouldListen) {
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err) {
        // ignore if already running
      }
    } else {
      shouldListenRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }

    return () => {
      // Just stop, don't destroy to allow configuration reuse
      shouldListenRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        // ignore
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [shouldListen, userName, userRole, setCaptions, addTranscriptEntry, setParticipants, transcriptLanguage, transcriptionService]);

  // Whisper AI real-time transcription recorder
  useEffect(() => {
    if (transcriptionService !== 'whisper' || !localStream || isMuted || bandwidthTier === 'low') {
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    // Create a new stream with only the audio track to record
    const audioStream = new MediaStream(audioTracks);
    
    let mediaRecorder: MediaRecorder | null = null;
    let chunkInterval: any = null;

    try {
      // Preferred formats: audio/webm (highly compatible), fallback to whatever browser supports
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/ogg';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = ''; // Let browser decide
      }

      mediaRecorder = new MediaRecorder(audioStream, options.mimeType ? options : undefined);
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          // Temporarily show waveform/speaking activity when audio data is captured
          setParticipants(
            useMeetingStore.getState().participants.map((p) => 
              p.id === 'local-user' ? { ...p, isSpeaking: true } : p
            )
          );

          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
          }
          speakingTimeoutRef.current = setTimeout(() => {
            setParticipants(
              useMeetingStore.getState().participants.map((p) => 
                p.id === 'local-user' ? { ...p, isSpeaking: false } : p
              )
            );
          }, 2500);

          // 1. Try server-side OpenAI Whisper first (via WebSocket)
          if (sendAudioChunkFn) {
            try {
              const reader = new FileReader();
              reader.readAsDataURL(event.data);
              reader.onloadend = () => {
                const base64data = reader.result as string;
                const base64Audio = base64data.split(',')[1];
                sendAudioChunkFn(base64Audio, event.data.type || 'audio/webm', transcriptLanguage);
              };
              return; // Successfully handed off to server!
            } catch (err) {
              console.warn('[Whisper Client] Failed to send chunk to server, falling back to direct HF API:', err);
            }
          }

          // 2. Fallback: Call Hugging Face free Whisper API directly from browser
          try {
            const modelUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo';

            const response = await fetch(modelUrl, {
              method: 'POST',
              headers: {
                'Content-Type': event.data.type || 'audio/webm',
              },
              body: event.data
            });

            const result = await response.json();
            
            // Check if model is loading (HF cold start)
            if (response.status === 503 && result.error && result.error.includes('loading')) {
              console.log(`[HF Whisper] Model is loading...`);
              return;
            }

            if (!response.ok) {
              throw new Error(`HF HTTP ${response.status}`);
            }

            const transcribedText = (result.text || '').trim();
            if (transcribedText) {
              const lowerText = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
              const isHallucination = ['hello', 'thank you', 'thank you for watching', 'you', 'bye', 'please', 'oh'].includes(lowerText);
              
              if (!isHallucination) {
                console.log(`[HF Whisper Client] Transcribed: "${transcribedText}"`);
                
                // Add to local transcript & captions
                addTranscriptEntry(transcribedText, `${userName} (You)`, userRole);
                setCaptions(`${userName} (You): "${transcribedText}"`);

                // Broadcast text directly to peers in room
                const sendChat = useMeetingStore.getState().sendChatMessageFn;
                if (sendChat) {
                  sendChat(transcribedText);
                }
              } else {
                console.log(`[HF Whisper Client] Ignored silence hallucination: "${transcribedText}"`);
              }
            }
          } catch (err: any) {
            console.error('[HF Whisper Client Error]', err);
            addToast(`Whisper API failed: ${err.message || err}. Reverting to Browser Web Speech API.`, 'error');
            useMeetingStore.setState({ transcriptionService: 'webspeech' });
          }
        }
      };

      mediaRecorder.start();

      // Record in 8-second slices to prevent free API rate limits and get better sentence context
      chunkInterval = setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          // Request data and restart recording to get clean boundaries
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 8000);

    } catch (err) {
      console.error('Failed to initialize MediaRecorder for Whisper:', err);
    }

    return () => {
      if (chunkInterval) {
        clearInterval(chunkInterval);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [transcriptionService, localStream, isMuted, bandwidthTier, sendAudioChunkFn, transcriptLanguage, setParticipants]);

  // TTS (Text-To-Speech) Live Announcements for Blind Users
  const lastSpokenEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isTtsEnabled || transcript.length === 0) return;
    const lastEntry = transcript[transcript.length - 1];
    
    // Avoid announcing system logs or re-announcing same entry
    if (lastEntry.sender === 'System') return;
    if (lastSpokenEntryIdRef.current === lastEntry.id) return;
    
    lastSpokenEntryIdRef.current = lastEntry.id;
    
    const senderClean = lastEntry.sender.replace(' (You)', '');
    const speechText = `${senderClean} says: ${lastEntry.text}`;
    
    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Automatically set language to Tamil if Tamil characters are present
    const isTamilText = /[\u0b80-\u0bff]/.test(lastEntry.text);
    utterance.lang = isTamilText ? 'ta-IN' : 'en-US';
    
    // Cancel any ongoing speaking to avoid accumulation delay
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [transcript, isTtsEnabled]);

  // Alt+S Keyboard Shortcut to toggle TTS Announcements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'ы')) {
        e.preventDefault();
        useMeetingStore.getState().toggleTts();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Screen/Audio Recorder References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recIntervalRef = useRef<any>(null);

  // Recorder Logic
  const startRecording = async (type: 'video' | 'audio') => {
    try {
      let captureStream: MediaStream;

      if (type === 'video') {
        // Prompt for screen share with system audio
        captureStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } else {
        // Audio capture: Chrome requires video channel in displayMedia to fetch system audio tab sharing
        try {
          const tempStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          
          // Drop video tracks, keep only system audio track
          const audioTracks = tempStream.getAudioTracks();
          if (audioTracks.length === 0) {
            tempStream.getTracks().forEach(t => t.stop());
            throw new Error("System audio was not shared. Please check 'Share system audio'.");
          }
          captureStream = new MediaStream(audioTracks);
        } catch (err: any) {
          console.warn("Display media audio fetch failed/cancelled, falling back to mic stream only:", err);
          const micTracks = localStream ? localStream.getAudioTracks() : [];
          if (micTracks.length > 0) {
            captureStream = new MediaStream([micTracks[0].clone()]);
          } else {
            addToast("No microphone stream available for audio-only recording.", "error");
            return;
          }
        }
      }

      // Mix screen/system audio with user microphone audio using Web Audio API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      
      const mixedDest = audioCtx.createMediaStreamDestination();
      let hasAudioSource = false;

      // 1. Add screen capture/system audio
      if (captureStream.getAudioTracks().length > 0) {
        const systemNode = audioCtx.createMediaStreamSource(captureStream);
        systemNode.connect(mixedDest);
        hasAudioSource = true;
      }

      // 2. Add local microphone audio track
      const micTracks = localStream ? localStream.getAudioTracks() : [];
      if (micTracks.length > 0 && !isMuted) {
        const clonedMicStream = new MediaStream([micTracks[0].clone()]);
        const micNode = audioCtx.createMediaStreamSource(clonedMicStream);
        micNode.connect(mixedDest);
        hasAudioSource = true;
      }

      // Compose final recording media tracks list
      const recordingTracks: MediaStreamTrack[] = [];
      
      if (type === 'video' && captureStream.getVideoTracks().length > 0) {
        recordingTracks.push(captureStream.getVideoTracks()[0]);
      }

      if (hasAudioSource) {
        recordingTracks.push(mixedDest.stream.getAudioTracks()[0]);
      } else if (captureStream.getAudioTracks().length > 0) {
        recordingTracks.push(captureStream.getAudioTracks()[0]);
      } else if (micTracks.length > 0) {
        recordingTracks.push(micTracks[0]);
      }

      const finalRecordStream = new MediaStream(recordingTracks);
      recordingStreamRef.current = finalRecordStream;

      // Setup browser MediaRecorder
      const mimeOptions = { mimeType: type === 'video' ? 'video/webm;codecs=vp8,opus' : 'audio/webm;codecs=opus' };
      let recorder: MediaRecorder;
      
      try {
        recorder = new MediaRecorder(finalRecordStream, mimeOptions);
      } catch (e) {
        console.warn("Selected mimeType is not supported. Reverting to browser default codec options.", e);
        recorder = new MediaRecorder(finalRecordStream);
      }

      const recordChunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordChunks.push(ev.data);
        }
      };

      recorder.onstop = () => {
        // Clean up capture streams and audio contexts
        captureStream.getTracks().forEach(t => t.stop());
        finalRecordStream.getTracks().forEach(t => t.stop());
        if (audioCtx.state !== 'closed') {
          audioCtx.close();
        }

        // Create file payload download link
        if (recordChunks.length > 0) {
          const fileBlob = new Blob(recordChunks, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
          const fileUrl = URL.createObjectURL(fileBlob);
          
          const dlLink = document.createElement('a');
          dlLink.href = fileUrl;
          dlLink.download = `Class_Recording_${roomId}_${Date.now()}.${type === 'video' ? 'webm' : 'webm'}`;
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);
          URL.revokeObjectURL(fileUrl);
          
          addToast("Meeting recording saved and downloaded successfully!", "info");
        } else {
          addToast("Failed to compile recording: No stream chunks captured.", "error");
        }

        // Reset recording store states
        useMeetingStore.setState({ isRecording: false, recordingType: null, recordingDuration: 0 });
      };

      // Handle external termination event (e.g. user clicks native Chrome stop sharing button)
      if (captureStream.getVideoTracks().length > 0) {
        captureStream.getVideoTracks()[0].addEventListener('ended', () => {
          stopRecording();
        });
      }

      mediaRecorderRef.current = recorder;
      recorder.start();

      useMeetingStore.setState({
        isRecording: true,
        recordingType: type,
        recordingDuration: 0
      });

      addToast(`Meeting ${type === 'video' ? 'Video & Audio' : 'Audio-Only'} recording active.`, "info");

      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      recIntervalRef.current = setInterval(() => {
        useMeetingStore.getState().setRecordingDuration(d => d + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Recording setup error:", err);
      addToast(`Could not start recorder: ${err.message || err}`, "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recIntervalRef.current) {
      clearInterval(recIntervalRef.current);
      recIntervalRef.current = null;
    }
  };

  // Register recording callbacks in store
  useEffect(() => {
    useMeetingStore.setState({
      startRecordingFn: startRecording,
      stopRecordingFn: stopRecording
    });

    return () => {
      useMeetingStore.setState({
        startRecordingFn: null,
        stopRecordingFn: null
      });
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, [localStream, isMuted, roomId]);

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
      <BandwidthSimulator 
        downlinkSpeed={downlinkSpeed} 
        effectiveType={effectiveType} 
        isMobileOpen={showMobileSimulator}
        onMobileClose={() => setShowMobileSimulator(false)}
      />

      {/* Top Header bar */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-purple-100 flex items-center justify-between bg-white/70 backdrop-blur-md relative z-20 no-print shadow-sm">
        {/* Left Side: Room Info & Invite Copy Link */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Room: {roomId}</h2>
              <button
                onClick={handleCopyLink}
                className="text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1 rounded-lg border border-slate-200 shadow-sm"
                title="Copy Meeting Invite Link"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 hidden md:block">Rural Education Portal • Call State: <span className="font-semibold text-blue-600 uppercase">{connectionState}</span></p>
          </div>
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] sm:text-xs font-mono text-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{formatTime(meetingDuration)}</span>
          </div>
          {isRecording && (
            <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] sm:text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" style={{ animationDuration: '1.2s' }} />
              <span>REC {formatTime(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Center: Bandwidth Mode Badges - Clickable on mobile to trigger simulator */}
        <button 
          onClick={() => setShowMobileSimulator(true)}
          className="flex items-center gap-2 hover:opacity-90 active:scale-95 transition-transform text-left cursor-pointer md:cursor-default"
          title="Click to view network stats"
        >
          {bandwidthTier === 'high' && (
            <div className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Good Network ({simulatedLatency}ms)</span>
              <span className="sm:hidden">Good ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'medium' && (
            <div className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-semibold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Audio-only ({simulatedLatency}ms)</span>
              <span className="sm:hidden">Audio ({simulatedLatency}ms)</span>
            </div>
          )}
          {bandwidthTier === 'low' && (
            <div className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="hidden sm:inline">Caption-only ({simulatedLatency}ms)</span>
              <span className="sm:hidden">Captions ({simulatedLatency}ms)</span>
            </div>
          )}
        </button>

        {/* Right Side: Participant Count & User Initials */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-600" />
            <span>{participants.length} <span className="hidden sm:inline">Active</span></span>
          </div>
          
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 border border-blue-400/30 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-md">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className={`flex-grow flex relative transition-all duration-300 ${isTranscriptOpen ? 'lg:pr-96' : 'pr-0'}`}>
        {/* Video conference grids & Captions */}
        <div className="flex-grow flex flex-col justify-between py-3 md:py-6 relative z-10 gap-3 md:gap-6">
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
