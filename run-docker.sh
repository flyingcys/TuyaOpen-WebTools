#!/bin/bash
set -euo pipefail

echo "[INFO] Starting TuyaOpen-WebTools on port 9060..."

SCRIPT_PATH="$(readlink -f "$0")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
if [ "$SCRIPT_DIR" != "$(pwd)" ]; then
  echo "[ERROR] Please run this script from its own directory: $SCRIPT_DIR"
  exit 1
fi

# Check if git is available
if ! command -v git &>/dev/null; then
  echo "[ERROR] git is required but not installed. Aborting."
  exit 1
fi

# Check if we're in a git repository
if git rev-parse --is-inside-work-tree &>/dev/null; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  GIT_STATUS="$(git status --porcelain)"
  if [ "$CURRENT_BRANCH" = "master" ] && [ -z "$GIT_STATUS" ]; then
    echo "[INFO] On master branch with no local changes. Pulling latest updates..."
    git pull --ff-only
  else
    if [ "$CURRENT_BRANCH" != "master" ]; then
      echo "[INFO] Not on master branch (currently on '$CURRENT_BRANCH'). Skipping git pull."
    elif [ -n "$GIT_STATUS" ]; then
      echo "[INFO] Local changes detected. Skipping git pull."
    fi
  fi
else
  echo "[INFO] Not a git repository. Skipping git pull."
fi

# Check for required commands
for cmd in docker; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "[ERROR] $cmd is required but not installed. Aborting."
    exit 1
  fi
done

# Check if we're in the right directory (should contain web-serial directory)
if [ ! -d "web-serial" ]; then
  echo "[ERROR] web-serial directory not found. Please run this script from the TuyaOpen-WebTools root directory."
  exit 1
fi

# Build the Docker image locally using buildx
IMAGE_NAME="tuyaopen-webtools:local"

echo "[INFO] Building Docker image $IMAGE_NAME using buildx..."
docker buildx build --load -t "$IMAGE_NAME" .

# Stop any running container with the same name
CONTAINER_NAME="tuyaopen-webtools"
echo "[INFO] Stopping and removing any running container named $CONTAINER_NAME..."
if docker ps -a --format '{{.Names}}' | grep -wq "$CONTAINER_NAME"; then
  docker stop "$CONTAINER_NAME" &>/dev/null || true
  docker rm "$CONTAINER_NAME" &>/dev/null || true
fi

# Start the service on port 9060
echo "[INFO] Starting TuyaOpen-WebTools service on port 9060 using docker run..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 9060:9060 \
  "$IMAGE_NAME"

echo "[INFO] Done. Access the service at: http://localhost:9060"