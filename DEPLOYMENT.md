# GEAMS Production Deployment Guide

## Prerequisites

- VPS with Ubuntu 20.04 or higher (4-8 CPU cores, 8-16 GB RAM, 100 GB SSD)
- Domain name (optional but recommended)
- SSH access to the VPS

## Step-by-Step Deployment

### 1. SSH into Your VPS

```bash
ssh root@your_vps_ip
```

### 2. Update System Packages

```bash
apt-get update
apt-get upgrade -y
apt-get install -y build-essential git curl wget
```

### 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add current user to docker group
usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### 4. Clone GEAMS Repository

```bash
cd /opt
git clone <your-repository-url>
cd geams
```

### 5. Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit the .env file with your VPS settings:

```env
NODE_ENV=production
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=your_vps_ip
NEXT_PUBLIC_API_URL=http://your_vps_ip:3000
NEXT_PUBLIC_SOCKET_IO_URL=http://your_vps_ip:3000
```

### 7. Deploy with Docker

```bash
# Make scripts executable
chmod +x start-production.sh stop-services.sh

# Start services
./start-production.sh

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 8. Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
apt-get install -y nginx

# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/geams
sudo ln -s /etc/nginx/sites-available/geams /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 9. Setup SSL with Let's Encrypt (Recommended for Production)

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com

# Update Nginx config to use SSL
sudo nano /etc/nginx/sites-available/geams
```

Update nginx.conf with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 10. Setup Firewall

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow WebRTC ports
ufw allow 40000:40100/udp

# Check status
ufw status
```

### 11. Setup Monitoring and Logs

```bash
# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Save logs
docker-compose logs > geams-logs.txt
```

### 12. Setup Automatic Backups

Create a backup script `/opt/geams/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp -r /opt/geams/data $BACKUP_DIR/data_$TIMESTAMP

# Backup recordings
tar -czf $BACKUP_DIR/recordings_$TIMESTAMP.tar.gz /opt/geams/recordings

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
```

Add to crontab:

```bash
crontab -e

# Add line:
0 2 * * * /opt/geams/backup.sh
```

## Monitoring and Maintenance

### Check Service Status

```bash
docker-compose ps
docker-compose exec backend npm run health
```

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart specific service
docker-compose restart backend

# Restart all services
docker-compose restart

# Full rebuild and restart
docker-compose down
docker-compose up -d
```

### Update Application

```bash
cd /opt/geams

# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check port availability
netstat -tlnp | grep 3000

# Check disk space
df -h

# Check memory
free -h
```

### Memory Issues

```bash
# Monitor memory usage
docker stats

# Increase swap (if needed)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Database Issues

```bash
# Connect to database
docker-compose exec backend sqlite3 data/meetings.db

# Backup database before migration
cp data/meetings.db data/meetings.db.backup

# Reset database (BE CAREFUL!)
rm data/meetings.db
docker-compose restart backend
```

## Performance Tuning

### Optimize Docker

```bash
# Increase ulimits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Reboot to apply
reboot
```

### Optimize Kernel

Edit `/etc/sysctl.conf`:

```
net.core.rmem_default = 134217728
net.core.rmem_max = 134217728
net.core.wmem_default = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_max_syn_backlog = 4096
```

Apply changes:

```bash
sysctl -p
```

## Scaling

### Multiple Backend Instances

Use Docker Compose to scale backend workers:

```bash
docker-compose up -d --scale backend=3
```

### Load Balancing with Nginx

Configure Nginx upstream:

```nginx
upstream backend {
    server backend:3000;
    server backend_2:3000;
    server backend_3:3000;
}
```

## Security Hardening

1. **Use Strong Passwords** - For any authentication
2. **Enable 2FA** - If available
3. **Regular Updates** - Keep system and packages updated
4. **Monitor Logs** - Check for suspicious activity
5. **Backup Regularly** - Test backup restoration
6. **Disable Root SSH** - Use sudo instead
7. **Setup Fail2Ban** - Protect against brute force

## Support

For issues or questions:

- Check logs: `docker-compose logs`
- Review README.md
- Open GitHub issue with logs and configuration
