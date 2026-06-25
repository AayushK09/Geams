# GEAMS Troubleshooting Guide

## Common Issues and Solutions

### 1. Installation & Setup

#### Problem: `npm install` fails with permission errors

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Or use sudo (not recommended)
sudo npm install --unsafe-perm
```

#### Problem: Node version mismatch

**Solution:**

```bash
# Check installed version
node --version

# Install correct version using nvm
nvm install 18
nvm use 18

# Or update Node.js manually from nodejs.org
```

#### Problem: Port already in use

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=3001
```

---

### 2. Frontend Issues

#### Problem: Components not rendering

**Solution:**

1. Check browser console for errors
2. Verify API URL in .env
3. Clear Next.js cache:

```bash
rm -rf .next
npm run dev
```

#### Problem: Socket.IO connection fails

**Solution:**

1. Check backend is running
2. Verify Socket.IO URL in .env
3. Check browser console for connection errors
4. Ensure CORS is enabled

#### Problem: Camera/Microphone access denied

**Solution:**

1. Check browser permissions (Settings → Privacy → Camera/Microphone)
2. Use HTTPS (required by browsers)
3. Ensure site is added to allowed sites
4. Try in incognito window

#### Problem: Video not showing

**Solution:**

1. Check browser console for errors
2. Verify browser supports WebRTC
3. Check firewall allows WebRTC ports
4. Try different browser

---

### 3. Backend Issues

#### Problem: Backend won't start

**Solution:**

```bash
# Check for errors
npm run dev

# Check logs
docker-compose logs backend

# Verify database
ls -la data/

# Rebuild
npm run build
npm start
```

#### Problem: Database connection error

**Solution:**

```bash
# Ensure data directory exists
mkdir -p data

# Verify database file
ls -la data/meetings.db

# Reset database (backup first!)
cp data/meetings.db data/meetings.db.backup
rm data/meetings.db

# Restart backend
npm run dev
```

#### Problem: Mediasoup worker failed

**Solution:**

1. Check system resources (CPU, RAM)
2. Verify WebRTC port range available
3. Check mediasoup configuration
4. View detailed logs:

```bash
MEDIASOUP_WORKER_LOG_LEVEL=debug npm run dev
```

---

### 4. Docker Issues

#### Problem: Docker won't start services

**Solution:**

```bash
# Check Docker daemon
docker ps

# If not running, start Docker Desktop

# Check compose file
docker-compose config

# Rebuild
docker-compose down -v
docker-compose build
docker-compose up
```

#### Problem: Port conflict in Docker

**Solution:**

```bash
# Change ports in docker-compose.yml
# Or stop other services using the port

docker-compose down
# Edit ports in docker-compose.yml
docker-compose up -d
```

#### Problem: Out of disk space

**Solution:**

```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a

# Remove recordings if needed
rm -rf recordings/*
```

#### Problem: Container keeps restarting

**Solution:**

