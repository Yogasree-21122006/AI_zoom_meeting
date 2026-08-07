# 🎥 AI Zoom Meeting — Adaptive Bandwidth Video Conferencing

A smart video conferencing web app built for **rural areas with unstable internet connectivity**. The app automatically detects real-time network bandwidth and adapts the meeting experience — switching between full video, audio-only, and caption-only modes — to ensure uninterrupted classes and meetings even on weak connections.

🔗 **Live Demo:** [https://ai-zoom-meeting.vercel.app/](https://ai-zoom-meeting.vercel.app/)

---

## 📌 Problem Statement

In rural areas, students and professionals often face poor internet connectivity during online classes/meetings. Video calls freeze, audio cuts out, and important discussions get lost. This project solves that by **automatically adapting to available bandwidth** in real time, so the meeting never fully drops — it just degrades gracefully.

---

## ✨ Features

- **🔍 Real-Time Network Detection** — Uses the Network Information API and a live speed-test fallback to continuously monitor connection quality
- **🔄 Automatic Adaptive Switching** (no manual controls):
  - 🟢 **High Bandwidth** → Full video + audio + live captions
  - 🟡 **Medium Bandwidth** → Audio + live captions (video paused to save data)
  - 🔴 **Low Bandwidth** → Captions only, high-contrast display (maximum data savings)
- **📝 Live Captioning** — Real-time scrolling captions during the meeting
- **📋 Meeting Transcript** — Full running transcript with speaker names and timestamps
- **📄 Post-Meeting Summary & Notes** — Auto-generated summary (key points, decisions, action items) with downloadable/printable report
- **🎨 Smooth Adaptive UI** — Framer Motion animations for seamless transitions between modes, with toast notifications on every network change
- **📱 Mobile Responsive** — Built with rural users on mobile networks in mind

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| State Management | Zustand |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 🚀 Getting Started

### 1. Set Up the Signaling Server (WebRTC Calls)

```bash
# Navigate to the signaling server directory
cd server

# Install server dependencies
npm install

# Start the signaling server
npm start
```
The server will start on `http://localhost:3001` (WebSocket server bound to `ws://localhost:3001`).

### 2. Set Up the Frontend Client

```bash
# Navigate to the root directory
cd ..

# Install frontend dependencies
npm install

# Create environment configuration
# A .env file is automatically set up for local development:
# VITE_SIGNALING_SERVER_URL=ws://localhost:3001

# Run the development server
npm run dev
```

Visit `http://localhost:5173` to test the application. Open the app in two different browser windows to test real-time WebRTC calling.
- **Join/Host room:** Generate a room, click Host, copy invitation, open the invite link in another window.
- **Predictive Mode:** Toggle Beta mode in the Network Connection card to see predictive pre-emption switching based on simulated geographical patterns (Ooty, Kodaikanal, Coimbatore City) and live weather forecast integrations.

---

## 🎯 Use Case

Designed for **rural colleges, schools, and remote work scenarios** where consistent high-speed internet cannot be guaranteed — ensuring learning and communication continue without interruption, regardless of network conditions.

---

## 🔮 Roadmap

- [ ] Real WebRTC video/audio streaming integration
- [ ] Whisper-based real-time speech-to-text
- [ ] FastAPI + Supabase backend for transcript storage
- [ ] AI-generated meeting summaries via LLM
- [ ] Multi-user real-time sync

---

## 👤 Author

**Yoga Sree**  
Department of AI & Machine Learning, Kongu Engineering College
