import { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';

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
    const localUser = {
      id: 'local-user',
      name: `${userName} (You)`,
      avatarColor: userRole === 'teacher' ? 'bg-indigo-600' : 'bg-blue-500',
      role: userRole,
      isSpeaking: false,
      isCameraOn: isCameraOn && bandwidthTier === 'high',
      isMuted: isMuted || bandwidthTier === 'low'
    };

    const remoteUsers = peers.map(p => ({
      id: p.id,
      name: p.name,
      avatarColor: p.role === 'teacher' ? 'bg-indigo-600' : 'bg-blue-500',
      role: p.role,
      isSpeaking: false,
      isCameraOn: true, // Default to true for remote user camera state in grid
      isMuted: false
    }));

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
          
          // Register message sending function globally in store
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
              // We are joining the room and need to initiate call to all existing peers
              const currentPeers: Peer[] = data.users;
              setPeers(currentPeers);

              for (const peer of currentPeers) {
                await createPeerConnection(peer.id, ws, true);
              }
              break;
            }

            case 'user-joined': {
              // A new peer joined. Add them to list
              const newUser: Peer = data.user;
              console.log(`[WebRTC] Peer joined: ${newUser.name} (${newUser.id})`);
              setPeers(prev => {
                if (prev.find(p => p.id === newUser.id)) return prev;
                return [...prev, newUser];
              });
              break;
            }

            case 'offer': {
              // Received offer from peer. We should create a connection and answer.
              const { sender, sdp } = data;
              console.log(`[WebRTC] Offer received from ${sender}`);
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
              // Received answer from peer we initiated to. Set description.
              const { sender, sdp } = data;
              console.log(`[WebRTC] Answer received from ${sender}`);
              const pc = peerConnections.current[sender];
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              }
              break;
            }

            case 'ice-candidate': {
              // Received ice candidate. Add candidate to connection.
              const { sender, candidate } = data;
              const pc = peerConnections.current[sender];
              if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              break;
            }

            case 'user-left': {
              // Peer left the room
              const { userId } = data;
              console.log(`[WebRTC] Peer left: ${userId}`);
              closePeerConnection(userId);
              setPeers(prev => prev.filter(p => p.id !== userId));
              break;
            }

            case 'chat-message': {
              const { text, sender, role } = data;
              addTranscriptEntry(text, sender, role);
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
      console.log(`[WebRTC] Creating RTCPeerConnection for ${peerId}, initiator: ${isInitiator}`);
      
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current[peerId] = pc;

      // Add local media tracks to connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE Candidates and send to peer
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            target: peerId
          }));
        }
      };

      // Receive remote tracks and map them to remote stream state
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote track from ${peerId}:`, event.track.kind);
        const remoteStream = event.streams[0] || new MediaStream();
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: remoteStream,
        }));
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Peer connection state with ${peerId}: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          closePeerConnection(peerId);
        }
      };

      // If we are initiating, create offer and send to peer
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
      
      // Clear message sending function on unmount
      useMeetingStore.setState({ sendChatMessageFn: null });
      
      // Stop all tracks in the local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }

      // Close all peer connections
      Object.keys(peerConnections.current).forEach((peerId) => {
        closePeerConnection(peerId);
      });

      // Close WebSocket
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
