import { create } from 'zustand';
import type { 
  BandwidthTier, 
  Participant, 
  TranscriptEntry, 
  EmojiReaction, 
  SharedDocument,
  MeetingQuestion,
  DecisionItem,
  ActionItemTask,
  TopicChapter,
  QuizQuestion,
  SpeakerStat,
  StudyNotesData,
  SmartRejoinInfo,
  MeetingHealthMetrics
} from '../types';
import { saveTranscriptToSupabase, fetchTranscriptsFromSupabase, saveDocumentToSupabase } from '../lib/supabase';

interface Toast {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error' | 'predictive' | 'document';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface MeetingState {
  // Network connection settings
  bandwidthTier: BandwidthTier;
  realDetectedTier: BandwidthTier;
  simulatedLatency: number; // in ms
  simulatedLoss: number; // in %
  
  // Predictive network settings
  predictedTier: BandwidthTier | null;
  predictionConfidence: number;
  predictiveModeEnabled: boolean;
  
  // Manual override network settings
  isAutoNetworkMode: boolean;
  manualTier: BandwidthTier;
  
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
  isHandRaised: boolean;
  
  // Live transcripts and captions
  captions: string;
  transcript: TranscriptEntry[];
  transcriptLanguage: 'ta-IN' | 'en-US' | 'tanglish';
  transcriptionService: 'webspeech' | 'whisper';
  searchFilter: string;
  
  // Participants
  participants: Participant[];
  
  // Custom Toast system
  toasts: Toast[];

  // Zoom-style Emojis and Reactions
  activeReactions: EmojiReaction[];

  // Faculty PPT / PDF Document Sharing & In-Meeting Viewer
  sharedDocument: SharedDocument | null;
  isPresentationViewerOpen: boolean;
  presentationViewMode: 'split' | 'fullscreen' | 'pip';
  isFollowingTeacher: boolean;

  // Accessibility (TTS) & AI Summarization & Screen Recording state
  isTtsEnabled: boolean;
  aiSummaryData: { title: string; keyTakeaways: string[]; decisions: string[]; actionItems: { assignee: string; task: string }[] } | null;
  isSummarizing: boolean;
  isRecording: boolean;
  recordingDuration: number;
  recordingType: 'video' | 'audio' | null;
  customGeminiKey: string;

  // 🚀 25 Innovative Features States:
  isSmartToolsOpen: boolean;
  activeSmartToolTab: 'quiz' | 'notes' | 'decisions' | 'questions' | 'stats' | 'timeline' | 'debrief';
  dataSaverMode: boolean;
  emergencyAudioMode: boolean;
  dataUsageMB: number;
  predictedTotalMB: number;
  meetingQuestions: MeetingQuestion[];
  decisionItems: DecisionItem[];
  actionItemsList: ActionItemTask[];
  topicChapters: TopicChapter[];
  quizzes: QuizQuestion[];
  isGeneratingQuiz: boolean;
  studyNotes: StudyNotesData | null;
  isGeneratingNotes: boolean;
  speakerStats: SpeakerStat[];
  smartRejoinInfo: SmartRejoinInfo | null;
  meetingHealth: MeetingHealthMetrics;
  isSimplifyingId: string | null;

  // Real-time WebSocket signaling callbacks
  startRecordingFn: ((type: 'video' | 'audio') => Promise<void>) | null;
  stopRecordingFn: (() => void) | null;
  sendChatMessageFn: ((text: string) => void) | null;
  sendAudioChunkFn: ((base64Audio: string, mimeType: string, language: string) => void) | null;
  sendReactionFn: ((emoji: string, isHandRaise?: boolean, isHandLower?: boolean) => void) | null;
  sendDocumentShareFn: ((doc: SharedDocument) => void) | null;
  sendDocumentPageSyncFn: ((page: number, docId: string) => void) | null;
  mySignalingId: string;

