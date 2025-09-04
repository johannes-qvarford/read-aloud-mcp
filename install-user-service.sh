#!/bin/bash

# Read Aloud MCP Server - User Service Installation Script
# This script installs the MCP server as a user systemd service

set -e

# Configuration
SERVICE_NAME="read-aloud-mcp"
SERVICE_PORT="${MCP_PORT:-8000}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info "Installing Read Aloud MCP Server as user systemd service..."
info "Service name: $SERVICE_NAME"
info "Service port: $SERVICE_PORT"
info "Project directory: $PROJECT_DIR"

# Check prerequisites
info "Checking prerequisites..."

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    error "systemctl not found. This system doesn't appear to use systemd."
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    error "uv is not installed. Please install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# Check if espeak-ng is installed
if ! command -v espeak-ng &> /dev/null; then
    warn "espeak-ng is not installed. You may want to install it:"
    warn "sudo apt update && sudo apt install -y espeak-ng espeak-ng-data libespeak-ng1"
fi

# Create user service directory
info "Creating user service directory..."
mkdir -p ~/.config/systemd/user

# Create user systemd service file
info "Creating user systemd service file..."
cat > ~/.config/systemd/user/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Read Aloud MCP Server (User)
Documentation=https://github.com/user/read-aloud-mcp
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=exec
WorkingDirectory=$PROJECT_DIR
Environment=PATH=/home/jq/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=PULSE_SERVER=unix:/mnt/wslg/PulseServer
Environment=DISPLAY=:0
ExecStart=/home/jq/.local/bin/uv run read-aloud-mcp --http --port $SERVICE_PORT
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=default.target
EOF

# Install Python dependencies
info "Installing Python dependencies..."
cd "$PROJECT_DIR"
uv sync --no-dev

# Reload user systemd and enable service
info "Reloading user systemd and enabling service..."
systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"

# Start the service
info "Starting user service..."
if systemctl --user start "$SERVICE_NAME"; then
    info "Service started successfully!"
else
    error "Failed to start service. Check logs with: journalctl --user -u $SERVICE_NAME -f"
fi

# Wait a moment and check service status
sleep 2
if systemctl --user is-active --quiet "$SERVICE_NAME"; then
    info "✓ Service is running successfully"
    info "✓ Server is available at: http://localhost:$SERVICE_PORT"
    
    # Test the service
    info "Testing service endpoint..."
    if command -v curl &> /dev/null; then
        if curl -s "http://localhost:$SERVICE_PORT" > /dev/null; then
            info "✓ Service is responding to HTTP requests"
        else
            warn "Service is running but not responding to HTTP requests yet"
        fi
    fi
else
    warn "Service is not active. Check status with: systemctl --user status $SERVICE_NAME"
fi

# Show useful commands
echo
info "Useful commands:"
echo "  Start service:    systemctl --user start $SERVICE_NAME"
echo "  Stop service:     systemctl --user stop $SERVICE_NAME"
echo "  Restart service:  systemctl --user restart $SERVICE_NAME"
echo "  View status:      systemctl --user status $SERVICE_NAME"
echo "  View logs:        journalctl --user -u $SERVICE_NAME -f"
echo "  Disable service:  systemctl --user disable $SERVICE_NAME"
echo
info "Server URL: http://localhost:$SERVICE_PORT"
info "Installation complete!"