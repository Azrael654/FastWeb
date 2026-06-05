# 🚀 VPS Deployment Guide — Fast Print

## Overview
| | |
|---|---|
| **App Type** | Astro SSR (Node.js standalone server) |
| **Database** | PostgreSQL |
| **Node Requirement** | ≥ 22.12.0 |

> [!IMPORTANT]
> Make sure your VPS has at least **1 GB RAM** and runs **Ubuntu 22.04 / 24.04** (or any Debian-based distro). These steps assume you have SSH access as a non-root sudo user.

---

## Step 1: Provision Your VPS

On **Hostinger, DigitalOcean, Vultr**, etc., create a server with:
- Ubuntu 22.04 LTS
- At least 1 vCPU / 1 GB RAM (2 GB recommended)
- A public IP address

SSH into your VPS:
```bash
ssh your_user@your_vps_ip
```

---

## Step 2: Install Dependencies on the VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v  # Should show v22.x.x

# Install pnpm (optional, or use npm)
npm install -g pnpm

# Install PM2 (process manager to keep the app alive)
npm install -g pm2

# Install Git
sudo apt install -y git
```

---

## Step 3: Install & Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE "FastWeb";
CREATE USER fastprint WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE "FastWeb" TO fastprint;
\q
EOF
```

---

## Step 4: Clone Your GitHub Repo

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git app
cd app
```

---

## Step 5: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in the `.env` file:
```env
DATABASE_URL="postgresql://fastprint:STRONG_PASSWORD_HERE@localhost:5432/FastWeb?schema=public"
JWT_SECRET="a_very_long_random_secret_key_change_this"
UPLOAD_DIR="./public/uploads"
```

> [!TIP]
> Generate a strong JWT_SECRET with: `openssl rand -hex 64`

Save and exit: `Ctrl+X` → `Y` → `Enter`

---

## Step 6: Install, Build & Migrate

```bash
# Install dependencies
npm install

# Run database migrations (creates all tables)
npx prisma db push

# (Optional) Seed the database with initial data
npm run db:seed

# Build the production app
npm run build
```

After a successful build, Astro generates a `dist/` folder with a `dist/server/entry.mjs` Node.js server file.

---

## Step 7: Create Upload Directory

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

---

## Step 8: Run with PM2

```bash
# Start the app on port 3000
PORT=3000 HOST=0.0.0.0 pm2 start dist/server/entry.mjs --name fastprint

# Save PM2 state so it auto-starts on reboot
pm2 save
pm2 startup  # Run the command it outputs
```

Verify it's running:
```bash
pm2 status
pm2 logs fastprint
```

Test locally on the VPS:
```bash
curl http://localhost:3000
```

---

## Step 9: Install Nginx as Reverse Proxy

```bash
sudo apt install -y nginx

# Create site config
sudo nano /etc/nginx/sites-available/fastprint
```

Paste this config (replace `yourdomain.com` with your actual domain or IP):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files directly (faster)
    location /uploads/ {
        alias /home/your_user/app/public/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fastprint /etc/nginx/sites-enabled/
sudo nginx -t        # Test config
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 10: Enable HTTPS with Let's Encrypt (Free SSL)

> [!IMPORTANT]
> This step requires a **real domain name** pointed to your VPS IP via an A record. Skip if using just an IP.

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew is set up automatically, verify with:
sudo systemctl status certbot.timer
```

---

## Step 11: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Updating the App (Deploying New Code)

When you push new code to GitHub, SSH into the VPS and run:

```bash
cd ~/app
git pull origin main
npm install           # In case new packages were added
npx prisma db push   # In case schema changed
npm run build
pm2 restart fastprint
```

---

## Useful PM2 Commands

| Command | Description |
|---|---|
| `pm2 status` | Show all running processes |
| `pm2 logs fastprint` | View live app logs |
| `pm2 restart fastprint` | Restart the app |
| `pm2 stop fastprint` | Stop the app |
| `pm2 monit` | Live resource monitor |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App won't start | Run `pm2 logs fastprint` to check for errors |
| Database connection error | Double-check `.env` DATABASE_URL credentials |
| 502 Bad Gateway | The Node app crashed; check `pm2 status` and logs |
| Uploads not saving | Verify `UPLOAD_DIR=./public/uploads` and directory permissions |
| Port 3000 already in use | Change `PORT=3001` in the PM2 start command and update Nginx config |
