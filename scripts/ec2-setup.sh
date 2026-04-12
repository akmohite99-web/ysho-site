#!/bin/bash
# Run this ONCE on a fresh Amazon Linux 2023 EC2 instance
# Usage: bash ec2-setup.sh

set -e

echo "==> Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

echo "==> Installing nginx & certbot..."
sudo yum install -y nginx
sudo yum install -y python3-certbot-nginx augeas-libs

echo "==> Installing PM2..."
sudo npm install -g pm2

echo "==> Cloning repo..."
# Replace with your actual GitHub repo URL
REPO_URL="https://github.com/YOUR_USERNAME/ysho-site.git"
git clone "$REPO_URL" /home/ec2-user/ysho
chown -R ec2-user:ec2-user /home/ec2-user/ysho

echo "==> Installing server dependencies..."
cd /home/ec2-user/ysho/server
npm ci --omit=dev

echo "==> Installing frontend dependencies and building..."
cd /home/ec2-user/ysho
npm ci
npm run build

echo "==> Setting up nginx..."
sudo cp /home/ec2-user/ysho/scripts/nginx.conf /etc/nginx/conf.d/ysho.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx

echo ""
echo "==> NEXT STEPS:"
echo "  1. Create /home/ec2-user/ysho/server/.env  (see server/.env.example)"
echo "  2. Run: cd /home/ec2-user/ysho/server && pm2 start src/index.js --name ysho-server"
echo "  3. Run: pm2 startup && pm2 save"
echo "  4. Run: sudo certbot --nginx -d yourdomain.com"
echo "  5. Update nginx.conf with your actual domain, then: sudo nginx -s reload"
