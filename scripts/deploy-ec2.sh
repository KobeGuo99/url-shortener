#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <ssh-key-path> <ec2-public-dns>"
  exit 1
fi

KEY_PATH="$1"
EC2_HOST="$2"
REMOTE_DIR="/home/ec2-user/url-shortener"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -i ${KEY_PATH}"

rsync -avz \
  --exclude ".git" \
  --exclude ".env" \
  --exclude "node_modules" \
  --exclude "frontend/node_modules" \
  --exclude "backend/node_modules" \
  --exclude "frontend/dist" \
  -e "ssh ${SSH_OPTS}" \
  ./ "ec2-user@${EC2_HOST}:${REMOTE_DIR}"

ssh ${SSH_OPTS} "ec2-user@${EC2_HOST}" <<'EOF'
set -euo pipefail
cd /home/ec2-user/url-shortener
npm install
npm --prefix backend install
npm --prefix frontend install
npm run build
docker compose up -d
pm2 delete linklift-backend || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
sudo mkdir -p /etc/systemd/system/pm2-ec2-user.service.d
sudo tee /etc/systemd/system/pm2-ec2-user.service.d/override.conf >/dev/null <<'SYSTEMD'
[Unit]
Wants=network-online.target docker.service
After=network-online.target docker.service
SYSTEMD
sudo systemctl daemon-reload
EOF
