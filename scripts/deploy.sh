#!/bin/bash
# Run this from your LOCAL machine to push updates to EC2
# Usage: bash scripts/deploy.sh

set -e

EC2_USER="ec2-user"
EC2_HOST="52.66.119.104"
KEY_FILE="~/.ssh/ysho-key.pem"  # path to your .pem key
APP_DIR="/home/ec2-user/ysho"

echo "==> Building frontend..."
npm run build

echo "==> Syncing files to EC2..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'server/.env' \
  -e "ssh -i $KEY_FILE" \
  ./ "$EC2_USER@$EC2_HOST:$APP_DIR/"

echo "==> Installing server deps & restarting..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" "
  cd $APP_DIR/server && npm ci --omit=dev
  pm2 restart ysho-server
  echo 'Done!'
"

echo "==> Deploy complete. Site is live."
