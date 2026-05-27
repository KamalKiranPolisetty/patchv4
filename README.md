# Patch — AI-Powered IT Support Chatbot

Patch is a Next.js application that provides AI-powered IT support via a chat interface. Users can report VDI, Printer, or Scanner issues, upload PDF documentation for context, and receive AI-driven resolutions powered by Ollama.

## Features

- **Authentication**: Email/password signup and login with JWT sessions
- **Category Tiles**: VDI, Printer, Scanner issue categories
- **PDF Upload**: Upload documentation PDFs per category; text is extracted and used as AI context
- **AI Chat**: Conversational support using Ollama (`gemma4:31b-cloud`) with RAG
- **Incident Management**: Automatic incident creation and tracking
- **Incident Timeline**: Visual status timeline (Open → In Progress → Resolved)
- **Feedback System**: 1–5 star rating after incident resolution or escalation

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Ollama with `gemma4:31b-cloud` model

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Ollama URL
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `OLLAMA_BASE_URL` | Ollama server URL (default: http://localhost:11434) |

## Routes

- `/login` — Authentication (login/signup)
- `/` — Main page with category tiles and chat
- `/incidents` — List of user incidents
- `/incidents/[id]` — Incident detail with timeline and chat

## API Endpoints

- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/documents/upload` — Upload PDF for a category
- `POST /api/chat` — Send message, get AI response
- `GET /api/incidents` — List incidents
- `GET /api/incidents/[id]` — Get incident details
- `POST /api/feedback` — Submit star rating

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npx tsc --noEmit # Type check
```