  // Actions
  setTierFromDetection: (tier: BandwidthTier) => void;
  setPrediction: (tier: BandwidthTier | null, confidence: number) => void;
  setPredictiveModeEnabled: (enabled: boolean) => void;
  recalculateAppliedTier: () => void;
  setIsAutoNetworkMode: (auto: boolean) => void;
  setManualTier: (tier: BandwidthTier) => void;
  setTranscriptLanguage: (lang: 'ta-IN' | 'en-US' | 'tanglish') => void;
  setTranscriptionService: (service: 'webspeech' | 'whisper') => void;
  setSearchFilter: (filter: string) => void;
  setMeetingStatus: (status: 'landing' | 'active' | 'ended') => void;
  joinMeeting: (userName: string, roomId: string, role: 'teacher' | 'student', startTier: BandwidthTier) => void;
  leaveMeeting: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleTranscript: () => void;
  addTranscriptEntry: (text: string, sender: string, role?: 'teacher' | 'student', userId?: string, skipSupabase?: boolean) => void;
  setCaptions: (text: string) => void;
  setParticipants: (participants: Participant[]) => void;
  toggleParticipantMute: (id: string) => void;
  toggleParticipantCamera: (id: string) => void;
  addToast: (text: string, type: 'info' | 'warning' | 'error' | 'predictive' | 'document', action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;
  incrementDuration: () => void;
  toggleTts: () => void;
  setRecordingState: (isRecording: boolean, type: 'video' | 'audio' | null) => void;
  setRecordingDuration: (duration: number | ((prev: number) => number)) => void;
  generateAiSummary: (customApiKey?: string) => Promise<void>;
  resetSummary: () => void;
  setCustomGeminiKey: (key: string) => void;

  // 🚀 25 Feature Actions
  toggleSmartTools: (open?: boolean) => void;
  setActiveSmartToolTab: (tab: 'quiz' | 'notes' | 'decisions' | 'questions' | 'stats' | 'timeline' | 'debrief') => void;
  toggleDataSaverMode: () => void;
  toggleEmergencyAudioMode: () => void;
  generateQuiz: () => Promise<void>;
  submitQuizAnswer: (questionId: string, optionIndex: number) => void;
  generateStudyNotes: () => Promise<void>;
  generateTopicTimeline: () => Promise<void>;
  simplifyTranscriptEntry: (entryId: string, targetLang?: string) => Promise<void>;
  toggleQuestionAnswered: (questionId: string, answerText?: string) => void;
  toggleActionItemCompleted: (actionId: string) => void;
  addActionItem: (task: string, assignee: string, deadline?: string) => void;
  dismissSmartRejoin: () => void;
  requestCatchUpSummary: () => Promise<void>;
  calculateSpeakerStats: () => void;
  updateMeetingHealth: () => void;

  // Reactions & Hand Raise Actions
  sendReaction: (emoji: string) => void;
  toggleHandRaise: () => void;
  addReaction: (reaction: EmojiReaction) => void;
  setParticipantHandRaise: (userId: string, isHandRaised: boolean) => void;
  setParticipantReaction: (userId: string, emoji: string) => void;

  // Presentation / PPT Viewer Actions
  shareDocument: (doc: SharedDocument) => Promise<void>;
  setSharedDocument: (doc: SharedDocument | null) => void;
  setDocumentCurrentPage: (page: number, broadcast?: boolean) => void;
  togglePresentationViewer: (open?: boolean) => void;
  setPresentationViewMode: (mode: 'split' | 'fullscreen' | 'pip') => void;
  toggleFollowTeacher: () => void;
  loadSupabaseHistory: () => Promise<void>;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  bandwidthTier: 'high',
  realDetectedTier: 'high',
  simulatedLatency: 24,
  simulatedLoss: 0.1,
  predictedTier: null,
  predictionConfidence: 1.0,
  predictiveModeEnabled: true,
  isAutoNetworkMode: true,
  manualTier: 'high',
  status: 'landing',
  roomId: '',
  userName: '',
  userRole: 'student',
  meetingDuration: 0,
  isMuted: false,
  isCameraOn: true,
  isTranscriptOpen: false,
  isHandRaised: false,
  captions: 'Welcome to the classroom! Live captions and multi-speaker transcription active.',
  transcript: [],
  transcriptLanguage: 'ta-IN',
  transcriptionService: 'webspeech',
  searchFilter: '',
  participants: [],
  toasts: [],
  activeReactions: [],
  sharedDocument: null,
  isPresentationViewerOpen: false,
  presentationViewMode: 'split',
  isFollowingTeacher: true,
  startRecordingFn: null,
  stopRecordingFn: null,
  sendChatMessageFn: null,
  sendAudioChunkFn: null,
  sendReactionFn: null,
  sendDocumentShareFn: null,
  sendDocumentPageSyncFn: null,
  mySignalingId: '',
  isTtsEnabled: false,
  aiSummaryData: null,
  isSummarizing: false,
  isRecording: false,
  recordingDuration: 0,
  recordingType: null,
  customGeminiKey: typeof window !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '') : '',

