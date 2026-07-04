# IntellMeet

Most teams finish a meeting and immediately lose track of what was decided. Notes are incomplete, action items get buried in chat, and the follow-up work that should start the next morning ends up starting a week later, if at all.

IntellMeet is built to fix that loop. It is a real-time video conferencing and team collaboration platform that actually captures what happens in a meeting and turns it into work. Live video, team chat, AI-generated summaries, extracted action items, and a workspace to manage the follow-up are all in one place.

---

## What it does

When a meeting ends, IntellMeet's AI pipeline picks up the transcript and produces a structured summary: an overview, key decisions made, blockers raised, and a list of tasks with suggested owners. Those tasks land directly in the workspace dashboard so the meeting output doesn't have to be re-typed somewhere else.

During the meeting, participants get a live side panel with chat, a participant list, and IntellBot — an in-room AI assistant that can answer questions about what was discussed without interrupting the session.

**Core capabilities:**

- Password and email OTP authentication with secure JWT sessions
- Team workspaces with role-based access (host vs. participant)
- High-definition, low-latency video and audio via WebRTC (LiveKit)
- Screen sharing, participant controls, and host mute-all
- Real-time text chat alongside the video stream
- One-click invite link to bring others into a live room
- Live transcription and AI post-meeting summary (Llama 3 via Groq)
- Task creation from AI output, visible in the workspace dashboard
- Live in-meeting bot that answers contextual questions

---

## Stack

**Frontend:** React 19, Vite, Tailwind CSS, Zustand, Framer Motion, LiveKit Components React

**Backend:** Node.js, Express, MongoDB with Mongoose, Socket.io, JWT, bcrypt

**AI:** Groq API (Llama 3-70b for meeting analysis, Llama 3-8b for live bot)

**Video:** LiveKit Cloud — WebRTC-based SFU for reliable multi-participant media

**Email:** Resend / Nodemailer for transactional OTP delivery

**Payments:** Razorpay (test mode by default)

---

## Running locally

### Prerequisites
- Node.js v18 or later
- A MongoDB connection string (Atlas free tier works fine)
- LiveKit Cloud credentials (free developer account)
- A Groq API key (free tier, no card required)
- SMTP credentials or a Resend API key for OTP emails

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory. Required variables:

```
PORT=5005
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=any_long_random_string
JWT_REFRESH_SECRET=another_long_random_string
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
OPENAI_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_key
SMTP_USER=your_gmail
SMTP_PASS=your_gmail_app_password
CORS_ORIGIN=http://localhost:3005
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```
VITE_API_URL=http://localhost:5005/api/v1
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

```bash
npm run dev
```

The app will be available at `http://localhost:3005`.

---

## Architecture

The backend is structured around a strict separation of concerns. Routes delegate to Controllers, which call into Services where the actual business logic lives. Auth and request validation run as middleware before any handler is reached.

AI processing is asynchronous. When a meeting ends, the transcript is sent to Groq in a background job so the primary API and WebSocket connections are never blocked waiting on a third-party response. If the AI service is unavailable or the API key is missing, the system gracefully skips the summary step rather than erroring out.

Redis is used for token blacklisting and background job queuing. The app runs without it if `REDIS_URL` is not set — background processing falls back to synchronous mode and the core meeting and auth flows continue normally.

WebSocket events (chat, participant presence, signaling) run through Socket.io. Media streams (video and audio) are handled entirely by LiveKit's WebRTC infrastructure, separate from the main server.

---

## Deployment

The backend requires persistent WebSocket connections, so serverless hosting does not work for it. Recommended free setup with no sleep limits: backend on **Koyeb** (free eco instance, always-on), frontend on **Vercel** (free static hosting with global CDN).

Set `CORS_ORIGIN` in your backend environment to the exact Vercel URL once you have it.
