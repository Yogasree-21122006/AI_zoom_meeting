import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const port = process.env.PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'running', timestamp: new Date() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Room structure: roomId -> Map of (socketId -> socket)
const rooms = new Map();

wss.on('connection', (ws) => {
  // Generate unique ID for this peer connection socket
  ws.id = Math.random().toString(36).substring(2, 11);
  console.log(`[Signaling] Peer connected: ${ws.id}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join': {
          const { roomId, name, role } = data;
          ws.roomId = roomId;
          ws.peerName = name;
          ws.peerRole = role;

          console.log(`[Signaling] Peer ${ws.id} (${name}) joining room: ${roomId}`);

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          const roomPeers = rooms.get(roomId);

          // Get existing peers list (excluding current user) to send back
          const existingPeers = [];
          roomPeers.forEach((peerSocket, peerId) => {
            existingPeers.push({
              id: peerId,
              name: peerSocket.peerName,
              role: peerSocket.peerRole
            });
          });

          // Add this new peer to the room Map
          roomPeers.set(ws.id, ws);

          // 1. Send all current room users to the newcomer
          ws.send(JSON.stringify({
            type: 'all-users',
            users: existingPeers
          }));

          // 2. Notify other room users that this newcomer joined
          roomPeers.forEach((peerSocket, peerId) => {
            if (peerId !== ws.id) {
              peerSocket.send(JSON.stringify({
                type: 'user-joined',
                user: {
                  id: ws.id,
                  name: ws.peerName,
                  role: ws.peerRole
                }
              }));
            }
          });
          break;
        }

        case 'offer': {
          const { sdp, target } = data;
          console.log(`[Signaling] Offer from ${ws.id} to target: ${target}`);
          const room = rooms.get(ws.roomId);
          if (room && room.has(target)) {
            room.get(target).send(JSON.stringify({
              type: 'offer',
              sdp,
              sender: ws.id
            }));
          }
          break;
        }

        case 'answer': {
          const { sdp, target } = data;
          console.log(`[Signaling] Answer from ${ws.id} to target: ${target}`);
          const room = rooms.get(ws.roomId);
          if (room && room.has(target)) {
            room.get(target).send(JSON.stringify({
              type: 'answer',
              sdp,
              sender: ws.id
            }));
          }
          break;
        }

        case 'ice-candidate': {
          const { candidate, target } = data;
          const room = rooms.get(ws.roomId);
          if (room && room.has(target)) {
            room.get(target).send(JSON.stringify({
              type: 'ice-candidate',
              candidate,
              sender: ws.id
            }));
          }
          break;
        }

        case 'chat-message': {
          const { text, sender, role } = data;
          console.log(`[Signaling] Chat message in room ${ws.roomId} from ${sender}: ${text}`);
          const room = rooms.get(ws.roomId);
          if (room) {
            room.forEach((peerSocket) => {
              peerSocket.send(JSON.stringify({
                type: 'chat-message',
                text,
                sender,
                role
              }));
            });
          }
          break;
        }

        default:
          console.warn(`[Signaling] Unknown signal received: ${data.type}`);
      }
    } catch (err) {
      console.error('[Signaling] Error parsing signal message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[Signaling] Peer disconnected: ${ws.id}`);
    const roomId = ws.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(ws.id);

      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`[Signaling] Room is empty, deleting: ${roomId}`);
      } else {
        // Notify others that this user left
        room.forEach((peerSocket) => {
          peerSocket.send(JSON.stringify({
            type: 'user-left',
            userId: ws.id
          }));
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`[Signaling] Server listening on port ${port}`);
});
