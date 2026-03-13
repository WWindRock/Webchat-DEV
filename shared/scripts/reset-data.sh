#!/bin/bash

echo "🗑️  Resetting development environment..."
docker compose -f docker-compose.yml down copaw-dev selgen-dev
rm -rf data/copaw-dev/* data/selgen-data/*
echo "✅ Development environment reset"

echo ""
echo "🗑️  Resetting testing environment..."
docker compose -f docker-compose.yml --profile test down copaw-test selgen-test
rm -rf data/copaw-test/*
echo "✅ Testing environment reset"
