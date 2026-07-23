import { create } from 'zustand';
import type { BandwidthTier, Participant, TranscriptEntry } from '../types';

interface Toast {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error';
}

interface MeetingState {
  // Network connection settings
  bandwidthTier: BandwidthTier;
  simulatedLatency: number; // in ms
  simulatedLoss: number; // in %
  
  // Meeting details
  status: 'landing' | 'active' | 'ended';
  roomId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  meetingDuration: number; // in seconds
  
  // Local user settings
  isMuted: boolean;
  isCameraOn: boolean;
  isTranscriptOpen: boolean;
  
  // Live transcripts and captions
  captions: string;
  transcript: TranscriptEntry[];
  
  // Participants
  participants: Participant[];
  
  // Custom Toast system
  toasts: Toast[];

  // Actions
  setTierFromDetection: (tier: BandwidthTier) => void;
  setMeetingStatus: (status: 'landing' | 'active' | 'ended') => void;
  joinMeeting: (userName: string, roomId: string, role: 'teacher' | 'student', startTier: BandwidthTier) => void;
  leaveMeeting: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleTranscript: () => void;
  addTranscriptEntry: (text: string, sender: string, role?: 'teacher' | 'student') => void;
  setCaptions: (text: string) => void;
  setParticipants: (participants: Participant[]) => void;
  toggleParticipantMute: (id: string) => void;
  toggleParticipantCamera: (id: string) => void;
  addToast: (text: string, type: 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  incrementDuration: () => void;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Prof. Sarah Jenkins', avatarColor: 'bg-emerald-500', role: 'teacher', isSpeaking: true, isCameraOn: true, isMuted: false },
  { id: '2', name: 'Rohan Sharma', avatarColor: 'bg-amber-500', role: 'student', isSpeaking: false, isCameraOn: true, isMuted: false },
  { id: '3', name: 'Priya Patel', avatarColor: 'bg-violet-500', role: 'student', isSpeaking: false, isCameraOn: false, isMuted: true },
  { id: '4', name: 'Amit Kumar', avatarColor: 'bg-rose-500', role: 'student', isSpeaking: false, isCameraOn: true, isMuted: false }
];

export const useMeetingStore = create<MeetingState>((set, get) => ({
  bandwidthTier: 'high',
  simulatedLatency: 24,
  simulatedLoss: 0.1,
  status: 'landing',
  roomId: '',
  userName: '',
  userRole: 'student',
  meetingDuration: 0,
  isMuted: false,
  isCameraOn: true,
  isTranscriptOpen: false,
  captions: 'Welcome to the classroom! Please wait for the teacher to begin the lesson.',
  transcript: [],
  participants: [],
  toasts: [],

  setTierFromDetection: (tier) => {
    const currentTier = get().bandwidthTier;
    if (currentTier === tier) return;

    let latency = 24;
    let loss = 0.1;
    let toastMsg = '';
    let toastType: 'info' | 'warning' | 'error' = 'info';

    switch (tier) {
      case 'high':
        latency = 24 + Math.floor(Math.random() * 15);
        loss = 0.1;
        toastMsg = 'Network connection restored. Re-enabling video and audio streams.';
        toastType = 'info';
        break;
      case 'medium':
        latency = 120 + Math.floor(Math.random() * 50);
        loss = 1.8;
        toastMsg = 'Network slowed down. Switched to Audio-only mode to preserve bandwidth.';
        toastType = 'warning';
        break;
      case 'low':
        latency = 450 + Math.floor(Math.random() * 150);
        loss = 9.5;
        toastMsg = 'Network critical. Audio & Video disabled. Caption-only mode activated.';
        toastType = 'error';
        break;
    }

    set({
      bandwidthTier: tier,
      simulatedLatency: latency,
      simulatedLoss: loss,
      // Automatically disable local camera/mic if network gets too low, simulating app logic
      ...(tier === 'low' ? { isCameraOn: false, isMuted: true } : {}),
      ...(tier === 'medium' ? { isCameraOn: false } : {})
    });

    get().addToast(toastMsg, toastType);
  },

  setMeetingStatus: (status) => set({ status }),

  joinMeeting: (userName, roomId, role, startTier) => {
    let latency = 24;
    let loss = 0.1;
    if (startTier === 'medium') {
      latency = 135;
      loss = 1.5;
    } else if (startTier === 'low') {
      latency = 480;
      loss = 10.2;
    }

    const localUser: Participant = {
      id: 'local-user',
      name: `${userName} (You)`,
      avatarColor: role === 'teacher' ? 'bg-indigo-600' : 'bg-blue-500',
      role: role,
      isSpeaking: false,
      isCameraOn: startTier === 'high',
      isMuted: startTier === 'low',
    };

    set({
      userName,
      roomId,
      userRole: role,
      status: 'active',
      bandwidthTier: startTier,
      simulatedLatency: latency,
      simulatedLoss: loss,
      isCameraOn: startTier === 'high',
      isMuted: startTier === 'low',
      meetingDuration: 0,
      transcript: [
        {
          id: 'init-msg',
          sender: 'System',
          text: `You joined room "${roomId}" as a ${role}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
      participants: [localUser, ...MOCK_PARTICIPANTS],
      toasts: [],
    });

    get().addToast(`Successfully joined meeting: Room ${roomId}`, 'info');
  },

  leaveMeeting: () => {
    set({ status: 'ended' });
  },

  toggleMute: () => {
    const currentMuted = get().isMuted;
    const currentTier = get().bandwidthTier;

    if (currentTier === 'low' && currentMuted) {
      get().addToast('Cannot unmute. Audio is disabled in Low Bandwidth mode.', 'error');
      return;
    }

    set({ isMuted: !currentMuted });
    
    // Update local user's participant state
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === 'local-user' ? { ...p, isMuted: !currentMuted } : p
      )
    }));
  },

  toggleCamera: () => {
    const currentCamera = get().isCameraOn;
    const currentTier = get().bandwidthTier;

    if (currentTier !== 'high' && !currentCamera) {
      get().addToast('Camera disabled. High bandwidth is required for video.', 'error');
      return;
    }

    set({ isCameraOn: !currentCamera });

    // Update local user's participant state
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === 'local-user' ? { ...p, isCameraOn: !currentCamera } : p
      )
    }));
  },

  toggleTranscript: () => set((state) => ({ isTranscriptOpen: !state.isTranscriptOpen })),

  addTranscriptEntry: (text, sender, role) => {
    const newEntry: TranscriptEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      role
    };

    set((state) => ({
      transcript: [...state.transcript, newEntry]
    }));
  },

  setCaptions: (text) => set({ captions: text }),

  setParticipants: (participants) => set({ participants }),

  toggleParticipantMute: (id) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { ...p, isMuted: !p.isMuted } : p
    )
  })),

  toggleParticipantCamera: (id) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { ...p, isCameraOn: !p.isCameraOn } : p
    )
  })),

  addToast: (text, type) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, text, type }]
    }));

    // Auto remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  incrementDuration: () => set((state) => ({
    meetingDuration: state.meetingDuration + 1
  }))
}));
