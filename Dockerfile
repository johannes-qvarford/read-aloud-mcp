# Use Python 3.11 slim image
FROM python:3.11-slim

# Install system dependencies for espeak-ng, audio, and build tools
RUN apt-get update && apt-get install -y \
    espeak-ng \
    espeak-ng-data \
    libespeak-ng1 \
    alsa-utils \
    pulseaudio \
    build-essential \
    libasound2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python dependencies and README (needed by hatchling)
COPY pyproject.toml uv.lock README.md ./

# Install uv for faster Python package management
RUN pip install uv

# Install Python dependencies
RUN uv sync --no-dev

# Copy source code
COPY src/ ./src/

# Create audio outputs directory
RUN mkdir -p audio_outputs

# Expose port for HTTP server
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV PULSE_RUNTIME_PATH=/tmp/pulse

# Default command runs HTTP server
CMD ["uv", "run", "read-aloud-mcp", "--http", "--port", "8000"]
