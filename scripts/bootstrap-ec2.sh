#!/usr/bin/env bash
set -euo pipefail

sudo dnf update -y
sudo dnf install -y docker git rsync
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

COMPOSE_ARCH="$(uname -m)"
if [ "${COMPOSE_ARCH}" = "x86_64" ]; then
  COMPOSE_ARCH="x86_64"
elif [ "${COMPOSE_ARCH}" = "aarch64" ]; then
  COMPOSE_ARCH="aarch64"
else
  echo "Unsupported architecture for Docker Compose: ${COMPOSE_ARCH}"
  exit 1
fi

COMPOSE_VERSION="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | head -n 1 | cut -d '"' -f 4)"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${COMPOSE_ARCH}" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2

mkdir -p /home/ec2-user/url-shortener
chown -R ec2-user:ec2-user /home/ec2-user/url-shortener

docker compose version

echo "EC2 bootstrap complete. Re-login to pick up the docker group membership."
