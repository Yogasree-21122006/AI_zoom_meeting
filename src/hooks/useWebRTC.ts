import { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';
import type { SharedDocument } from '../types';

interface Peer {
  id: string;
  name: string;
  role: 'teacher' | 'student';
}

export const useWebRTC = (roomId: string, userName: string, userRole: 'teacher' | 'student') => {
  const { 
    bandwidthTier, 
    isMuted, 
    isCameraOn,
    setParticipants,
    addTranscriptEntry 
  } = useMeetingStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [peers, setPeers] = useState<Peer[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  
  // Public STUN server configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  // Helper to sync participants to the Zustand store
  useEffect(() => {
    const existingParts = useMeetingStore.getState().participants;

    const localUser = {
      id: 'local-user',
      name: `${userName} (You)`,
      avatarColor: userRole === 'teacher' ? 'bg-indigo-600' : 'bg-blue-500',
      role: userRole,
      isSpeaking: false,
      isCameraOn: isCameraOn && bandwidthTier === 'high',
      isMuted: isMuted || bandwidthTier === 'low',
      isHandRaised: useMeetingStore.getState().isHandRaised
    };

    const remoteUsers = peers.map(p => {
      const prev = existingParts.find(ep => ep.id === p.id);
      return {
        id: p.id,
        name: p.name,
        avatarColor: p.role === 'teacher' ? 'bg-indigo-600' : 'bg-blue-500',
        role: p.role,
        isSpeaking: prev ? prev.isSpeaking : false,
        isCameraOn: prev ? prev.isCameraOn : true,
        isMuted: prev ? prev.isMuted : false,
        isHandRaised: prev ? prev.isHandRaised : false,
        lastReaction: prev ? prev.lastReaction : undefined
      };
    });

    setParticipants([localUser, ...remoteUsers]);
  }, [peers, isMuted, isCameraOn, bandwidthTier, userName, userRole, setParticipants]);

  // Handle local track enabling/disabling based on local settings & bandwidth tier
  useEffect(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    // Video is only enabled on HIGH tier AND when the camera toggle is on
    const shouldVideoBeActive = isCameraOn && bandwidthTier === 'high';
    videoTracks.forEach(track => {
      if (track.enabled !== shouldVideoBeActive) {
        track.enabled = shouldVideoBeActive;
      }
    });

    // Audio is enabled on HIGH & MEDIUM tiers AND when mute is off
    const shouldAudioBeActive = !isMuted && bandwidthTier !== 'low';
    audioTracks.forEach(track => {
      if (track.enabled !== shouldAudioBeActive) {
        track.enabled = shouldAudioBeActive;
      }
    });
  }, [localStream, isMuted, isCameraOn, bandwidthTier]);

  // Clean up a specific peer connection
  const closePeerConnection = (peerId: string) => {
    if (peerConnections.current[peerId]) {
      peerConnections.current[peerId].close();
      delete peerConnections.current[peerId];
    }
    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });
  };

  // Initialize camera/mic and setup WebSocket signaling connection
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    setConnectionState('connecting');

    const initializeMediaAndSignaling = async () => {
      try {
        // 1. Get user media (video & audio)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Apply initial track states
        stream.getVideoTracks().forEach(t => {
          t.enabled = isCameraOn && bandwidthTier === 'high';
        });
        stream.getAudioTracks().forEach(t => {
          t.enabled = !isMuted && bandwidthTier !== 'low';
        });

        // 2. Setup WebSocket signaling
        const signalingUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:3001';
        const ws = new WebSocket(signalingUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[WebRTC] Connected to signaling server');
          setConnectionState('connected');
          
          // Register message sending functions globally in store
          useMeetingStore.setState({
            sendChatMessageFn: (text: string) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'chat-message',
                  text,
                  sender: userName,
                  role: userRole
                }));
              }
            },
            sendAudioChunkFn: (base64Audio: string, mimeType: string, language: string) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'audio-chunk',
                  audio: base64Audio,
                  mimeType,
                  language
                }));
              }
            },
            sendReactionFn: (emoji: string, isHandRaise?: boolean, isHandLower?: boolean) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'reaction',
                  emoji,
                  sender: userName,
                  isHandRaise,
                  isHandLower
                }));
              }
            },
            sendDocumentShareFn: (doc: SharedDocument) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'document-share',
                  doc
                }));
              }
            },
            sendDocumentPageSyncFn: (page: number, docId: string) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'document-page-sync',
                  page,
                  docId
                }));
              }
            }
          });
          
          // Send join message to join the specific room
          ws.send(JSON.stringify({
            type: 'join',
            roomId,
            name: userName,
            role: userRole
          }));
        };

        ws.onmessage = async (event) => {
          if (!isMounted) return;
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'all-users': {
              const currentPeers: Peer[] = data.users;
              setPeers(currentPeers);
              useMeetingStore.setState({ mySignalingId: data.yourId || '' });

              for (const peer of currentPeers) {
                await createPeerConnection(peer.id, ws, true);
              }
              break;
            }

            case 'user-joined': {
              const newUser: Peer = data.user;
              console.log(`[WebRTC] Peer joined: ${newUser.name} (${newUser.id})`);
              setPeers(prev => {
                if (prev.find(p => p.id === newUser.id)) return prev;
                return [...prev, newUser];
              });
              useMeetingStore.getState().addToast(`${newUser.name} joined the meeting`, 'info');
              break;
            }

            case 'offer': {
              const { sender, sdp } = data;
              const pc = await createPeerConnection(sender, ws, false);
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              ws.send(JSON.stringify({
                type: 'answer',
                sdp: answer,
                target: sender
              }));
              break;
            }

            case 'answer': {
              const { sender, sdp } = data;
              const pc = peerConnections.current[sender];
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              }
              break;
            }

            case 'ice-candidate': {
              const { sender, candidate } = data;
              const pc = peerConnections.current[sender];
              if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              break;
            }

            case 'user-left': {
              const { userId } = data;
              const leavingUser = peers.find(p => p.id === userId);
              if (leavingUser) {
                useMeetingStore.getState().addToast(`${leavingUser.name} left the meeting`, 'info');
              }
              closePeerConnection(userId);
              setPeers(prev => prev.filter(p => p.id !== userId));
              break;
            }

            case 'chat-message': {
              const { text, sender, role } = data;
              addTranscriptEntry(text, sender, role);
              useMeetingStore.setState({ captions: `${sender}: "${text}"` });
              break;
            }

            case 'transcription-result': {
              const { text, sender, userId, role } = data;
              const myId = useMeetingStore.getState().mySignalingId;
              const isMe = userId === myId;
              const displayName = isMe ? `${sender} (You)` : sender;

              if (text.trim()) {
                addTranscriptEntry(text.trim(), displayName, role);
                useMeetingStore.setState({ captions: `${displayName}: "${text.trim()}"` });
              }
              break;
            }

            case 'reaction': {
              const { emoji, sender, userId, isHandRaise, isHandLower } = data;
              const myId = useMeetingStore.getState().mySignalingId;
              const isMe = userId === myId;
              
              if (!isMe) {
                if (isHandRaise) {
                  useMeetingStore.getState().setParticipantHandRaise(userId, true);
                  useMeetingStore.getState().addReaction({
                    id: `react-${Date.now()}-${Math.random()}`,
                    emoji: '✋',
                    sender,
                    userId,
                    isHandRaise: true,
                    timestamp: Date.now()
                  });
                  useMeetingStore.getState().addToast(`${sender} raised their hand ✋`, 'info');
                } else if (isHandLower) {
                  useMeetingStore.getState().setParticipantHandRaise(userId, false);
                } else {
                  useMeetingStore.getState().addReaction({
                    id: `react-${Date.now()}-${Math.random()}`,
                    emoji,
                    sender,
                    userId,
                    timestamp: Date.now()
                  });
                  useMeetingStore.getState().setParticipantReaction(userId, emoji);
                }
              }
              break;
            }

            case 'document-share': {
              const { doc, sender } = data;
              if (doc) {
                useMeetingStore.getState().setSharedDocument(doc);
                useMeetingStore.getState().addToast(
                  `👨‍🏫 ${sender} shared presentation: "${doc.fileName}"`,
                  'document',
                  {
                    label: 'Open Presentation',
                    onClick: () => useMeetingStore.getState().togglePresentationViewer(true)
                  }
                );
              }
              break;
            }

            case 'document-page-sync': {
              const { page } = data;
              const isFollowing = useMeetingStore.getState().isFollowingTeacher;
              if (isFollowing && typeof page === 'number') {
                useMeetingStore.getState().setDocumentCurrentPage(page, false);
              }
              break;
            }

            case 'transcription-error': {
              const { error } = data;
              console.error('[Whisper] Server transcription error:', error);
              useMeetingStore.getState().addToast(
                `Whisper Error: ${error}. Falling back to browser Web Speech API.`,
                'error'
              );
              useMeetingStore.getState().setTranscriptionService('webspeech');
              break;
            }

            default:
              break;
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          console.warn('[WebRTC] Signaling connection closed');
          setConnectionState('disconnected');
        };

        ws.onerror = (err) => {
          console.error('[WebRTC] Signaling error:', err);
        };

      } catch (err) {
        console.error('[WebRTC] Failed to access media devices or connect:', err);
        setConnectionState('disconnected');
      }
    };

    const createPeerConnection = async (peerId: string, ws: WebSocket, isInitiator: boolean) => {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current[peerId] = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            target: peerId
          }));
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream();
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: remoteStream,
        }));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          closePeerConnection(peerId);
        }
      };

      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({
            type: 'offer',
            sdp: offer,
            target: peerId
          }));
        } catch (err) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      }

      return pc;
    };

    initializeMediaAndSignaling();

    return () => {
      isMounted = false;
      
      useMeetingStore.setState({ 
        sendChatMessageFn: null, 
        sendAudioChunkFn: null, 
        sendReactionFn: null,
        sendDocumentShareFn: null,
        sendDocumentPageSyncFn: null,
        mySignalingId: '' 
      });
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }

      Object.keys(peerConnections.current).forEach((peerId) => {
        closePeerConnection(peerId);
      });

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, userName, userRole]);

  return {
    localStream,
    remoteStreams,
    connectionState,
    peers
  };
};
export default useWebRTC;