  // 🚀 25 Features Initial State
  isSmartToolsOpen: false,
  activeSmartToolTab: 'quiz',
  dataSaverMode: false,
  emergencyAudioMode: false,
  dataUsageMB: 0,
  predictedTotalMB: 85,
  meetingQuestions: [],
  decisionItems: [],
  actionItemsList: [],
  topicChapters: [],
  quizzes: [],
  isGeneratingQuiz: false,
  studyNotes: null,
  isGeneratingNotes: false,
  speakerStats: [],
  smartRejoinInfo: null,
  meetingHealth: {
    overallScore: 96,
    latencyMs: 24,
    packetLoss: 0.1,
    participationScore: 88,
    status: 'excellent'
  },
  isSimplifyingId: null,

  setTierFromDetection: (tier) => {
    const currentReal = get().realDetectedTier;
    if (currentReal === tier) return;

    set({ realDetectedTier: tier });
    get().recalculateAppliedTier();
  },

  setPrediction: (tier, confidence) => {
    const currentPredicted = get().predictedTier;
    if (currentPredicted === tier && get().predictionConfidence === confidence) return;

    set({ predictedTier: tier, predictionConfidence: confidence });

    if (get().predictiveModeEnabled) {
      get().recalculateAppliedTier();
    }
  },

  setPredictiveModeEnabled: (enabled) => {
    set({ predictiveModeEnabled: enabled });
    get().recalculateAppliedTier();
  },

  recalculateAppliedTier: () => {
    const isAuto = get().isAutoNetworkMode;
    const manualTier = get().manualTier;
    const realTier = get().realDetectedTier;
    const predTier = get().predictedTier;
    const enabled = get().predictiveModeEnabled;
    const isSaver = get().dataSaverMode;

    let targetTier = realTier;
    if (isSaver) {
      targetTier = 'medium';
    } else if (!isAuto) {
      targetTier = manualTier;
    } else if (enabled && predTier) {
      const ranks = { low: 1, medium: 2, high: 3 };
      if (ranks[predTier] < ranks[realTier]) {
        targetTier = predTier;
      }
    }

    const currentApplied = get().bandwidthTier;
    if (currentApplied === targetTier) return;

    let latency = get().simulatedLatency;
    let loss = get().simulatedLoss;
    let toastMsg = '';
    let toastType: 'info' | 'warning' | 'error' | 'predictive' = 'info';

    switch (targetTier) {
      case 'high':
        toastMsg = 'High bandwidth active: HD video & rich audio enabled.';
        toastType = 'info';
        latency = 20;
        loss = 0.1;
        break;
      case 'medium':
        toastMsg = 'Bandwidth lowered: Switched to Audio & Slide stream to save data.';
        toastType = 'warning';
        latency = 65;
        loss = 1.2;
        break;
      case 'low':
        toastMsg = 'Critical connection: Video paused. Ultra-low text transcripts active.';
        toastType = 'error';
        latency = 180;
        loss = 4.5;
        break;
    }

    set({
      bandwidthTier: targetTier,
      simulatedLatency: latency,
      simulatedLoss: loss
    });

    get().addToast(toastMsg, toastType);
    get().updateMeetingHealth();
  },

  setIsAutoNetworkMode: (auto) => {
    set({ isAutoNetworkMode: auto });
    get().recalculateAppliedTier();
  },

  setManualTier: (tier) => {
    set({ manualTier: tier, isAutoNetworkMode: false });
    get().recalculateAppliedTier();
  },

  setTranscriptLanguage: (lang) => set({ transcriptLanguage: lang }),
  setTranscriptionService: (service) => set({ transcriptionService: service }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),
  setMeetingStatus: (status) => set({ status }),

  joinMeeting: (userName, roomId, role, startTier) => {
    const localUser: Participant = {
      id: 'local-user',
      name: `${userName} (You)`,
      avatarColor: role === 'teacher' ? 'bg-blue-600' : 'bg-purple-600',
      role,
      isSpeaking: false,
      isCameraOn: startTier === 'high',
      isMuted: false
    };

    set({
      userName,
      roomId,
      userRole: role,
      status: 'active',
      bandwidthTier: startTier,
      realDetectedTier: startTier,
      manualTier: startTier,
      isAutoNetworkMode: true,
      participants: [localUser],
      transcript: [],
      meetingQuestions: [],
      decisionItems: [],
      actionItemsList: [],
      activeReactions: [],
      isHandRaised: false
    });

    get().addToast(`Joined classroom: Room ${roomId}`, 'info');
    get().loadSupabaseHistory();
  },

