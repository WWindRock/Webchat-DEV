#!/usr/bin/env python3
import sys
import os

# Use Webchat-Dev CoPaw instead of the standalone CoPaw
sys.path.insert(0, '/home/alex/Webchat-Dev/CoPaw/src')

os.environ['PYTHONUNBUFFERED'] = '1'
os.environ['COPAW_WORKING_DIR'] = '/home/alex/Webchat-Dev/data/copaw-dev'
os.environ['COPAW_LOG_LEVEL'] = 'debug'

from copaw.cli.main import cli

if __name__ == '__main__':
    cli(['app', '--host', '0.0.0.0', '--port', '7088'])
