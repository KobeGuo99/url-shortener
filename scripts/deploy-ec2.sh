#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <ssh-key-path> <ec2-public-dns>"
  exit 1
fi

KEY_PATH="$1"
EC2_HOST="$2"
REMOTE_DIR="/home/ec2-user/url-shortener"

rsync -avz \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "frontend/node_modules" \
  --exclude "backend/node_modules" \
  --exclude "frontend/dist" \
  -e "ssh -i ${KEY_PATH}" \
  ./ "ec2-user@${EC2_HOST}:${REMOTE_DIR}"

ssh -i "${KEY_PATH}" "ec2-user@${EC2_HOST}" <<'EOF'
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
EOF
