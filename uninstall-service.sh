#!/bin/bash

# Read Aloud MCP Server - Systemd Service Uninstallation Script
# This script removes the MCP server systemd service and installation

set -e

# Configuration
SERVICE_NAME="read-aloud-mcp"
SERVICE_USER="${SUDO_USER:-$USER}"
INSTALL_DIR="/opt/read-aloud-mcp"

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

info "Uninstalling Read Aloud MCP Server systemd service..."

# Stop and disable service if it exists
if sudo systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
    info "Stopping and disabling service..."

    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        sudo systemctl stop "$SERVICE_NAME"
        info "Service stopped"
    fi

    if sudo systemctl is-enabled --quiet "$SERVICE_NAME"; then
        sudo systemctl disable "$SERVICE_NAME"
        info "Service disabled"
    fi
else
    warn "Service $SERVICE_NAME not found in systemd"
fi

# Remove service file
if [[ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]]; then
    info "Removing service file..."
    sudo rm "/etc/systemd/system/${SERVICE_NAME}.service"
else
    warn "Service file not found"
fi

# Reload systemd
info "Reloading systemd..."
sudo systemctl daemon-reload

# Ask about removing installation directory
if [[ -d "$INSTALL_DIR" ]]; then
    echo
    read -p "Remove installation directory $INSTALL_DIR? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Removing installation directory..."
        sudo rm -rf "$INSTALL_DIR"
    else
        info "Keeping installation directory: $INSTALL_DIR"
    fi
else
    warn "Installation directory not found: $INSTALL_DIR"
fi

# Ask about removing service user
if id "$SERVICE_USER" &>/dev/null; then
    # Only ask if it's a system user we created
    if [[ $(id -u "$SERVICE_USER") -lt 1000 ]]; then
        echo
        read -p "Remove service user $SERVICE_USER? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Removing service user..."
            sudo userdel "$SERVICE_USER"
        else
            info "Keeping service user: $SERVICE_USER"
        fi
    fi
fi

info "Uninstallation complete!"
echo
info "You can verify the service is removed with:"
echo "  sudo systemctl status $SERVICE_NAME"
