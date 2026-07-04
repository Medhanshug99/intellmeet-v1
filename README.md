# IntellMeet

IntellMeet is an enterprise meeting and collaboration platform that integrates real-time video conferencing, live chat, team workspaces, and AI-driven meeting intelligence. It is designed to capture meeting context, extract actionable tasks, and manage team productivity in a single ecosystem.

## Core Features

- **Authentication & Workspaces:** Secure JWT-based authentication (supporting both password and email OTP). Users can create and manage isolated team workspaces with role-based access control.
- **Real-Time Video Collaboration:** High-definition, low-latency video and audio powered by WebRTC (via LiveKit). Includes screen sharing, participant list management, live text chat, and host controls (e.g., mute all).
- **AI Meeting Intelligence:** Integrates with Llama 3 (via Groq) to automatically process meeting transcripts when a room closes. It generates structured meeting overviews, key decisions, blockers, and candidate action items.
- **Post-Meeting Execution:** Generated tasks and summaries are saved to the workspace dashboard for follow-up and accountability.
- **Live IntellBot:** An in-meeting AI assistant capable of answering questions based on the live context of the ongoing meeting.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (State Management), Framer Motion, LiveKit Components.
- **Backend:** Node.js, Express, MongoDB (via Mongoose), Socket.io (for real-time signaling and chat outside WebRTC), JWT, bcrypt.
- **AI & Integrations:** Groq (Llama 3 API) for LLM tasks, Resend/Nodemailer for transactional emails.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- LiveKit Server/Cloud credentials
- Groq API Key

### Backend Setup
1. Navigate to the \`backend\` directory.
2. Install dependencies: \`npm install\`
3. Create a \`.env\` file based on the environment variables needed (MongoDB URI, JWT secrets, LiveKit keys, Groq API key, SMTP credentials).
4. Start the server: \`npm run dev\`

### Frontend Setup
1. Navigate to the \`frontend\` directory.
2. Install dependencies: \`npm install\`
3. Create a \`.env\` file for your Vite environment variables (API URL, LiveKit URL).
4. Start the development server: \`npm run dev\`

## Architecture Notes

The application uses a separated modular architecture. The backend isolates business logic into Services, handled by route-specific Controllers, and verified by middleware for authentication and request validation. Background jobs and third-party AI requests use safe fallbacks to ensure the primary video and API services are not blocked during high load or external provider outages.
