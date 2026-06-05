#!/bin/bash
# Deploy latest code to ap.allshare.me
set -e
SSH="ssh -i /home/shantanu/mykey.key -o StrictHostKeyChecking=no root@ap.allshare.me"
echo ">>> Pushing to GitHub..."
git push origin main
echo ">>> Deploying to server..."
$SSH "cd /var/www/ap && git pull origin main && npm ci --production=false && npx prisma migrate deploy && npm run build && pm2 restart ap"
echo ">>> Done! Live at https://ap.allshare.me"
