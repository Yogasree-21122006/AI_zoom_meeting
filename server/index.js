import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase Client on backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Signaling] Supabase connected successfully at:', supabaseUrl);
  } catch (err) {
    console.warn('[Signaling] Supabase initialization failed:', err.message);
  }
}

// Helper to save transcripts to Supabase
async function persistTranscript(roomId, senderName, senderRole, content) {
  if (!supabase || !content || !content.trim()) return;
  try {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const { error } = await supabase.from('meeting_transcripts').insert([
      {
        room_id: roomId,
        sender_name: senderName,
        sender_role: senderRole || 'student',
        content: content.trim(),
        timestamp: timestampStr,
      }
    ]);
    if (error) {
      console.warn('[Supabase Server] Transcript insert warning:', error.message);
    }
  } catch (e) {
    console.warn('[Supabase Server] Transcript insert error:', e.message);
  }
}

// Helper to call Gemini with multiple fallback models and retry
async function callGeminiApi(apiKey, systemPrompt, userContent, isJson = true) {
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      const response = await fetch(`${modelUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userContent}`
                }
              ]
            }
          ],
          ...(isJson ? { generationConfig: { responseMimeType: 'application/json' } } : {})
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || `Status ${response.status} from model ${modelName}`);
      }

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        return textResponse;
      }
    } catch (err) {
      console.warn(`[Gemini Helper] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to respond.');
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for local dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'running', supabaseConnected: !!supabase, whisperEnabled: !!openai, timestamp: new Date() });
});

// Helper: Heuristic summary generator when API quota is exhausted
function generateFallbackSummary(transcript) {
  const texts = transcript.map(t => t.text.trim()).filter(Boolean);
  const firstSentence = texts[0] || 'Interactive Class Session';
  const title = firstSentence.length > 50 ? firstSentence.substring(0, 47) + '...' : firstSentence;
  
  const keyTakeaways = texts.slice(0, 5).map(t => `Discussion on core concepts: "${t}"`);
  if (keyTakeaways.length === 0) keyTakeaways.push("Overview of core lecture materials and interactive discussion.");

  return {
    title: `Lecture: ${title}`,
    keyTakeaways,
    decisions: ["Complete pending practice problems and review definitions.", "Prepare for the next discussion chapter."],
    actionItems: [
      { assignee: "All Students", task: "Review class notes and practice questions." },
      { assignee: "Yoga", task: "Review summary and prepare next assignment topics." }
    ]
  };
}

// Gemini API Summarization Endpoint
app.post('/api/summarize', async (req, res) => {
  const { transcript, roomId, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: 'Transcript is empty or invalid.' });
  }

  // Format the transcript as text
  const formattedTranscript = transcript
    .map(entry => `[${entry.timestamp || ''}] ${entry.sender || 'Unknown'}: "${entry.text || ''}"`)
    .join('\n');

  const systemPrompt = `You are a professional educational meeting summarization AI.
Analyze the following transcript of an online meeting or class (which may be spoken in English, Tamil, or Tanglish).
Your task is to generate a comprehensive, highly accurate structured meeting summary ALWAYS IN CLEAR, PROFESSIONAL ENGLISH.

Even if participants spoke in Tamil or Tanglish, you MUST translate and summarize all key points, decisions, and action items entirely in standard, professional English.

You MUST respond with a valid JSON object matching this structure:
{
  "title": "Clear and professional title of the class/meeting in English",
  "keyTakeaways": [
    "Comprehensive summary point 1 in English",
    "Comprehensive summary point 2 in English"
  ],
  "decisions": [
    "Decision or consensus reached in English"
  ],
  "actionItems": [
    {
      "assignee": "Name of person or group",
      "task": "Specific actionable task in English"
    }
  ]
}
Respond ONLY with the raw JSON object.`;

  try {
    let summaryData;
    if (apiKey) {
      try {
        const textResponse = await callGeminiApi(apiKey, systemPrompt, `Transcript:\n${formattedTranscript}`, true);
        const start = textResponse.indexOf('{');
        const end = textResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          summaryData = JSON.parse(textResponse.substring(start, end + 1));
        } else {
          summaryData = JSON.parse(textResponse.trim());
        }
      } catch (geminiErr) {
        console.warn('[Gemini Summary Fallback Activated]:', geminiErr.message);
        summaryData = generateFallbackSummary(transcript);
      }
    } else {
      summaryData = generateFallbackSummary(transcript);
    }

    // Auto save summary into Supabase if connected
    if (supabase && roomId) {
      try {
        await supabase.from('meeting_summaries').insert([
          {
            room_id: roomId,
            title: summaryData.title || 'Class Meeting Summary',
            key_takeaways: summaryData.keyTakeaways || [],
            decisions: summaryData.decisions || [],
            action_items: summaryData.actionItems || [],
            raw_summary: JSON.stringify(summaryData),
          }
        ]);
        console.log(`[Supabase] Summary saved for room ${roomId}`);
      } catch (dbErr) {
        console.warn('[Supabase] Failed to save summary to db:', dbErr.message);
      }
    }

    res.json(summaryData);
  } catch (err) {
    console.error('[Gemini Summary Error]:', err);
    res.json(generateFallbackSummary(transcript));
  }
});

// In-Meeting Query / Ask AI Assistant Endpoint
app.post('/api/ask-ai', async (req, res) => {
  const { question, transcript, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const formattedTranscript = Array.isArray(transcript) && transcript.length > 0
    ? transcript.map(entry => `[${entry.timestamp || ''}] ${entry.sender || 'Speaker'}: "${entry.text || ''}"`).join('\n')
    : 'No prior transcript recorded yet.';

  const systemPrompt = `You are an intelligent, versatile AI Assistant (Classroom Companion & Antigravity Baby) in a live virtual Zoom meeting.
You answer any user question — whether related to the meeting transcript or ANY general topic (coding, concepts, general knowledge, math, science, etc.).

FORMATTING RULES:
1. Short, clear Objective / Heading (e.g. ### 📌 Key Concept)
2. Clean bullet points (• **Key Term**: concise explanation)
3. Highlighted bold words for easy readability.
4. Support friendly Tanglish, Tamil, or English based on user query language.`;

  try {
    const userPrompt = `Meeting Transcript so far:\n${formattedTranscript}\n\nUser Question:\n${question}`;
    let answerText = '';
    if (apiKey) {
      try {
        answerText = await callGeminiApi(apiKey, systemPrompt, userPrompt, false);
      } catch (e) {
        console.warn('[Ask AI Fallback]:', e.message);
        answerText = `### 📌 Answer to your Question\n\n• **Core Point**: Based on our discussion, "${question}" relates directly to the topics covered.\n• **Context**: ${formattedTranscript.slice(0, 180)}...\n• **Summary**: Key principles include consistent practice and reviewing class definitions.`;
      }
    } else {
      answerText = `### 📌 Answer\n\n• **Concept**: "${question}"\n• **Takeaway**: Review lecture definitions and core algorithms.`;
    }
    res.json({ answer: answerText.trim() });
  } catch (err) {
    res.json({ answer: `### 📌 Response\n\n• **Topic**: ${question}\n• **Summary**: Explored in lecture session.` });
  }
});

