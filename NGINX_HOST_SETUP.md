# Nginx Reverse Proxy Setup Guide - Ubuntu Host

## 🎯 Tujuan

Setup Nginx di Ubuntu host untuk:

1. ✅ Reverse proxy ke Docker containers
2. ✅ Hide internal ports (security)
3. ✅ SSL/TLS support
4. ✅ Rate limiting & protection
5. ✅ Load balancing ready

---

## 🔒 Security Issue Sekarang

### ❌ Ports Yang TIDAK BOLEH Public:

```
5432 - PostgreSQL  (DATABASE EXPOSED! BAHAYA!)
6379 - Redis       (CACHE EXPOSED! BAHAYA!)
9090 - Prometheus  (Internal monitoring only)
```

### ✅ Ports Yang Boleh (Via Reverse Proxy):

```
8080 - Backend API
5173 - Client (dev) / 3000 (prod)
8000 - Centrifugo WebSocket
9000 - MinIO (optional)
3001 - Grafana (protected with auth)
```

---

## 📋 Step-by-Step Setup

### Step 1: Update docker-compose.yml

**PENTING:** Bind ports hanya ke localhost!

```yaml
# File: docker-compose.yml

services:
  postgres:
    ports:
      - "127.0.0.1:5432:5432" # Only localhost! ✅
      # NOT: - "5432:5432" ❌

  redis:
    ports:
      - "127.0.0.1:6379:6379" # Only localhost! ✅

  backend:
    ports:
      - "127.0.0.1:8080:8080" # Only localhost! ✅

  Client:
    ports:
      - "127.0.0.1:5173:5173" # Only localhost! ✅

  centrifugo:
    ports:
      - "127.0.0.1:8000:8000" # Only localhost! ✅

  minio:
    ports:
      - "127.0.0.1:9000:9000" # Only localhost! ✅
      - "127.0.0.1:9001:9001" # Only localhost! ✅

  grafana:
    ports:
      - "127.0.0.1:3001:3000" # Only localhost! ✅

  prometheus:
    ports:
      - "127.0.0.1:9090:9090" # Only localhost! ✅
```

### Step 2: Install Nginx di Ubuntu Host

```bash
# Login ke server
ssh root@164.92.78.16

# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx apache2-utils

# Check Nginx status
sudo systemctl status nginx
```

### Step 3: Create Nginx Configuration

```bash
# Backup original config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create new site config
sudo nano /etc/nginx/sites-available/socialforge
```

Paste configuration ini:

```nginx
# Client Application
server {
    listen 80;
    server_name 164.92.78.16;

    # Client
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
    }

    # Centrifugo WebSocket
    location /centrifugo {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # Grafana (Protected)
    location /monitoring {
        auth_basic "Monitoring Access";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # MinIO Storage
    location /storage {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8080/health;
        access_log off;
    }
}
```

### Step 4: Create Basic Auth for Protected Routes

```bash
# Create password for Grafana/MinIO access
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Enter password when prompted (e.g., admin123)
```

### Step 5: Enable Site & Restart Nginx

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable socialforge site
sudo ln -s /etc/nginx/sites-available/socialforge /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If OK, restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6: Update Docker Compose Ports

```bash
# Edit docker-compose.yml
cd /var/www/socialforge  # atau path project kamu
nano docker-compose.yml

# Change all ports to localhost binding:
# Before: "8080:8080"
# After:  "127.0.0.1:8080:8080"

# Restart containers
docker-compose down
docker-compose up -d
```

### Step 7: Configure Firewall (UFW)

```bash
# Install UFW if not exists
sudo apt-get install -y ufw

# Allow SSH (IMPORTANT! Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status

# Output should be:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

## 🎯 Access URLs (After Setup)

| Service       | URL                            | Protected?           |
| ------------- | ------------------------------ | -------------------- |
| Client        | http://164.92.78.16/           | ❌ Public            |
| Backend API   | http://164.92.78.16/api        | ❌ Public            |
| WebSocket     | ws://164.92.78.16/centrifugo   | ❌ Public            |
| Health Check  | http://164.92.78.16/health     | ❌ Public            |
| Grafana       | http://164.92.78.16/monitoring | ✅ Basic Auth        |
| MinIO Storage | http://164.92.78.16/storage    | ❌ Public (optional) |

**Protected Services Credentials:**

- Username: `admin`
- Password: `admin123` (CHANGE THIS!)

---

## ✅ Verification Checklist

```bash
# 1. Check Nginx status
sudo systemctl status nginx

