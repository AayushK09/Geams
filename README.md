# GEAMS - Self-Hosted WebRTC Meeting Platform

A fully self-hosted Teams-like video meeting platform built with peer-to-peer WebRTC. No third-party media services. Deployable on any platform including **Render, Railway, Fly.io, and VPS**.

## Features

✅ **Multi-user Video Conferencing** - Multiple participants in a room  
✅ **Audio/Video Controls** - Individual mic and camera muting  
✅ **Screen Sharing** - Share your screen with all participants  
✅ **Real-time Chat** - Built-in chat during meetings  
✅ **Fully Self-Hosted** - Complete control over your data  
✅ **No Vendor Lock-in** - Zero dependency on paid media services  
✅ **Render/Cloud Ready** - Works on any platform that supports WebSocket  
✅ **P2P Architecture** - Media flows directly between browsers (no server bandwidth cost)

## Architecture

```
Browser A ──WebSocket signaling──► NestJS Backend (Render/VPS)
    │                                       │
    │◄──────── offer/answer/ICE ────────────┤
    │                                       │
    └──────── P2P video/audio ─────────────► Browser B
```

This platform uses **peer-to-peer WebRTC**:

- The backend only relays signaling messages (offer, answer, ICE candidates) over WebSocket
- Video and audio travel **directly between browsers** using STUN traversal
- No server-side media processing = no UDP port requirements = deploys anywhere

## Scalability

| Participants | Architecture             | Server Load                                   |
| ------------ | ------------------------ | --------------------------------------------- |
| 2            | P2P direct               | Minimal (signaling only)                      |
| 3–6          | P2P mesh                 | Low–medium (each peer connects to all others) |
| 7–15         | P2P mesh (degraded)      | Medium (N² connections)                       |
| 15+          | Needs SFU (e.g. LiveKit) | N/A                                           |

**P2P mesh scaling:**  
Each participant opens a direct connection to every other participant. With N users, each browser maintains N-1 connections and uploads its stream N-1 times. This works well for small groups (2–8 people) and requires **zero server bandwidth** for media.

**To scale beyond 8–10 participants**, you can swap the signaling backend to use [LiveKit](https://livekit.io) (free cloud tier) or self-host it on a server that supports UDP (Fly.io, DigitalOcean, etc.).

**Server requirements are minimal** — the backend only handles:

- WebSocket connections (~10 KB/s per user)
- REST API for room management
- SQLite database reads/writes

## Tech Stack

### Frontend

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time signaling
- **Native WebRTC** - `RTCPeerConnection` (no extra library needed)

### Backend

- **NestJS** - Node.js framework
- **Socket.IO** - WebSocket signaling relay
- **TypeORM** - Database ORM
- **SQLite** - Lightweight database

### Infrastructure

- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy (optional)

## Hardware Requirements

### Minimum (Local Development)

- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD

### Recommended (Production VPS)

- CPU: 4-8 cores
- RAM: 8-16 GB
- Storage: 100 GB SSD
- Bandwidth: High-speed

## Installation

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for containerized deployment)

### Local Development Setup

1. **Clone and navigate to project:**

```bash
cd geams
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create .env file:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
DATABASE_URL=sqlite:./data/meetings.db
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:3000
```

4. **Create necessary directories:**

```bash
mkdir -p data
```

5. **Run development servers:**

```bash
npm run dev
```

This will start:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000

### Docker Deployment

1. **Build Docker images:**

```bash
npm run docker:build
```

2. **Start containers:**

```bash
npm run docker:up
```

3. **View logs:**

```bash
npm run docker:logs
```

4. **Stop containers:**

```bash
npm run docker:down
```

Access the application at:

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## Usage

### Creating a Meeting

1. Click "Create Meeting" on the home page
2. Enter your name
3. You'll be given a Room ID
4. Configure camera/microphone in the lobby
5. Join the meeting

### Joining a Meeting

1. Click "Join Meeting" on the home page
2. Enter the Room ID provided by the organizer
3. Enter your name
4. Configure camera/microphone
5. Join the meeting

### Meeting Controls

- 🎙️ **Microphone** - Mute/unmute
- 📹 **Camera** - Turn on/off
- 🖥️ **Screen Share** - Share your screen
- 💬 **Chat** - Open chat panel
- ☎️ **Leave** - Exit the meeting

## Project Structure

