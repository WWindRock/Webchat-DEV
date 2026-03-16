#!/usr/bin/env python3
import sys
import os

# Use Webchat-Dev CoPaw instead of the standalone CoPaw
sys.path.insert(0, '/home/alex/Webchat-Dev/CoPaw/src')

# Set environment variables before importing copaw
os.environ['PYTHONUNBUFFERED'] = '1'
os.environ['COPAW_WORKING_DIR'] = '/home/alex/Webchat-Dev/data/copaw-dev'
os.environ['COPAW_LOG_LEVEL'] = 'info'
os.environ['COPAW_CORS_ORIGINS'] = 'http://107.172.137.173:7000,http://localhost:7000,http://127.0.0.1:7000'
os.environ['COPAW_CONSOLE_STATIC_DIR'] = '/home/alex/CoPaw/src/copaw/console'

from copaw.cli.main import cli

if __name__ == '__main__':
    cli(['app', '--host', '0.0.0.0', '--port', '7088'])