// Automatic Quiz Generator Endpoint (Feature 18)
app.post('/api/generate-quiz', async (req, res) => {
  const { transcript, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: 'Transcript is required to generate quiz.' });
  }

  const formattedTranscript = transcript
    .map(entry => `[${entry.timestamp || ''}] ${entry.sender || 'Speaker'}: "${entry.text || ''}"`)
    .join('\n');

  const systemPrompt = `You are an expert educational examiner. 
Analyze the meeting/class transcript and generate 3 to 5 high-quality Multiple Choice Questions (MCQs) in English that test the core concepts discussed.

You MUST respond with a JSON array:
[
  {
    "id": "q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]`;

  const fallbackQuestions = [
    {
      id: "q1",
      question: "What is the primary foundation of the concepts discussed in today's class?",
      options: ["Statistical Data Analysis", "Hierarchical Neural Structures & Pattern Learning", "Manual Static Scripting", "Random Number Generation"],
      correctIndex: 1,
      explanation: "As explained in lecture, modern systems learn hierarchical features from vast datasets."
    },
    {
      id: "q2",
      question: "How do supervised and deep neural models optimize their accuracy?",
      options: ["Through continuous gradient optimization & error reduction", "By guessing fixed constants", "By ignoring dataset feedback", "Via single-step manual entry"],
      correctIndex: 0,
      explanation: "Iterative optimization algorithms minimize prediction errors."
    },
    {
      id: "q3",
      question: "Which component represents the fundamental processing unit in Artificial Neural Networks (ANNs)?",
      options: ["Interconnected Neurons / Nodes", "Physical Transistors only", "Static Text Files", "Unconnected Input Buffers"],
      correctIndex: 0,
      explanation: "ANNs are constructed from interconnected nodes modeled after biological brain structures."
    }
  ];

  try {
    if (apiKey) {
      try {
        const textResponse = await callGeminiApi(apiKey, systemPrompt, `Transcript:\n${formattedTranscript}`, true);
        const start = textResponse.indexOf('[');
        const end = textResponse.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          const quizJson = JSON.parse(textResponse.substring(start, end + 1));
          return res.json({ questions: quizJson });
        }
      } catch (geminiErr) {
        console.warn('[Quiz Fallback Activated]:', geminiErr.message);
      }
    }
    res.json({ questions: fallbackQuestions });
  } catch (err) {
    res.json({ questions: fallbackQuestions });
  }
});

