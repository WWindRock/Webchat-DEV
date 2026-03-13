.PHONY: install dev test backup reset-dev reset-test clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start development environment"
	@echo "  make test      - Start test environment"
	@echo "  make backup    - Backup data"
	@echo "  make reset-dev - Reset development environment"
	@echo "  make reset-test- Reset test environment"
	@echo "  make clean     - Clean all containers and data"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Start development environment
dev:
	@echo "Starting development environment..."
	docker compose -f docker-compose.yml up -d copaw-dev selgen-dev

# Start test environment
test:
	@echo "Starting test environment..."
	docker compose -f docker-compose.yml --profile test up -d copaw-test selgen-test

# Backup data
backup:
	@echo "Backing up data..."
	@mkdir -p ./backups
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	tar -czf ./backups/backup_$${timestamp}.tar.gz data/; \
	echo "Backup completed: backup_$${timestamp}.tar.gz"

# Reset development environment
reset-dev:
	@echo "Resetting development environment..."
	docker compose -f docker-compose.yml down copaw-dev selgen-dev
	rm -rf data/copaw-dev/* data/selgen-data/*
	@echo "Development environment reset completed"

# Reset test environment
reset-test:
	@echo "Resetting test environment..."
	docker compose -f docker-compose.yml --profile test down copaw-test selgen-test
	rm -rf data/copaw-test/*
	@echo "Test environment reset completed"

# Clean all containers and data
clean:
	@echo "Cleaning all containers and data..."
	docker compose -f docker-compose.yml down
	docker system prune -f
	@echo "Cleanup completed"
