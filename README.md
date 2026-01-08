# StreamStudio

A professional live streaming studio built with Next.js, enabling content creators to broadcast to multiple platforms simultaneously.

## Features

- 🎥 **Multi-Platform Streaming** - Stream to YouTube, Twitch, Facebook, LinkedIn, and custom RTMP destinations
- 👥 **Guest Management** - Invite guests with unique links, manage green room, admit/remove participants
- 🎨 **Overlay System** - Lower thirds, logos, text overlays, countdowns, and banners
- 🖼️ **Scene Management** - Multiple layouts (solo, split, grid, spotlight) with smooth transitions
- 🎧 **Audio Mixing** - Per-source volume, pan, mute controls with real-time VU meters
- 📹 **Local Recording** - Record your streams locally in WebM format
- 💬 **Live Chat** - In-studio chat and aggregated comments from platforms

## Tech Stack

### Frontend
- **Next.js 14** with TypeScript
- **Zustand** for state management
- **Canvas API** for video compositing
- **Web Audio API** for audio processing
- **WebRTC** for real-time communication

### Backend
- **Express.js** REST API
- **WebSocket** signaling server
- **Prisma** ORM with PostgreSQL
- **nginx-rtmp** for RTMP streaming
- **Redis** for caching and pub/sub
- **MinIO** for S3-compatible storage

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd streaming-studio
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres redis minio rtmp
   ```

4. **Start backend services**
   ```bash
   cd backend/api && npm install && npm run dev
   cd backend/signaling && npm install && npm run dev
   ```

5. **Start frontend**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Navigate to `http://localhost:3000`

### Full Docker Setup

To run everything in Docker:

```bash
docker-compose up --build
```

## Project Structure

```
streaming-studio/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── studio/[roomId]/    # Studio interface
│   │   ├── join/[code]/        # Guest join page
│   │   └── login/              # Authentication
│   ├── components/
│   │   ├── audio/              # VU meters, mixer
│   │   ├── destinations/       # Platform cards
│   │   ├── overlays/           # Lower thirds, logos
│   │   ├── studio/             # Main studio components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities
│   │   ├── audio/              # AudioProcessor
│   │   ├── canvas/             # VideoCompositor
│   │   ├── recording/          # RecordingManager
│   │   └── streaming/          # StreamManager
│   └── stores/                 # Zustand stores
├── backend/
│   ├── api/                    # REST API service
│   │   ├── src/routes/         # API endpoints
│   │   └── prisma/             # Database schema
│   └── signaling/              # WebSocket server
├── infrastructure/
│   └── nginx-rtmp/             # RTMP server config
└── docker-compose.yml          # Container orchestration
```

## Key Components

### VideoCompositor
Canvas-based video compositing supporting multiple sources, layouts, and overlays with output to MediaStream.

### AudioProcessor
Web Audio API implementation for mixing multiple audio sources with volume, pan, and real-time metering.

### useWebRTC
Hook for managing WebRTC peer connections, signaling, and media transport.

### StreamManager
Manages multi-destination RTMP streaming with status tracking and stats.

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001
```

**Backend** (`backend/api/env.example`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Login |
| GET | /api/rooms | List user's rooms |
| POST | /api/rooms | Create room |
| POST | /api/rooms/:id/invite | Generate invite link |
| POST | /api/rooms/:id/start | Start broadcast |
| GET | /api/destinations | List destinations |
| POST | /api/destinations | Add destination |

## License

MIT