```
geams/
├── frontend/                 # Next.js frontend
│   ├── app/                 # Pages and layouts
│   ├── components/          # React components
│   │   ├── MeetingRoom.tsx  # Core P2P WebRTC logic
│   │   ├── VideoGrid.tsx    # Video layout + screen share UI
│   │   ├── MeetingControls.tsx
│   │   └── ChatPanel.tsx
│   ├── services/            # API services
│   └── package.json
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── app.module.ts   # Main module
│   │   ├── main.ts         # Entry point
│   │   ├── database/       # Database entities
│   │   ├── rooms/          # Room management
│   │   ├── websocket/      # Socket.IO signaling gateway
│   │   └── health/         # Health checks
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Rooms

- `POST /api/rooms/create` - Create a new meeting room
- `GET /api/rooms/:roomId` - Get room info and participants
- `POST /api/rooms/:roomId/join` - Join a room
- `POST /api/rooms/:roomId/leave` - Leave a room

## Socket.IO Events

### Client → Server

- `join-room` - Join a meeting room
- `leave-room` - Leave a room
- `webrtc-offer` - Send WebRTC offer to a peer
- `webrtc-answer` - Send WebRTC answer to a peer
- `webrtc-ice-candidate` - Relay ICE candidate to a peer
- `camera-toggle` - Notify others of camera state
- `mic-toggle` - Notify others of mic state
- `send-message` - Send chat message
- `screen-share-start` - Notify screen sharing started
- `screen-share-stop` - Notify screen sharing stopped

### Server → Client

- `join-room-response` - Confirm join, list of existing participants
- `participant-joined` - New participant arrived
- `participant-left` - Participant left
- `webrtc-offer` - Forwarded offer from peer
- `webrtc-answer` - Forwarded answer from peer
- `webrtc-ice-candidate` - Forwarded ICE candidate
- `chat-message` - Incoming chat message
- `camera-toggled` - Peer camera state changed
- `mic-toggled` - Peer mic state changed
- `screen-share-started` - Peer started sharing
- `screen-share-stopped` - Peer stopped sharing

## Configuration

### Environment Variables

```env
# Node Environment
NODE_ENV=development|production

# Backend Server
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
CORS_ORIGIN=*

# Database
DATABASE_URL=sqlite:./data/meetings.db

# Frontend URLs (set to your deployed backend URL in production)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:3000
```

> **For local network (e.g. mobile testing):** set both `NEXT_PUBLIC_*` URLs and `MEDIASOUP_ANNOUNCED_IP` to your machine's local IP (e.g. `192.168.1.6`).

## Performance & Optimization

### P2P Mesh — What to Expect

- **2–4 users:** Excellent quality, minimal CPU and bandwidth
- **5–8 users:** Good quality; each user uploads their stream to N-1 peers
- **9–15 users:** Usable but bandwidth-heavy on upload; recommend limiting video resolution
- **15+ users:** Consider upgrading to an SFU (see below)

### Tips

1. **Limit video resolution** — 720p for small groups, 480p for larger ones
2. **Use headphones** — Reduces echo and improves audio quality
3. **Stable network** — P2P is sensitive to packet loss; a wired connection is ideal
4. **TURN server** — Users behind strict corporate NAT may fail to connect without one. Add a free TURN server (e.g. [Metered.ca](https://www.metered.ca/tools/openrelay/)) to `ICE_SERVERS` in `MeetingRoom.tsx`

### Upgrading to SFU (for 15+ users)

For large meetings, replace the P2P layer with [LiveKit](https://livekit.io):

- Free cloud tier available
- Drop-in NestJS + React SDKs
- Handles 100+ participants per room
- Still fully self-hostable on any server with UDP support

## Production Deployment

### VPS Setup (Ubuntu 22.04)

1. **Install dependencies:**

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx nodejs npm

sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

2. **Clone project:**

```bash
git clone <your-repo-url>
cd geams
```

3. **Setup environment:**

```bash
cp .env.example .env
nano .env  # Edit with your VPS IP
```

4. **Deploy with Docker:**

```bash
docker-compose up -d
```

5. **Configure Nginx (optional):**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/geams
sudo ln -s /etc/nginx/sites-available/geams /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL (Let's Encrypt):**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

## Troubleshooting

### Camera/Microphone Access Denied

- Check browser permissions
- Use HTTPS in production (browsers require secure context)
- Ensure devices aren't in use by other applications

### No Audio/Video

- Check firewall rules (allow ports 40000-40100 for WebRTC)
- Verify ICE candidates are working
- Check browser console for errors

### High CPU Usage

- Reduce number of concurrent meetings
- Lower video resolution
- Pause unused consumers
- Scale horizontally with multiple workers

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced authentication system
- [ ] Cloud storage integration
- [ ] Whiteboard feature
- [ ] Noise suppression
- [ ] Background blur
- [ ] Webinar mode (1-to-many)
- [ ] Breakout rooms
- [ ] AI meeting transcription
- [ ] Meeting analytics
- [ ] Kubernetes deployment
- [ ] PostgreSQL support for scaling
- [ ] Redis pub/sub for multi-server

## Security Considerations

1. **Use HTTPS/WSS** - Always use secure connections in production
2. **Firewall** - Restrict access to necessary ports only
3. **Authentication** - Implement user authentication (currently basic)
4. **Rate Limiting** - Add rate limiting to API endpoints
5. **Input Validation** - Validate all user inputs
6. **Environment Variables** - Never commit `.env` files
7. **Regular Updates** - Keep dependencies updated

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check documentation in `/docs`
- Review design document

## Acknowledgments

- Mediasoup project for the excellent SFU
- NestJS and Next.js communities
- Open-source community for amazing tools

---

**GEAMS** - Your data, your infrastructure, your control.