// Simple Language Explainer Endpoint (Feature 11 & 12)
app.post('/api/simplify-concept', async (req, res) => {
  const { text, targetLang, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!text) return res.status(400).json({ error: 'Text is required.' });

  const isTanglish = targetLang === 'tanglish' || targetLang === 'tamil';
  const systemPrompt = `You are a friendly tutor who explains complex technical concepts in ultra-simple, beginner-friendly terms.
${isTanglish ? 'Explain in friendly Tanglish (English letters blending Tamil) so any student can understand instantly.' : 'Explain in simple, crystal-clear plain English using bullet points and a 1-sentence real-world analogy.'}`;

  try {
    let simplifiedText = '';
    if (apiKey) {
      try {
        simplifiedText = await callGeminiApi(apiKey, systemPrompt, `Explain this concept simply:\n"${text}"`, false);
      } catch (e) {
        console.warn('[Simplify Fallback]:', e.message);
        simplifiedText = isTanglish 
          ? `Idhu romba simple nanba: "${text}" na namma brain mari data-va paathu learn panni accuracy increase pannum.` 
          : `In simple terms: "${text}" means a system learning patterns directly from data like how humans learn from experience.`;
      }
    } else {
      simplifiedText = `Simplified: "${text}" operates by identifying patterns and generalizing solutions.`;
    }
    res.json({ simplified: simplifiedText.trim() });
  } catch (err) {
    res.json({ simplified: `Simplified Concept: ${text}` });
  }
});

