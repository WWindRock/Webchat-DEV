#!/bin/bash

set -e

echo "🚀 Starting WebChat Development Environment..."
echo "================================================"

# 检查目录
if [ ! -d "data/copaw-dev" ]; then
    echo "📁 Creating development data directories..."
    mkdir -p data/copaw-dev/{config,custom_channels,sessions,webchat-users}
fi

if [ ! -d "data/selgen-data" ]; then
    mkdir -p data/selgen-data
fi

# 复制 Channel 配置（如果不存在）
if [ ! -f "data/copaw-dev/config/channels.yaml" ]; then
    echo "📝 Copying default channel configuration..."
    cp shared/config/channels-dev.yaml data/copaw-dev/config/channels.yaml
fi

# 复制 WebChat Channel（如果不存在）
if [ ! -f "data/copaw-dev/custom_channels/webchat.py" ]; then
    echo "📦 Copying WebChat Channel..."
    cp CoPaw/src/copaw/app/channels/webchat.py data/copaw-dev/custom_channels/
fi

echo ""
echo "🔧 Starting services with Docker Compose..."
docker compose -f docker-compose.yml up -d copaw-dev selgen-dev

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Development environment started!"
echo ""
echo "📱 Access Points:"
echo "  • CoPaw 后端 API:   http://localhost:7088"
echo "  • CoPaw WebSocket:   ws://localhost:7080/ws"
echo "  • CoPaw HTTP API:   http://localhost:7081"
echo "  • Selgen 前端:    http://localhost:7000"
echo ""
echo "📊 View logs:"
echo "  • All:         docker compose logs -f"
echo "  • CoPaw:       docker compose logs -f copaw-dev"
echo "  • Selgen:      docker compose logs -f selgen-dev"
echo ""
echo "🛑 Stop: docker compose down"
