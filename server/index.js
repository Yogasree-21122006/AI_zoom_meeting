import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Fix Node.js DNS resolution issues on Windows (prefer IPv4)
dns.setDefaultResultOrder('ipv4first');

// Load environmental variables
dotenv.config({ path: '../.env' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp_audio folder exists for raw audio recording chunks
const tempDir = path.join(__dirname, 'temp_audio');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Initialize OpenAI client if API key is present
const apiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (apiKey) {
  console.log('[Signaling] OpenAI API Key found. Whisper Live Transcription enabled.');
  openai = new OpenAI({ apiKey });
} else {
  console.warn('[Signaling] WARNING: OPENAI_API_KEY environment variable is missing. Whisper AI will fall back to Web Speech API client-side.');
}

// Fallback/Free transcription helper using Hugging Face Serverless Inference API
async function transcribeWithHuggingFace(buffer, language, retries = 3) {
  const whisperLang = language ? language.split('-')[0] : 'en';
  // Use whisper-large-v3-turbo which is super fast and completely free
  const modelUrl = `https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo`;
  
  const headers = {};
  if (process.env.HF_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'audio/webm',
        },
        body: buffer
      });
      
      const result = await response.json();
      
      if (response.status === 503 && result.error && result.error.includes('loading')) {
        // Model is loading on HF servers, wait and retry
        const sleepTime = Math.min((result.estimated_time || 5) * 1000, 3000);
        console.log(`[HF Whisper] Model is loading, waiting ${sleepTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HF Status ${response.status}: ${JSON.stringify(result)}`);
      }
      
      return result.text || '';
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      console.warn(`[HF Whisper] Try ${i + 1} failed, retrying...`, err.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return '';
}

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

  ws.on('message', async (message) => {
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

          // 1. Send all current room users to the newcomer, plus their own ID
          ws.send(JSON.stringify({
            type: 'all-users',
            users: existingPeers,
            yourId: ws.id
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

        case 'audio-chunk': {
          const { audio, mimeType, language } = data;

          try {
            const buffer = Buffer.from(audio, 'base64');
            let transcribedText = '';

            // Try OpenAI Whisper API if client is available
            if (openai) {
              try {
                let ext = 'webm';
                if (mimeType.includes('wav')) ext = 'wav';
                else if (mimeType.includes('mp4')) ext = 'mp4';
                else if (mimeType.includes('m4a')) ext = 'm4a';
                else if (mimeType.includes('mpeg')) ext = 'mp3';
                else if (mimeType.includes('ogg')) ext = 'ogg';

                const tempFilePath = path.join(tempDir, `chunk_${ws.id}_${Date.now()}.${ext}`);
                fs.writeFileSync(tempFilePath, buffer);

                const whisperLang = language ? language.split('-')[0] : 'en';

                const response = await openai.audio.transcriptions.create({
                  file: fs.createReadStream(tempFilePath),
                  model: 'whisper-1',
                  language: whisperLang,
                });

                if (fs.existsSync(tempFilePath)) {
                  fs.unlinkSync(tempFilePath);
                }

                transcribedText = response.text.trim();
              } catch (openaiErr) {
                console.warn('[Whisper] OpenAI Whisper failed (checking fallback)...', openaiErr.message);
                // If OpenAI fails (e.g. RateLimit 429 quota exhausted), fall back to Hugging Face Free API!
                transcribedText = await transcribeWithHuggingFace(buffer, language);
              }
            } else {
              // If no OpenAI API Key, use free Hugging Face API directly!
              transcribedText = await transcribeWithHuggingFace(buffer, language);
            }

            if (transcribedText) {
              const lowerText = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
              const isHallucination = ['hello', 'thank you', 'thank you for watching', 'you', 'bye', 'please', 'oh'].includes(lowerText);
              
              if (!isHallucination) {
                console.log(`[Whisper] Transcribed for ${ws.peerName} (${ws.id}): "${transcribedText}"`);
                
                // Broadcast transcription to the room
                const room = rooms.get(ws.roomId);
                if (room) {
                  room.forEach((peerSocket) => {
                    peerSocket.send(JSON.stringify({
                      type: 'transcription-result',
                      text: transcribedText,
                      sender: ws.peerName,
                      userId: ws.id,
                      role: ws.peerRole
                    }));
                  });
                }
              } else {
                console.log(`[Whisper] Ignored silence hallucination: "${transcribedText}"`);
              }
            }
          } catch (err) {
            console.error('[Whisper] Transcription error:', err);
            // Don't send error to crash the client, let them know it failed so the client falls back to Web Speech API
            ws.send(JSON.stringify({
              type: 'transcription-error',
              error: 'Failed to transcribe: ' + err.message
            }));
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
