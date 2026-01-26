#!/usr/bin/env zsh
# Simple helper to build the image and run the container when MongoDB is hosted externally.

# Usage: ./run-docker.sh [image-name]
# Example: ./run-docker.sh                    # uses default: iamcyberster/lms-be
# Example: ./run-docker.sh iamcyberster/lms-be
#
# Environment variables:
#   PUSH_IMAGE=true          - Push the built image to registry (default: false)
#   PUSH_MULTI_ARCH=true     - Build and push multi-arch image (ARM + AMD) (default: false)
#
# Examples:
#   PUSH_IMAGE=true ./run-docker.sh           # Build and push single-arch image
#   PUSH_MULTI_ARCH=true ./run-docker.sh      # Build and push multi-arch image
# EC2 deployment command (pull new image and restart):
#   docker rm -f lead-app; docker pull iamcyberster/lms-be:latest && docker run -d --name lead-app -p 3000:3000 --env-file .env iamcyberster/lms-be:latest
#
# Quick restart (no pull):
#   docker rm -f lead-app && docker run -d --name lead-app -p 3000:3000 --env-file .env iamcyberster/lms-be:latest
set -euo pipefail

IMAGE_NAME=${1:-iamcyberster/lms-be}
DATE_TAG=$(date +%Y-%m-%d)
IMAGE_TAG="${IMAGE_NAME}:${DATE_TAG}"
LATEST_TAG="${IMAGE_NAME}:latest"
CONTAINER_NAME=lead-app

ENV_FILE=.env

# Load build-time env vars (MONGODB_URI, PORT) from .env if present
if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${ENV_FILE}" | xargs -0 2>/dev/null || grep -v '^#' "${ENV_FILE}" | xargs) || true
fi

# Check if we should push the image
PUSH_IMAGE=${PUSH_IMAGE:-false}
PUSH_MULTI_ARCH=${PUSH_MULTI_ARCH:-false}

# Optionally build and push a multi-arch image (ARM + AMD) when PUSH_MULTI_ARCH=true
if [[ "${PUSH_MULTI_ARCH}" == "true" ]]; then
  echo "Building and pushing multi-arch image for ${IMAGE_TAG} (platforms: linux/amd64,linux/arm64)..."
  echo "Note: Multi-arch builds can take 10-20 minutes depending on network speed."
  echo "First build after cache clear will be slower - subsequent builds will use cache."
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg MONGODB_URI="${MONGODB_URI:-}" \
    --build-arg PORT="${PORT:-3000}" \
    --cache-from type=registry,ref=${IMAGE_NAME}:buildcache \
    --cache-to type=registry,ref=${IMAGE_NAME}:buildcache,mode=max \
    -t "${IMAGE_TAG}" \
    -t "${LATEST_TAG}" \
    --push \
    .
  echo "✅ Multi-arch images pushed successfully!"
else
  echo "Building local image ${IMAGE_TAG} (also tagging ${LATEST_TAG})..."
  docker build \
    --build-arg MONGODB_URI="${MONGODB_URI:-}" \
    --build-arg PORT="${PORT:-3000}" \
    -t "${IMAGE_TAG}" \
    -t "${LATEST_TAG}" \
    .
  
  # Push image if PUSH_IMAGE is set to true
  if [[ "${PUSH_IMAGE}" == "true" ]]; then
    echo "Pushing image ${IMAGE_TAG}..."
    docker push "${IMAGE_TAG}"
    echo "Pushing image ${LATEST_TAG}..."
    docker push "${LATEST_TAG}"
    echo "✅ Images pushed successfully!"
  fi
fi

# If a container with the same name exists, stop and remove it first
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing existing container ${CONTAINER_NAME}..."
  docker rm -f ${CONTAINER_NAME} || true
fi

RUN_OPTS=(
  --name ${CONTAINER_NAME}
  -p 3000:3000
)

# If .env exists, pass it to docker so runtime env vars are loaded (including MONGODB_URI)
if [ -f "${ENV_FILE}" ]; then
  RUN_OPTS+=(--env-file ${ENV_FILE})
  echo "Using ${ENV_FILE} for environment variables. Ensure MONGODB_URI points to your hosted MongoDB."
else
  echo "No ${ENV_FILE} file found. Make sure to pass required env vars (MONGODB_URI, PORT) when running the container." 
fi

echo "Starting container ${CONTAINER_NAME} using image tag ${IMAGE_TAG}..."
docker run -d "${RUN_OPTS[@]}" "${IMAGE_TAG}"

echo "Container started. Tail logs with: docker logs -f ${CONTAINER_NAME}"
