#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup at $BACKUP_DIR..."

# 备份数据
cp -r data/copaw-dev "$BACKUP_DIR/" 2>/dev/null || true
cp -r data/copaw-test "$BACKUP_DIR/" 2>/dev/null || true
cp -r data/selgen-data "$BACKUP_DIR/" 2>/dev/null || true

# 备份配置
cp -r shared/config "$BACKUP_DIR/" 2>/dev/null || true

# 备份 WebChat Channel
cp CoPaw/src/copaw/app/channels/webchat.py "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup completed: $BACKUP_DIR"
echo "📦 Contents:"
ls -la "$BACKUP_DIR/"