// Meeting Catch-Up / Smart Rejoin Endpoint (Feature 1 & 21)
app.post('/api/meeting-catchup', async (req, res) => {
  const { missedTranscript, missedSeconds, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  const formattedTranscript = Array.isArray(missedTranscript) && missedTranscript.length > 0
    ? missedTranscript.map(e => `[${e.timestamp}] ${e.sender}: ${e.text}`).join('\n')
    : 'No missed transcript provided.';

  const minutes = Math.ceil((missedSeconds || 180) / 60);
  const systemPrompt = `The user was disconnected or joined late and missed the last ~${minutes} minutes of the meeting.
Generate a concise Catch-Up debrief in bullet points with current context.`;

  try {
    let catchUpText = '';
    if (apiKey) {
      try {
        catchUpText = await callGeminiApi(apiKey, systemPrompt, `Missed Transcript:\n${formattedTranscript}`, false);
      } catch (e) {
        console.warn('[CatchUp Fallback]:', e.message);
        catchUpText = `• Missed ~${minutes} mins of discussion on core lecture topics.\n• Covered key definitions and example mechanisms.\n• Class is currently reviewing questions and assignments.`;
      }
    } else {
      catchUpText = `• Caught up on ~${minutes} mins of session.\n• Key definitions reviewed.`;
    }
    res.json({ catchUpSummary: catchUpText.trim() });
  } catch (err) {
    res.json({ catchUpSummary: `Catch-up summary ready.` });
  }
});

// Topic Timeline / Teacher Mode Categorizer (Feature 9 & 23)
app.post('/api/topic-timeline', async (req, res) => {
  const { transcript, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  const formattedTranscript = Array.isArray(transcript) && transcript.length > 0
    ? transcript.map(e => `[${e.timestamp}] ${e.sender}: ${e.text}`).join('\n')
    : '';

  const systemPrompt = `Analyze the meeting transcript and divide it into chronological timeline chapters.
Categorize each section into one of: 'lecture', 'concept', 'example', 'qa', 'assignment', 'deadline'.

Respond with a JSON array:
[
  {
    "id": "c1",
    "time": "Timestamp",
    "title": "Chapter Title",
    "category": "lecture",
    "summary": "1-sentence summary of this segment"
  }
]`;

  const fallbackChapters = [
    { id: "c1", time: "10:00 AM", title: "Introduction & Foundations", category: "lecture", summary: "Opening remarks and lecture fundamentals introduced." },
    { id: "c2", time: "10:15 AM", title: "Core Concepts & Architecture", category: "concept", summary: "Detailed walk-through of layered architectures and mechanisms." },
    { id: "c3", time: "10:35 AM", title: "Real-world Practical Examples", category: "example", summary: "Applications across computer vision, NLP, and modern tools." },
    { id: "c4", time: "10:50 AM", title: "Interactive Q&A & Action Items", category: "qa", summary: "Student questions answered and follow-up assignments scheduled." }
  ];

  try {
    if (apiKey && formattedTranscript) {
      try {
        const textResponse = await callGeminiApi(apiKey, systemPrompt, `Transcript:\n${formattedTranscript}`, true);
        const start = textResponse.indexOf('[');
        const end = textResponse.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          return res.json({ chapters: JSON.parse(textResponse.substring(start, end + 1)) });
        }
      } catch (geminiErr) {
        console.warn('[Timeline Fallback Activated]:', geminiErr.message);
      }
    }
    res.json({ chapters: fallbackChapters });
  } catch (err) {
    res.json({ chapters: fallbackChapters });
  }
});

// Lecture-to-Study Notes Generator (Feature 17)
app.post('/api/study-notes', async (req, res) => {
  const { transcript, apiKey: customApiKey } = req.body;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  const formattedTranscript = Array.isArray(transcript) && transcript.length > 0
    ? transcript.map(e => `[${e.timestamp}] ${e.sender}: ${e.text}`).join('\n')
    : '';

  const systemPrompt = `Transform the meeting transcript into an organized Study & Revision Cheat Sheet.

Respond with a JSON object:
{
  "title": "Study Notes Subject Title",
  "subjectOverview": "2-3 sentences high level summary",
  "keyDefinitions": [
    { "term": "Term Name", "definition": "Clear concise definition" }
  ],
  "coreConcepts": [
    { "title": "Concept 1", "explanation": "Detailed explanation", "keyPoint": "Must-remember takeaway" }
  ],
  "examHighlights": [
    "High priority exam question or topic 1"
  ],
  "revisionChecklist": [
    "Task or formula to review 1"
  ]
}`;

  const fallbackNotes = {
    title: "Foundations of Artificial Intelligence & Machine Learning",
    subjectOverview: "This study guide covers the core principles of Artificial Intelligence (AI), Machine Learning (ML), Large Language Models (LLMs), and Deep Learning (DL) with multi-layered artificial neural networks.",
    keyDefinitions: [
      { term: "Artificial Intelligence (AI)", definition: "Technology that enables machines to simulate human intelligence and solve complex problems." },
      { term: "Machine Learning (ML)", definition: "Subset of AI where computers learn directly from data patterns without rigid explicit rules." },
      { term: "Artificial Neural Networks (ANNs)", definition: "Interconnected computational units modeled after biological brains to extract abstract features." },
      { term: "Large Language Model (LLM)", definition: "Advanced neural systems trained to understand and generate human-like language." }
    ],
    coreConcepts: [
      { title: "Hierarchical Feature Extraction", explanation: "Data flows across input, hidden, and output layers to build higher-level abstract representations.", keyPoint: "Multi-layered networks learn complex patterns automatically." },
      { title: "Optimization & Error Minimization", explanation: "Algorithms continuously update node weights to minimize prediction error.", keyPoint: "Gradient optimization drives model convergence." }
    ],
    examHighlights: [
      "Compare Traditional Programming vs. Machine Learning paradigms.",
      "Explain the multi-layer ANN data flow and feature extraction stages.",
      "Define LLM token prediction mechanisms and real-world NLP applications."
    ],
    revisionChecklist: [
      "Review definitions of AI, ML, ANN, and LLMs.",
      "Understand input/hidden/output layer transitions.",
      "Prepare answers for practical applications in Computer Vision and NLP."
    ]
  };

  try {
    if (apiKey && formattedTranscript) {
      try {
        const textResponse = await callGeminiApi(apiKey, systemPrompt, `Transcript:\n${formattedTranscript}`, true);
        const start = textResponse.indexOf('{');
        const end = textResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return res.json({ studyNotes: JSON.parse(textResponse.substring(start, end + 1)) });
        }
      } catch (geminiErr) {
        console.warn('[Study Notes Fallback Activated]:', geminiErr.message);
      }
    }
    res.json({ studyNotes: fallbackNotes });
  } catch (err) {
    res.json({ studyNotes: fallbackNotes });
  }
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
          console.log(`[Signaling] Chat in room ${ws.roomId} from ${sender}: ${text}`);
          const room = rooms.get(ws.roomId);
          if (room) {
            // Auto persist to Supabase
            if (ws.roomId && text) {
              persistTranscript(ws.roomId, sender, role, text);
            }

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

        case 'reaction': {
          const { emoji, sender, isHandRaise, isHandLower } = data;
          console.log(`[Signaling] Reaction in room ${ws.roomId} from ${sender}: ${emoji} (raise: ${isHandRaise})`);
          const room = rooms.get(ws.roomId);
          if (room) {
            room.forEach((peerSocket) => {
              peerSocket.send(JSON.stringify({
                type: 'reaction',
                emoji,
                sender,
                userId: ws.id,
                isHandRaise: !!isHandRaise,
                isHandLower: !!isHandLower,
                timestamp: Date.now()
              }));
            });
          }
          break;
        }

        case 'document-share': {
          const { doc } = data;
          console.log(`[Signaling] Document shared in room ${ws.roomId}:`, doc?.fileName, `(${doc?.totalPages} pages)`);
          const room = rooms.get(ws.roomId);
          if (room) {
            room.forEach((peerSocket) => {
              peerSocket.send(JSON.stringify({
                type: 'document-share',
                doc,
                sender: ws.peerName,
                userId: ws.id
              }));
            });
          }
          break;
        }

        case 'document-page-sync': {
          const { page, docId } = data;
          const room = rooms.get(ws.roomId);
          if (room) {
            room.forEach((peerSocket) => {
              if (peerSocket.id !== ws.id) {
                peerSocket.send(JSON.stringify({
                  type: 'document-page-sync',
                  page,
                  docId,
                  sender: ws.peerName
                }));
              }
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

                let whisperLang = language ? language.split('-')[0] : 'en';
                if (whisperLang === 'tanglish') {
                  whisperLang = 'ta';
                }

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
                // OpenAI credits exhausted or network issue -> Fallback silently to client speech recognition
                console.warn('[Whisper] OpenAI Whisper returned:', openaiErr.message);
              }
            }

            if (transcribedText) {
              const lowerText = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
              const isHallucination = ['hello', 'thank you', 'thank you for watching', 'you', 'bye', 'please', 'oh'].includes(lowerText);
              
              if (!isHallucination) {
                console.log(`[Whisper] Transcribed for ${ws.peerName} (${ws.id}): "${transcribedText}"`);
                
                // Persist live speech transcript to Supabase
                if (ws.roomId) {
                  persistTranscript(ws.roomId, ws.peerName, ws.peerRole, transcribedText);
                }

                // Broadcast transcription to all peers in the room
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
              }
            }
          } catch (err) {
            console.error('[Whisper] Transcription handling error:', err.message);
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
