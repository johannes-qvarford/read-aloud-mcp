#!/bin/bash

# Read Aloud MCP Server - Systemd Service Installation Script
# This script installs the MCP server as a systemd service running in HTTP mode

set -e

# Configuration
SERVICE_NAME="read-aloud-mcp"
SERVICE_USER="${SUDO_USER:-$USER}"
SERVICE_PORT="${MCP_PORT:-8000}"
INSTALL_DIR="/opt/read-aloud-mcp"
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root. Run with sudo instead."
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    error "sudo is required but not installed."
fi

info "Installing Read Aloud MCP Server as systemd service..."
info "Service name: $SERVICE_NAME"
info "Service user: $SERVICE_USER"
info "Service port: $SERVICE_PORT"
info "Install directory: $INSTALL_DIR"

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
    warn "espeak-ng is not installed. Installing now..."
    sudo apt update
    sudo apt install -y espeak-ng espeak-ng-data libespeak-ng1
fi

# Create service user if it doesn't exist
if ! id "$SERVICE_USER" &>/dev/null; then
    info "Creating service user: $SERVICE_USER"
    sudo useradd --system --home-dir "$INSTALL_DIR" --shell /bin/false "$SERVICE_USER"
fi

# Create installation directory
info "Creating installation directory..."
sudo mkdir -p "$INSTALL_DIR"

# Copy project files
info "Copying project files..."
sudo cp -r "$PROJECT_DIR"/* "$INSTALL_DIR/"
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# Install Python dependencies as the service user
info "Installing Python dependencies..."
sudo -u "$SERVICE_USER" bash -c "cd '$INSTALL_DIR' && uv sync --no-dev"

# Create systemd service file
info "Creating systemd service file..."
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<EOF
[Unit]
Description=Read Aloud MCP Server
Documentation=https://github.com/user/read-aloud-mcp
After=network.target
Wants=network.target

[Service]
Type=exec
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$INSTALL_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=$INSTALL_DIR
ExecStart=$INSTALL_DIR/.venv/bin/python -m mcp_tts_server.server --http --port $SERVICE_PORT
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$INSTALL_DIR/audio_outputs
PrivateTmp=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes

[Install]
WantedBy=multi-user.target
EOF

# Create audio outputs directory
info "Creating audio outputs directory..."
sudo mkdir -p "$INSTALL_DIR/audio_outputs"
sudo chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/audio_outputs"

# Reload systemd and enable service
info "Reloading systemd and enabling service..."
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

# Start the service
info "Starting service..."
if sudo systemctl start "$SERVICE_NAME"; then
    info "Service started successfully!"
else
    error "Failed to start service. Check logs with: sudo journalctl -u $SERVICE_NAME -f"
fi

# Wait a moment and check service status
sleep 2
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
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
    warn "Service is not active. Check status with: sudo systemctl status $SERVICE_NAME"
fi

# Show useful commands
echo
info "Useful commands:"
echo "  Start service:    sudo systemctl start $SERVICE_NAME"
echo "  Stop service:     sudo systemctl stop $SERVICE_NAME"
echo "  Restart service:  sudo systemctl restart $SERVICE_NAME"
echo "  View status:      sudo systemctl status $SERVICE_NAME"
echo "  View logs:        sudo journalctl -u $SERVICE_NAME -f"
echo "  Disable service:  sudo systemctl disable $SERVICE_NAME"
echo
info "Server URL: http://localhost:$SERVICE_PORT"
info "Installation complete!"
