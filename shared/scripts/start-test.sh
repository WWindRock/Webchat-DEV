#!/bin/bash

set -e

echo "🧪 Starting WebChat Testing Environment..."
echo "=========================================="

# 创建测试环境目录
if [ ! -d "data/copaw-test" ]; then
    echo "📁 Creating testing data directories..."
    mkdir -p data/copaw-test/{config,custom_channels,sessions,webchat-users}
fi

# 复制配置
if [ ! -f "data/copaw-test/config/channels.yaml" ]; then
    cp shared/config/channels-test.yaml data/copaw-test/config/channels.yaml
fi

if [ ! -f "data/copaw-test/custom_channels/webchat.py" ]; then
    cp CoPaw/src/copaw/app/channels/webchat.py data/copaw-test/custom_channels/
fi

echo "🔧 Starting test services..."
docker compose -f docker-compose.yml --profile test up -d copaw-test selgen-test

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Testing environment started!"
echo ""
echo "📱 Access Points:"
echo "  • CoPaw 后端 API:   http://localhost:7088"
echo "  • CoPaw WebSocket:   ws://localhost:7080/ws"
echo "  • CoPaw HTTP API:   http://localhost:7081"
echo "  • Selgen 前端:    http://localhost:7001"
echo ""
echo "🛑 Stop: docker compose --profile test down"