```bash
# Check logs
docker-compose logs backend

# Check resources
docker stats

# Try rebuilding
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

### 5. Meeting Issues

#### Problem: No audio/video from other participants

**Solution:**

1. Check camera/mic settings for all participants
2. Verify network connectivity
3. Check firewall rules
4. Try connecting to different room
5. Restart browser

#### Problem: Lag or stuttering video

**Solution:**

1. Check network speed (should be >10 Mbps upload/download)
2. Close unnecessary applications
3. Reduce video quality (lower resolution)
4. Move closer to router
5. Use wired connection instead of WiFi

#### Problem: Participants can't see each other

**Solution:**

1. Check everyone has camera enabled
2. Verify video codecs supported
3. Check firewall/NAT
4. View browser console for errors
5. Try different room

---

### 6. Performance Issues

#### Problem: High CPU usage

**Solution:**

1. Reduce number of concurrent meetings
2. Lower video resolution
3. Disable unused consumers
4. Increase Mediasoup workers
5. Monitor with:

```bash
docker stats
top
```

#### Problem: Memory leak

**Solution:**

1. Check for unclosed connections
2. Monitor memory over time:

```bash
watch -n 1 free -h
```

3. Restart services if persistent:

```bash
docker-compose restart
```

4. Review logs for errors

#### Problem: Slow database queries

**Solution:**

1. Check database size:

```bash
ls -lh data/meetings.db
```

2. Clean old data:

```bash
sqlite3 data/meetings.db "DELETE FROM recordings WHERE createdAt < date('now', '-30 days');"
```

3. Optimize indexes (if using PostgreSQL)

---

### 7. Network Issues

#### Problem: Connection timeout

**Solution:**

1. Check network connectivity:

```bash
ping google.com
```

2. Check ports are accessible:

```bash
telnet localhost 3000
telnet localhost 3001
```

3. Check firewall rules:

```bash
sudo ufw status
```

4. Verify backend is running:

```bash
curl http://localhost:3000/health
```

#### Problem: NAT traversal issues

**Solution:**

1. Use STUN server (add to Mediasoup config):

```javascript
{
  listenIps: [{ ip: '0.0.0.0', announcedIp: 'your.public.ip' }];
}
```

2. Configure TURN server for relay (advanced)
3. Add port forwarding in router if needed

#### Problem: WebRTC port range blocked

**Solution:**

1. Add firewall exception:

```bash
# macOS
sudo pfctl -f /etc/pf.conf

# Windows
netsh advfirewall firewall add rule name="WebRTC" dir=in action=allow protocol=udp localport=40000-40100

# Linux
sudo ufw allow 40000:40100/udp
```

2. Update Mediasoup port range in config

---

### 8. Deployment Issues

#### Problem: SSL certificate issues

**Solution:**

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/domain.com/cert.pem -noout -dates

# Renew certificate
certbot renew

# Check auto-renewal
systemctl status certbot.timer
```

#### Problem: Domain not resolving

**Solution:**

1. Check DNS settings
2. Verify domain registration
3. Wait for DNS propagation (up to 48 hours)
4. Test with:

```bash
nslookup yourdomain.com
dig yourdomain.com
```

#### Problem: Backend not accessible from browser

**Solution:**

1. Check backend is running and healthy
2. Verify domain points to correct IP
3. Check security group/firewall rules
4. Verify CORS configuration
5. Check Nginx proxy settings

---

### 9. Log Analysis

#### Where to find logs

**Docker:**

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs --tail=100 -f
```

**Local development:**

```bash
# Terminal where you ran npm run dev
# Or check:
tail -f /path/to/app.log
```

**System:**

```bash
# Check system logs
dmesg
journalctl -xe
```

#### Key log messages to look for

- `Connection refused` - Service not running
- `EADDRINUSE` - Port already in use
- `EACCES` - Permission denied
- `ETIMEDOUT` - Network timeout
- `ENOSPC` - Disk full
- `ENOMEM` - Out of memory

---

### 10. Getting Help

If you still have issues:

1. **Check documentation:**
   - README.md
   - DEPLOYMENT.md
   - Design document

2. **Search issues:**
   - GitHub Issues
   - Stack Overflow

3. **Collect debug info:**

   ```bash
   # System info
   uname -a
   node --version
   npm --version
   docker --version

   # Logs
   docker-compose logs > logs.txt
   npm run dev 2>&1 | tee dev.log
   ```

4. **Open issue with:**
   - Steps to reproduce
   - Error messages and logs
   - System information
   - Environment (.env values without secrets)
   - What you've already tried

---

## Quick Reference

| Issue                | Quick Fix                                        |
| -------------------- | ------------------------------------------------ |
| Port in use          | Kill process or change port                      |
| npm install fails    | Clear cache: `npm cache clean --force`           |
| Backend won't start  | Check database: `ls -la data/`                   |
| Camera access denied | Check browser permissions                        |
| No video from others | Check firewall rules                             |
| Docker issues        | `docker-compose down -v && docker-compose up -d` |
| High CPU             | Reduce participants or lower quality             |
| Memory leak          | Restart services: `docker-compose restart`       |
| Connection timeout   | Check: `curl http://localhost:3000/health`       |

---

For more help, open an issue on GitHub with detailed information!