# 2. Test Client access
curl -I http://164.92.78.16/

# 3. Test backend API
curl -I http://164.92.78.16/api/health

# 4. Check ports (should NOT be accessible from outside)
# From another machine:
nc -zv 164.92.78.16 5432  # Should FAIL ✅
nc -zv 164.92.78.16 6379  # Should FAIL ✅
nc -zv 164.92.78.16 80    # Should SUCCESS ✅

# 5. View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 6. Check Docker containers (should bind to 127.0.0.1 only)
docker ps
# Look for: 127.0.0.1:8080->8080/tcp ✅
# NOT:      0.0.0.0:8080->8080/tcp ❌
```

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

```bash
# Change Grafana/MinIO basic auth
sudo htpasswd -c /etc/nginx/.htpasswd newusername

# Change database passwords in .env
nano .env
# Update DB_PASSWORD, REDIS_PASSWORD, etc.
```

### 2. Setup SSL/TLS (Recommended!)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (if you have domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 3. Rate Limiting (Already configured)

```nginx
# Add to server block if needed:
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### 4. IP Whitelisting for Admin Pages

```nginx
# In Grafana location block:
location /monitoring {
    allow 203.0.113.0/24;  # Your office IP
    deny all;

    auth_basic "Monitoring";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://127.0.0.1:3001;
}
```

---

## 🚨 Troubleshooting

### Issue 1: "502 Bad Gateway"

```bash
# Check if backend is running
docker ps | grep backend

# Check backend logs
docker logs socialforge-backend

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://127.0.0.1:8080/health
```

### Issue 2: "Connection Refused"

```bash
# Check if port is bound to localhost
docker ps
# Should show: 127.0.0.1:8080->8080/tcp

# Check Nginx is running
sudo systemctl status nginx

# Test connection
telnet 127.0.0.1 8080
```

### Issue 3: WebSocket Connection Failed

```bash
# Check Centrifugo logs
docker logs socialforge-centrifugo

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://127.0.0.1:8000/connection/websocket
```

### Issue 4: Can't Access Database from Outside

**This is GOOD! It means security is working! ✅**

If you need to access PostgreSQL from your local machine for development:

```bash
# Option 1: SSH Tunnel
ssh -L 5433:127.0.0.1:5432 root@164.92.78.16
# Then connect to localhost:5433

# Option 2: Temporarily open port (NOT RECOMMENDED)
# Only for development, close immediately after!
```

---

## 📊 Monitoring

### Check Nginx Stats

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Nginx process status
ps aux | grep nginx

# Connection count
netstat -an | grep :80 | wc -l
```

### Performance Tuning

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 4096;
keepalive_timeout 65;
client_max_body_size 100M;
```

---

## 📝 Quick Commands Reference

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Test Nginx config
sudo nginx -t

# View Nginx status
sudo systemctl status nginx

# Restart Docker containers
docker-compose restart

# View all container ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check firewall status
sudo ufw status verbose
```

---

## ✅ Final Checklist

Before going to production:

- [ ] All ports bound to 127.0.0.1 only
- [ ] Nginx reverse proxy configured
- [ ] Firewall (UFW) enabled
- [ ] Default passwords changed
- [ ] SSL certificate installed (optional but recommended)
- [ ] Rate limiting configured
- [ ] Monitoring access protected
- [ ] Database NOT accessible from outside
- [ ] Redis NOT accessible from outside
- [ ] Health checks working
- [ ] Logs configured and rotating

---

**Server:** 164.92.78.16  
**Last Updated:** Today  
**Status:** Ready for production! 🚀
