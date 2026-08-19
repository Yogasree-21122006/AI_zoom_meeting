export type BandwidthTier = 'high' | 'medium' | 'low';

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  role: 'teacher' | 'student';
  isSpeaking: boolean;
  isCameraOn: boolean;
  isMuted: boolean;
  isVideoSimulated?: boolean; // For local UI representation
  isHandRaised?: boolean;
  lastReaction?: string;
  reactionTimestamp?: number;
  talkTimeSeconds?: number;
  wordCount?: number;
}

export interface TranscriptEntry {
  id: string;
  sender: string;
  userId?: string;
  text: string;
  timestamp: string;
  rawTimestamp?: number;
  role?: 'teacher' | 'student';
  momentTag?: 'deadline' | 'decision' | 'exam' | 'assignment' | 'question' | 'important';
  simplifiedText?: string;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  sender: string;
  userId: string;
  isHandRaise?: boolean;
  timestamp: number;
}

export interface SharedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  totalPages: number;
  currentPage: number;
  uploadedBy: string;
  uploadedRole: 'teacher' | 'student';
  timestamp?: string;
}

export interface MeetingQuestion {
  id: string;
  text: string;
  askedBy: string;
  timestamp: string;
  isAnswered: boolean;
  answerText?: string;
  category?: string;
}

export interface DecisionItem {
  id: string;
  text: string;
  timestamp: string;
  decidedBy?: string;
}

export interface ActionItemTask {
  id: string;
  assignee: string;
  task: string;
  deadline?: string;
  isCompleted: boolean;
}

export interface TopicChapter {
  id: string;
  time: string;
  title: string;
  category: 'lecture' | 'concept' | 'example' | 'qa' | 'assignment' | 'deadline';
  summary: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedAnswer?: number;
}

export interface SpeakerStat {
  userId: string;
  name: string;
  role: 'teacher' | 'student';
  wordCount: number;
  percentage: number;
  color: string;
}

export interface StudyNotesData {
  title: string;
  subjectOverview: string;
  keyDefinitions: { term: string; definition: string }[];
  coreConcepts: { title: string; explanation: string; keyPoint: string }[];
  examHighlights: string[];
  revisionChecklist: string[];
}

export interface SmartRejoinInfo {
  hasMissedContent: boolean;
  missedSeconds: number;
  missedSummary: string;
  keyDecisionsMissed: string[];
}

export interface MeetingHealthMetrics {
  overallScore: number; // 0-100
  latencyMs: number;
  packetLoss: number;
  participationScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}
