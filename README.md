# GEAMS - Self-Hosted WebRTC Meeting Platform

A fully self-hosted Teams-like video meeting platform with WebRTC and Mediasoup. Zero third-party dependency.

## Features

✅ **Multi-user Video Conferencing** - Support for multiple concurrent users in a meeting
✅ **Audio/Video Controls** - Individual mic and camera muting
✅ **Screen Sharing** - Share your screen with participants
✅ **Real-time Chat** - Built-in chat system during meetings
✅ **Fully Self-Hosted** - Complete control over your data and infrastructure
✅ **No Vendor Lock-in** - Zero dependency on cloud services
✅ **SFU Architecture** - Efficient Selective Forwarding Unit for scalability

## Tech Stack

### Frontend

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **mediasoup-client** - WebRTC media handling
- **Zustand** - State management

### Backend

- **NestJS** - Node.js framework
- **Socket.IO** - WebSocket signaling
- **Mediasoup 3** - SFU media server
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
BACKEND_HOST=localhost
DATABASE_URL=sqlite:./data/meetings.db
MEDIASOUP_NUM_WORKERS=1
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
- ⏺️ **Record** - Record the meeting
- 💬 **Chat** - Open chat panel
- ☎️ **Leave** - Exit the meeting

## Project Structure

```
geams/
├── frontend/                 # Next.js frontend
│   ├── app/                 # Pages and layouts
│   ├── components/          # React components
│   ├── services/            # API services
│   ├── store/              # Zustand stores
│   ├── styles/             # CSS and Tailwind
│   └── package.json
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── app.module.ts   # Main module
│   │   ├── main.ts         # Entry point
│   │   ├── database/       # Database entities
│   │   ├── rooms/          # Room management
│   │   ├── mediasoup/      # Mediasoup SFU
│   │   ├── websocket/      # Socket.IO gateway
│   │   └── health/         # Health checks
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables template
├── package.json           # Monorepo root
└── README.md              # This file
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
- `create-transport` - Create WebRTC transport
- `connect-transport` - Connect transport
- `produce` - Start producing media
- `consume` - Start consuming media
- `camera-toggle` - Toggle camera
- `mic-toggle` - Toggle microphone
- `send-message` - Send chat message
- `screen-share-start` - Start screen sharing
- `screen-share-stop` - Stop screen sharing

### Server → Client

- `join-room-response` - Confirm room join
- `participant-joined` - Notify new participant
- `participant-left` - Notify participant left
- `transport-created` - Transport created
- `transport-connected` - Transport connected
- `produce-response` - Producer created
- `consume-response` - Consumer created
- `new-producer` - New producer available
- `chat-message` - Chat message received
- `recording-started` - Recording started
- `recording-stopped` - Recording stopped
- `camera-toggled` - Camera toggled
- `mic-toggled` - Microphone toggled
- `screen-share-started` - Screen share started
- `screen-share-stopped` - Screen share stopped

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

# Mediasoup Workers
MEDIASOUP_NUM_WORKERS=1
MEDIASOUP_WORKER_LOG_LEVEL=warn
MEDIASOUP_LOG_LEVEL=warn
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=localhost

# Recording
RECORDING_DIR=./recordings
FFMPEG_PATH=ffmpeg

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:3000
```

## Performance Optimization

### For Better Performance:

1. **Limit Video Quality** - Start with 720p, adjust based on bandwidth
2. **Pause Unused Consumers** - Pauses video from inactive speakers
3. **Use Simulcast** - Enable for scalability (future)
4. **Monitor CPU** - Watch CPU usage with multiple meetings
5. **Scale Horizontally** - Add more VPS instances with load balancer

## Production Deployment

### VPS Setup (Ubuntu 22.04)

1. **Install dependencies:**

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx ffmpeg nodejs npm

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
