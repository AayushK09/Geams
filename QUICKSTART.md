# Quick Start Guide

Get GEAMS running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm or yarn
- 4GB RAM minimum

## Option 1: Local Development (Recommended for Testing)

### Step 1: Clone & Install

```bash
cd geams
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### Step 3: Start Development Servers

```bash
npm run dev
```

This starts:

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000

### Step 4: Create Your First Meeting

1. Open http://localhost:3001
2. Click "Create Meeting"
3. Enter your name
4. Share the Room ID with others
5. Others can join with "Join Meeting"

**Done!** 🎉

---

## Option 2: Docker (Production-Ready)

### Prerequisites

- Docker ([Install](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

### Step 1: Clone & Configure

```bash
cd geams
cp .env.example .env
```

### Step 2: Build & Run

```bash
npm run docker:build
npm run docker:up
```

### Step 3: Access Application

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000

### Step 4: View Logs

```bash
npm run docker:logs
```

### To Stop

```bash
npm run docker:down
```

---

## Option 3: Production VPS Deployment

### Quick Setup (Ubuntu 22.04)

```bash
# SSH into VPS
ssh root@your_vps_ip

# Run setup script
cd /opt
git clone <your-repo>
cd geams
chmod +x start-production.sh
./start-production.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## Common Operations

### View Logs

**Local Development:**

```bash
# Logs appear in terminal where you ran npm run dev
```

**Docker:**

```bash
docker-compose logs -f backend  # Backend logs
docker-compose logs -f frontend # Frontend logs
```

### Restart Services

**Local Development:**

```bash
# Stop: Ctrl+C
# Restart: npm run dev
```

**Docker:**

```bash
docker-compose restart
```

### Access Database

**Local Development:**

```bash
sqlite3 data/meetings.db
sqlite> .tables
sqlite> SELECT * FROM rooms;
```

### Check Health

```bash
curl http://localhost:3000/health
```

Output should be:

```json
{
  "status": "ok",
  "timestamp": "2024-12-20T14:30:00.000Z",
  "uptime": 3600
}
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=3001
```

### npm install fails

```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Docker fails to start

```bash
# Check Docker daemon
docker ps

# Rebuild without cache
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Camera access denied

1. Check browser permissions
2. Use HTTPS (required by browsers)
3. Try incognito window
4. Try different browser

### No video from other participants

1. Check firewall allows WebRTC (ports 40000-40100)
2. Verify network connectivity
3. Check browser console for errors

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help.

---

## Next Steps

### Customize

- Edit styling in `frontend/styles/globals.css`
- Modify backend config in `backend/src/app.module.ts`
- Add authentication in `backend/src/auth/`

### Deploy

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Configure domain and SSL
- Setup monitoring

### Scale

- Add more Mediasoup workers
- Use PostgreSQL instead of SQLite
- Setup load balancer
- Deploy to Kubernetes

---

## File Locations

| What          | Where                            |
| ------------- | -------------------------------- |
| Recordings    | `./recordings/`                  |
| Database      | `./data/meetings.db`             |
| Frontend code | `./frontend/`                    |
| Backend code  | `./backend/src/`                 |
| Configuration | `./.env`                         |
| Docker config | `./docker-compose.yml`           |
| Logs          | Terminal / `docker-compose logs` |

---

## Key Commands

```bash
# Development
npm run dev              # Start dev servers
npm run frontend        # Frontend only
npm run backend         # Backend only

# Building
npm run build           # Build for production
npm run format          # Format code
npm run lint            # Check code quality

# Docker
npm run docker:build    # Build Docker images
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs

# Database
npm run typeorm:sync    # Sync database schema
npm run typeorm:migrate # Run migrations
```

---

## API Endpoints

### Rooms

- `POST /api/rooms/create` - Create meeting
- `GET /api/rooms/:roomId` - Get room info
- `POST /api/rooms/:roomId/join` - Join room
- `POST /api/rooms/:roomId/leave` - Leave room

### Recordings

- `GET /api/recordings` - List recordings
- `POST /api/recordings/:roomId/start` - Start recording
- `POST /api/recordings/:roomId/stop` - Stop recording
- `DELETE /api/recordings/:recordingId` - Delete recording

### Health

- `GET /health` - Server health check

See [API.md](./API.md) for full documentation.

---

## Features

✅ Multi-user video conferencing  
✅ Audio/video controls  
✅ Screen sharing  
✅ Real-time chat  
✅ Meeting recording  
✅ Fully self-hosted  
✅ No third-party services

---

## Performance Tips

- **5-10 users** - Works great on single laptop
- **10-50 users** - Needs VPS with good specs
- **50+ users** - Scale horizontally with multiple servers

Monitor resource usage:

```bash
docker stats
```

---

## Getting Help

- 📖 Check [README.md](./README.md)
- 🔧 See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 📚 Read [API.md](./API.md)
- 🚀 Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
- 💬 Open GitHub issue

---

## Security Notes

- Use HTTPS in production (automatic with Let's Encrypt)
- Change default ports if exposed
- Enable firewall
- Keep packages updated
- Don't commit `.env` files
- Use strong CORS settings

---

## What's Next?

1. **Create a meeting** - Test the platform
2. **Record a meeting** - Check recordings directory
3. **Customize** - Modify styling and features
4. **Deploy** - Follow DEPLOYMENT.md
5. **Share** - Invite others to use

---

Happy conferencing! 🎉

For issues, see TROUBLESHOOTING.md or open a GitHub issue.
