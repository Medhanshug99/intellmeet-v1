# IntellMeet AI

**Live Demo:** [https://intellmeet-v2-nu.vercel.app](https://intellmeet-v2-nu.vercel.app)

## What is IntellMeet AI?

Meetings create decisions. Most tools stop there. IntellMeet continues.

It is a real-time enterprise collaboration platform built around one premise: the gap between a meeting ending and work actually starting should not exist. The platform handles live video, captures the transcript, extracts decisions and action items using AI, and lands all of it directly into a team workspace where tasks can be tracked to completion — without switching tools.

---

## The Problem it Solves

Most teams have this problem. A meeting ends, people go back to Slack, someone pastes rough notes, action items get buried, and three days later a manager is asking who was supposed to do what. The follow-up work that should start immediately starts late, if at all.

The fragmentation is the root cause. Video lives in one place, notes in another, tasks in a third. Context gets copied across systems manually and degrades at every step.

IntellMeet collapses the loop: **Meet → Transcript → AI Summary → Action Items → Task Board**. No copying, no manual write-ups, no lost decisions.

---

## How It Works

After a meeting ends, the platform's AI pipeline processes the full transcript and generates a structured output:

- **Overview** — a 2-3 sentence summary of what the meeting was about
- **Key Decisions** — what was actually decided, in bullet form
- **Blockers** — issues raised that need to be resolved
- **Action Items** — tasks with suggested owners pulled directly from the conversation

The host reviews the draft, makes any corrections, and publishes it. From that point, the summary and tasks are visible to every workspace member. The meeting becomes a traceable, searchable work artifact instead of a memory.

During the meeting, a live side panel gives participants a persistent chat, a participant list, and IntellBot — an in-room AI assistant that can answer questions about what has been said so far without interrupting the session.

---

## Feature Overview

**Authentication**
- Email OTP (one-time password) and password-based login
- JWT access tokens (15-minute expiry) with rotating refresh tokens (7 days)
- OTP rate limiting: 5 failed attempts triggers a 15-minute lockout per email
- Role-based access control enforced at the middleware layer — Guest, Member, Host, Admin

**Workspaces**
- Each workspace is an isolated environment with its own members, meetings, and task board
- Users can belong to multiple workspaces
- Hosts manage participants; Admins manage workspace membership and roles

**Video and Audio**
- HD, low-latency video and audio via WebRTC, using LiveKit's SFU architecture
- SFU (Selective Forwarding Unit) means streams scale linearly — no mesh overhead
- Screen share, microphone, and camera controls with single-click toggling
- Host controls: mute all, remove participant
- Pre-join lobby for camera and mic check before entering a room
- One-click invite link generation from the Participants panel

**AI Pipeline**
- Transcript tied to a workspace and meeting ID for full auditability
- Llama 3 (via Groq) generates structured JSON output: overview, decisions, blockers, tasks
- Retry queue with exponential backoff — if the AI call fails, it retries without blocking the API
- Fallback: if the AI pipeline is unavailable, the system skips summarization gracefully and logs the failure. The meeting continues unaffected.
- Summaries stay in Draft state until the Host reviews and publishes them
- Non-host members see "Summary is under review" until it is published

**Task Management**
- AI-extracted action items become tasks with assignees on the workspace board
- Task status: To Do → In Progress → Done
- Tasks track their source meeting for traceability
- AI-sourced and manually-created tasks are both supported

**Security**
- All API routes protected by JWT middleware
- RBAC enforced server-side — role checks are not trust-the-frontend
- Helmet.js for HTTP security headers (XSS protection, HSTS, Content-Security-Policy)
- CORS restricted to known frontend origins
- WebSocket connections require a valid JWT on handshake

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Zustand, Framer Motion |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io |
| Video / WebRTC | LiveKit Cloud (SFU) |
| AI | Groq API — Llama 3-70b (meeting analysis), Llama 3-8b (live bot) |
| Auth | JWT, bcrypt, custom OTP via Resend / Nodemailer |
| Background Jobs | BullMQ (Redis queue) — graceful fallback to sync if Redis is absent |

---

## Running Locally

### Prerequisites
- Node.js v18 or later
- MongoDB connection string (Atlas free tier works)
- LiveKit Cloud credentials
- Groq API key (free, no credit card required)
- SMTP credentials or Resend API key for OTP email delivery

### Backend

```bash
cd backend
npm install
```

Create a `.env` in the `backend/` directory with the following:

```env
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

RESEND_API_KEY=your_resend_api_key
SMTP_USER=your_gmail_address
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

Create a `.env` in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5005/api/v1
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

```bash
npm run dev
```

App runs at `http://localhost:3005`.

---

## Architecture

Business logic lives entirely in the service layer. Controllers handle request/response; services own the logic. Middleware handles auth validation and request validation before any handler is reached. This separation makes each layer independently testable and replaceable.

AI processing is async by design. When a meeting ends, the transcript is queued via BullMQ and processed in the background. The API responds immediately. If Redis is not available (e.g., local dev without Docker), the system falls back to synchronous processing — no configuration change required.

WebSocket events (chat, participant presence, signaling) run through Socket.io on the main server. Media streams (video and audio) are offloaded entirely to LiveKit's infrastructure and never touch the application server.

Performance targets from the original specification:
- API response time: under 200ms at p95 for non-AI endpoints
- WebSocket latency: under 100ms for chat and presence events
- AI summary generation: under 2 minutes for a 60-minute meeting
- Video join time: under 3 seconds from "Join Now" to first frame

---

## Deployment

The backend requires persistent WebSocket connections, so serverless hosting (Vercel, Netlify Functions) does not work for it.

Recommended free setup with no sleep limits:
- **Backend**: Koyeb free eco instance — always-on, supports WebSockets
- **Frontend**: Vercel — static hosting with global CDN

After deploying both, set `CORS_ORIGIN` in the backend environment to the exact Vercel URL.