  loadSupabaseHistory: async () => {
    const roomId = get().roomId;
    if (!roomId) return;
    try {
      const records = await fetchTranscriptsFromSupabase(roomId);
      if (records && records.length > 0) {
        const loadedEntries: TranscriptEntry[] = records.map((r: any) => ({
          id: r.id || `hist-${Math.random()}`,
          sender: r.sender_name,
          text: r.content,
          timestamp: r.timestamp || new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTimestamp: new Date(r.created_at).getTime(),
          role: r.sender_role
        }));
        
        // Deduplicate and merge chronologically
        set((state) => {
          const existingIds = new Set(state.transcript.map(t => t.id));
          const newOnes = loadedEntries.filter(e => !existingIds.has(e.id));
          const merged = [...state.transcript, ...newOnes].sort((a, b) => (a.rawTimestamp || 0) - (b.rawTimestamp || 0));
          return { transcript: merged };
        });

        get().calculateSpeakerStats();
      }
    } catch (e) {
      console.warn('[Supabase] Failed to preload history:', e);
    }
  },

  leaveMeeting: () => {
    set({ status: 'ended' });
  },

  toggleMute: () => {
    const currentMuted = get().isMuted;
    set({ isMuted: !currentMuted });
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === 'local-user' ? { ...p, isMuted: !currentMuted } : p
      )
    }));
  },

  toggleCamera: () => {
    const currentCamera = get().isCameraOn;
    if (get().bandwidthTier === 'low' && !currentCamera) {
      get().addToast('Camera disabled in Low Bandwidth mode.', 'error');
      return;
    }
    set({ isCameraOn: !currentCamera });
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === 'local-user' ? { ...p, isCameraOn: !currentCamera } : p
      )
    }));
  },

  toggleTranscript: () => set((state) => ({ isTranscriptOpen: !state.isTranscriptOpen })),

  // Multi-speaker Speech Attribution & Important Moment Tagging
  addTranscriptEntry: (text, sender, role, userId, skipSupabase) => {
    if (!text || !text.trim()) return;

    const cleanText = text.trim();
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nowMs = Date.now();

    // 🎯 Detect Important Moments (Feature 6, 7, 8, 14)
    const lower = cleanText.toLowerCase();
    let detectedTag: TranscriptEntry['momentTag'] = undefined;

    if (lower.includes('deadline') || lower.includes('due date') || lower.includes('submit by') || lower.includes('before friday')) {
      detectedTag = 'deadline';
    } else if (lower.includes('decision') || lower.includes('decided') || lower.includes('agreed') || lower.includes('finalized')) {
      detectedTag = 'decision';
    } else if (lower.includes('exam') || lower.includes('quiz') || lower.includes('test') || lower.includes('marks')) {
      detectedTag = 'exam';
    } else if (lower.includes('assignment') || lower.includes('homework') || lower.includes('task')) {
      detectedTag = 'assignment';
    } else if (cleanText.endsWith('?') || lower.includes('what is') || lower.includes('how do') || lower.includes('sir doubt')) {
      detectedTag = 'question';
    }

    const newEntry: TranscriptEntry = {
      id: `entry-${nowMs}-${Math.random().toString(36).substring(2, 7)}`,
      sender,
      userId: userId || 'local-user',
      text: cleanText,
      timestamp: timestampStr,
      rawTimestamp: nowMs,
      role: role || get().userRole,
      momentTag: detectedTag
    };

    // Sequential Non-Overlapping Buffer: append cleanly in chronological order
    set((state) => ({
      transcript: [...state.transcript, newEntry]
    }));

    // Auto-populate Decisions, Questions, Action Items
    if (detectedTag === 'question') {
      set((state) => ({
        meetingQuestions: [
          ...state.meetingQuestions,
          {
            id: `q-${nowMs}`,
            text: cleanText,
            askedBy: sender,
            timestamp: timestampStr,
            isAnswered: false
          }
        ]
      }));
    } else if (detectedTag === 'decision') {
      set((state) => ({
        decisionItems: [
          ...state.decisionItems,
          {
            id: `d-${nowMs}`,
            text: cleanText,
            timestamp: timestampStr,
            decidedBy: sender
          }
        ]
      }));
    } else if (detectedTag === 'assignment' || detectedTag === 'deadline') {
      set((state) => ({
        actionItemsList: [
          ...state.actionItemsList,
          {
            id: `act-${nowMs}`,
            task: cleanText,
            assignee: sender.toLowerCase().includes('teacher') || role === 'teacher' ? 'All Students' : sender,
            isCompleted: false
          }
        ]
      }));
    }

    // Persist to Supabase
    if (!skipSupabase && sender !== 'System' && get().roomId) {
      saveTranscriptToSupabase({
        room_id: get().roomId,
        sender_name: sender.replace(' (You)', ''),
        sender_role: role || get().userRole,
        content: cleanText,
        timestamp: timestampStr
      });
    }

    // Recalculate Speaker Stats & Data Usage
    get().calculateSpeakerStats();
    get().updateMeetingHealth();
  },

  setCaptions: (text) => set({ captions: text }),
  setParticipants: (participants) => set({ participants }),

  toggleParticipantMute: (id) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, isMuted: !p.isMuted } : p
      )
    }));
  },

  toggleParticipantCamera: (id) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, isCameraOn: !p.isCameraOn } : p
      )
    }));
  },

  addToast: (text, type, action) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, text, type, action }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  incrementDuration: () => {
    const newDuration = get().meetingDuration + 1;
    
    // Calculate Data Usage (KB/s based on tier)
    const tier = get().bandwidthTier;
    const rateKBps = tier === 'high' ? 180 : tier === 'medium' ? 45 : 12;
    const addedMB = (rateKBps / 1024);
    const updatedUsage = Math.round((get().dataUsageMB + (addedMB / 60)) * 10) / 10;
    const predicted1hr = Math.round((rateKBps * 3600) / 1024);

    set({ 
      meetingDuration: newDuration,
      dataUsageMB: updatedUsage,
      predictedTotalMB: predicted1hr
    });
  },

  toggleTts: () => set((state) => ({ isTtsEnabled: !state.isTtsEnabled })),
  setRecordingState: (isRecording, type) => set({ isRecording, recordingType: type }),
  setRecordingDuration: (duration) =>
    set((state) => ({
      recordingDuration: typeof duration === 'function' ? duration(state.recordingDuration) : duration
    })),

  // AI Meeting Summarization
  generateAiSummary: async (customApiKey) => {
    set({ isSummarizing: true });
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: get().transcript.filter(t => t.sender !== 'System'),
          roomId: get().roomId,
          apiKey: customApiKey || get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      set({ aiSummaryData: data });
      get().addToast('English Meeting Summary generated and saved!', 'info');
    } catch (err: any) {
      console.error('[AI Summary error]', err);
      get().addToast(`Summary failed: ${err.message}`, 'error');
    } finally {
      set({ isSummarizing: false });
    }
  },

  resetSummary: () => set({ aiSummaryData: null }),
  setCustomGeminiKey: (key) => {
    set({ customGeminiKey: key });
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', key);
    }
  },

  // 🚀 25 INNOVATIVE FEATURES IMPLEMENTATIONS:

  toggleSmartTools: (open) => {
    set((state) => ({ isSmartToolsOpen: open !== undefined ? open : !state.isSmartToolsOpen }));
  },

  setActiveSmartToolTab: (tab) => set({ activeSmartToolTab: tab }),

  toggleDataSaverMode: () => {
    const nextSaver = !get().dataSaverMode;
    set({ dataSaverMode: nextSaver });
    get().recalculateAppliedTier();
    get().addToast(
      nextSaver ? 'Data Saver ON: Audio & slide priority mode active.' : 'Data Saver OFF: HD video restored.',
      'info'
    );
  },

  toggleEmergencyAudioMode: () => {
    const nextEmergency = !get().emergencyAudioMode;
    set({ 
      emergencyAudioMode: nextEmergency,
      bandwidthTier: nextEmergency ? 'low' : get().realDetectedTier
    });
    get().addToast(
      nextEmergency ? '🚨 Emergency Text Mode Active: Zero-video ultra-low-bandwidth live stream enabled.' : 'Emergency Mode Disabled.',
      nextEmergency ? 'warning' : 'info'
    );
  },

  generateQuiz: async () => {
    set({ isGeneratingQuiz: true });
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: get().transcript.filter(t => t.sender !== 'System'),
          apiKey: get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Quiz generation failed');

      set({ quizzes: data.questions || [] });
      get().addToast('Interactive Quiz Generated from Lecture!', 'info');
    } catch (err: any) {
      get().addToast(`Failed to generate quiz: ${err.message}`, 'error');
    } finally {
      set({ isGeneratingQuiz: false });
    }
  },

  submitQuizAnswer: (questionId, optionIndex) => {
    set((state) => ({
      quizzes: state.quizzes.map((q) =>
        q.id === questionId ? { ...q, selectedAnswer: optionIndex } : q
      )
    }));
  },

  generateStudyNotes: async () => {
    set({ isGeneratingNotes: true });
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/study-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: get().transcript.filter(t => t.sender !== 'System'),
          apiKey: get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Study notes generation failed');

      set({ studyNotes: data.studyNotes });
      get().addToast('Study & Revision Notes ready!', 'info');
    } catch (err: any) {
      get().addToast(`Failed to create study notes: ${err.message}`, 'error');
    } finally {
      set({ isGeneratingNotes: false });
    }
  },

  generateTopicTimeline: async () => {
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/topic-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: get().transcript.filter(t => t.sender !== 'System'),
          apiKey: get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Timeline generation failed');

      set({ topicChapters: data.chapters || [] });
      get().addToast('Topic Timeline Categorized!', 'info');
    } catch (err: any) {
      get().addToast(`Timeline failed: ${err.message}`, 'error');
    }
  },

  simplifyTranscriptEntry: async (entryId, targetLang = 'tanglish') => {
    const entry = get().transcript.find(t => t.id === entryId);
    if (!entry) return;

    set({ isSimplifyingId: entryId });
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/simplify-concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: entry.text,
          targetLang,
          apiKey: get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Simplification failed');

      set((state) => ({
        transcript: state.transcript.map(t =>
          t.id === entryId ? { ...t, simplifiedText: data.simplified } : t
        )
      }));
    } catch (err: any) {
      get().addToast(`Could not simplify: ${err.message}`, 'error');
    } finally {
      set({ isSimplifyingId: null });
    }
  },

  toggleQuestionAnswered: (questionId, answerText) => {
    set((state) => ({
      meetingQuestions: state.meetingQuestions.map(q =>
        q.id === questionId ? { ...q, isAnswered: !q.isAnswered, answerText: answerText || q.answerText } : q
      )
    }));
  },

  toggleActionItemCompleted: (actionId) => {
    set((state) => ({
      actionItemsList: state.actionItemsList.map(a =>
        a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
      )
    }));
  },

  addActionItem: (task, assignee, deadline) => {
    set((state) => ({
      actionItemsList: [
        ...state.actionItemsList,
        {
          id: `act-${Date.now()}`,
          task,
          assignee: assignee || 'All Students',
          deadline: deadline || 'Next Class',
          isCompleted: false
        }
      ]
    }));
    get().addToast(`Added task for ${assignee}`, 'info');
  },

  dismissSmartRejoin: () => set({ smartRejoinInfo: null }),

  requestCatchUpSummary: async () => {
    const transcript = get().transcript.filter(t => t.sender !== 'System');
    const recentMissed = transcript.slice(-10);

    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
      const httpBackendUrl = serverUrl.replace(/^ws/, 'http');

      const response = await fetch(`${httpBackendUrl}/api/meeting-catchup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missedTranscript: recentMissed,
          missedSeconds: 180,
          apiKey: get().customGeminiKey || undefined
        })
      });

      const data = await response.json();
      if (data.catchUpSummary) {
        set({
          smartRejoinInfo: {
            hasMissedContent: true,
            missedSeconds: 180,
            missedSummary: data.catchUpSummary,
            keyDecisionsMissed: get().decisionItems.slice(-2).map(d => d.text)
          }
        });
      }
    } catch (e) {
      console.warn('[CatchUp] Failed:', e);
    }
  },

  calculateSpeakerStats: () => {
    const transcript = get().transcript.filter(t => t.sender !== 'System');
    if (transcript.length === 0) return;

    const counts: Record<string, { count: number; role: 'teacher' | 'student'; color: string }> = {};
    let totalWords = 0;

    transcript.forEach(entry => {
      const words = entry.text.trim().split(/\s+/).length;
      totalWords += words;
      const key = entry.sender;

      if (!counts[key]) {
        counts[key] = {
          count: 0,
          role: entry.role || (key.toLowerCase().includes('prof') ? 'teacher' : 'student'),
          color: key.includes('(You)') ? '#3b82f6' : '#8b5cf6'
        };
      }
      counts[key].count += words;
    });

    const stats: SpeakerStat[] = Object.entries(counts).map(([name, data], idx) => {
      const percentage = totalWords > 0 ? Math.round((data.count / totalWords) * 100) : 0;
      const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
      return {
        userId: `user-${idx}`,
        name,
        role: data.role,
        wordCount: data.count,
        percentage,
        color: palette[idx % palette.length]
      };
    });

    set({ speakerStats: stats.sort((a, b) => b.wordCount - a.wordCount) });
  },

  updateMeetingHealth: () => {
    const tier = get().bandwidthTier;
    const transcriptCount = get().transcript.length;
    const questionsCount = get().meetingQuestions.length;

    let latency = 24;
    let packetLoss = 0.1;
    let score = 95;

    if (tier === 'medium') {
      latency = 68;
      packetLoss = 1.2;
      score = 82;
    } else if (tier === 'low') {
      latency = 185;
      packetLoss = 4.2;
      score = 64;
    }

    const participation = Math.min(100, Math.round(50 + (transcriptCount * 2) + (questionsCount * 5)));
    const overall = Math.round((score * 0.6) + (participation * 0.4));

    set({
      meetingHealth: {
        overallScore: overall,
        latencyMs: latency,
        packetLoss,
        participationScore: participation,
        status: overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 55 ? 'fair' : 'poor'
      }
    });
  },

  sendReaction: (emoji) => {
    const fn = get().sendReactionFn;
    if (fn) {
      fn(emoji, false, false);
    } else {
      get().addReaction({
        id: `react-${Date.now()}`,
        emoji,
        sender: `${get().userName} (You)`,
        userId: 'local-user',
        timestamp: Date.now()
      });
    }
  },

  toggleHandRaise: () => {
    const current = !get().isHandRaised;
    set({ isHandRaised: current });
    const fn = get().sendReactionFn;
    if (fn) {
      fn('✋', current, !current);
    }
  },

  addReaction: (reaction) => {
    set((state) => ({
      activeReactions: [...state.activeReactions, reaction]
    }));
    setTimeout(() => {
      set((state) => ({
        activeReactions: state.activeReactions.filter((r) => r.id !== reaction.id)
      }));
    }, 3500);
  },

  setParticipantHandRaise: (userId, isHandRaised) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === userId ? { ...p, isHandRaised } : p
      )
    }));
  },

  setParticipantReaction: (userId, emoji) => {
    const now = Date.now();
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === userId ? { ...p, lastReaction: emoji, reactionTimestamp: now } : p
      )
    }));
  },

  shareDocument: async (doc) => {
    set({
      sharedDocument: doc,
      isPresentationViewerOpen: true
    });

    const fn = get().sendDocumentShareFn;
    if (fn) {
      fn(doc);
    }

    if (get().roomId) {
      try {
        await saveDocumentToSupabase({
          room_id: get().roomId,
          file_name: doc.fileName,
          file_url: doc.fileUrl,
          file_type: doc.fileType,
          uploaded_by: doc.uploadedBy,
          uploaded_role: doc.uploadedRole,
          total_pages: doc.totalPages,
          current_page: doc.currentPage
        });
      } catch (err) {
        console.warn('[Supabase] Document save warning:', err);
      }
    }
  },

  setSharedDocument: (doc) => {
    set({
      sharedDocument: doc,
      isPresentationViewerOpen: !!doc
    });
  },

  setDocumentCurrentPage: (page, broadcast) => {
    const doc = get().sharedDocument;
    if (!doc) return;

    set({
      sharedDocument: {
        ...doc,
        currentPage: page
      }
    });

    const fn = get().sendDocumentPageSyncFn;
    if (broadcast && fn) {
      fn(page, doc.id);
    }
  },

  togglePresentationViewer: (open) => {
    set((state) => ({
      isPresentationViewerOpen: open !== undefined ? open : !state.isPresentationViewerOpen
    }));
  },

  setPresentationViewMode: (mode) => set({ presentationViewMode: mode }),
  toggleFollowTeacher: () => set((state) => ({ isFollowingTeacher: !state.isFollowingTeacher }))
}));
