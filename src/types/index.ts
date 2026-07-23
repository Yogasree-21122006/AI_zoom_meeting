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
}

export interface TranscriptEntry {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  role?: 'teacher' | 'student';
}
