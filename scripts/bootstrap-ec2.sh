#!/usr/bin/env bash
set -euo pipefail

sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2

mkdir -p /home/ec2-user/url-shortener
chown -R ec2-user:ec2-user /home/ec2-user/url-shortener

echo "EC2 bootstrap complete. Re-login to pick up the docker group membership."
