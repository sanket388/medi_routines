#!/bin/bash

set -e

VM_USER=$VM_USER
VM_IP=$VM_IP

echo "🚀 Deploying to $VM_IP..."

ssh $VM_USER@$VM_IP << 'EOF'
  set -e
  cd ~/medi_routines
  echo "📦 Pulling latest code..."
  git pull origin main
  echo "🐳 Rebuilding and restarting containers..."
  docker compose -f compose.prod.yml -p prod up -d --build
  echo "🧹 Cleaning up unused images..."
  docker image prune -f
EOF

echo "✅ Deploy complete!"