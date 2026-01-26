# Docker Setup & Deployment Guide

Complete guide for building, running, and deploying the Lead Management System using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Using run-docker.sh Script](#using-run-docker-sh-script)
- [Docker Hub Deployment](#docker-hub-deployment)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Manual Docker Commands](#manual-docker-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Docker installed** (Docker Desktop for Mac/Windows, or Docker Engine for Linux)
2. **Docker Hub account** (for pushing images): [hub.docker.com](https://hub.docker.com)
3. **`.env` file** in project root with required variables:

```env
MONGODB_URI="mongodb+srv://user:password@cluster0.mongodb.net/lead-management?retryWrites=true&w=majority"
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
PORT=3000
```

---

## Local Development

### Quick Start with run-docker.sh

The easiest way to build and run locally:

```bash
# Make script executable (one-time)
chmod +x run-docker.sh

# Build and run (reads .env automatically)
./run-docker.sh
```

This will:
- ✅ Read `MONGODB_URI` and `PORT` from `.env`
- ✅ Build image: `iamcyberster/lms-be:YYYY-MM-DD` (date tag) and `:latest`
- ✅ Stop/remove old `lead-app` container if exists
- ✅ Start new container with `.env` variables
- ✅ Expose app on `http://localhost:3000`

### Using Docker Compose (with local MongoDB)

If you want to run MongoDB locally in Docker:

```bash
docker-compose up --build
```

This will:
- Start MongoDB container on port `27017`
- Build and start the app container
- Automatically read `.env` for build args and runtime envs
- Override `MONGODB_URI` to point to the local `mongo` service

---

## Using run-docker.sh Script

### What the Script Does

The `run-docker.sh` script automates the entire build and run process:

1. **Sets image tags**:
   - Date tag: `iamcyberster/lms-be:YYYY-MM-DD` (e.g., `2026-01-21`)
   - Latest tag: `iamcyberster/lms-be:latest`

2. **Loads environment variables** from `.env` file (if present)

3. **Builds local image** with build args (`MONGODB_URI`, `PORT`)

4. **Optionally builds & pushes multi-arch image** (ARM + AMD) to Docker Hub

5. **Cleans up old container** (`lead-app`) if it exists

6. **Runs new container** with `.env` file and port mapping

### Usage Options

#### 1. Local Build & Run (Default)

```bash
./run-docker.sh
```

Uses default repository: `iamcyberster/lms-be`

#### 2. Custom Repository Name

```bash
./run-docker.sh your-username/your-repo-name
```

#### 3. Build & Push Multi-Arch to Docker Hub

```bash
# Login to Docker Hub first
docker login

# Build, push multi-arch, and run locally
PUSH_MULTI_ARCH=true ./run-docker.sh
```

This creates images for both:
- `linux/amd64` (for EC2/x86 servers)
- `linux/arm64` (for Apple Silicon Macs)

Both tags are pushed:
- `iamcyberster/lms-be:YYYY-MM-DD`
- `iamcyberster/lms-be:latest`

---

## Docker Hub Deployment

### Step-by-Step Workflow

#### 1. Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

#### 2. Build & Push Multi-Arch Image

```bash
PUSH_MULTI_ARCH=true ./run-docker.sh
```

This single command:
- ✅ Builds local image for your machine
- ✅ Builds multi-arch image (ARM + AMD)
- ✅ Pushes both date tag and latest tag to Docker Hub
- ✅ Runs container locally (optional, you can stop it)

#### 3. Verify Push

Check your Docker Hub repository:
- Visit: `https://hub.docker.com/r/iamcyberster/lms-be/tags`
- You should see tags like `2026-01-21` and `latest`

#### 4. Pull on Any Machine

```bash
# Pull specific date version
docker pull iamcyberster/lms-be:2026-01-21

# Or pull latest
docker pull iamcyberster/lms-be:latest
```

---

## AWS EC2 Deployment

### Initial Setup on EC2

#### 1. SSH into EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

#### 2. Install Docker (if not installed)

```bash
# Amazon Linux 2
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
# Log out and back in for group changes to take effect

# Ubuntu
sudo apt-get update
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

#### 3. Create Project Directory

```bash
mkdir -p /opt/lead-management
cd /opt/lead-management
```

#### 4. Create `.env` File

```bash
nano .env
```

Add your production environment variables:

```env
MONGODB_URI="mongodb+srv://user:password@cluster0.mongodb.net/lead-management?retryWrites=true&w=majority"
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

#### 5. Login to Docker Hub

```bash
docker login
```

### Deploying New Version

#### Option A: Pull Latest Date Tag

```bash
# Pull the specific date version you pushed
docker pull iamcyberster/lms-be:2026-01-21

# Stop and remove old container
docker rm -f lead-app || true

# Run new container
docker run -d \
  --name lead-app \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  iamcyberster/lms-be:2026-01-21
```

#### Option B: Pull Latest Tag

```bash
# Pull latest
docker pull iamcyberster/lms-be:latest

# Stop and remove old container
docker rm -f lead-app || true

# Run new container
docker run -d \
  --name lead-app \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  iamcyberster/lms-be:latest
```

### Quick Update Script (Optional)

Create a simple update script on EC2:

```bash
nano /opt/lead-management/update.sh
```

Add:

```bash
#!/bin/bash
set -e

IMAGE_TAG=${1:-latest}
echo "Pulling image: iamcyberster/lms-be:${IMAGE_TAG}"

docker pull iamcyberster/lms-be:${IMAGE_TAG}

echo "Stopping old container..."
docker rm -f lead-app || true

echo "Starting new container..."
docker run -d \
  --name lead-app \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  iamcyberster/lms-be:${IMAGE_TAG}

echo "Deployment complete!"
docker logs -f lead-app
```

Make executable:

```bash
chmod +x /opt/lead-management/update.sh
```

Usage:

```bash
# Update to latest
./update.sh

# Update to specific date version
./update.sh 2026-01-21
```

### EC2 Security Group Configuration

Ensure your EC2 security group allows inbound traffic:

- **Port 3000** (or your custom PORT) from your IP or `0.0.0.0/0` for public access
- **Port 22** (SSH) from your IP only

### Verify Deployment

```bash
# Check container status
docker ps

# View logs
docker logs -f lead-app

# Test API
curl http://localhost:3000/api/docs
# Or from your browser: http://your-ec2-ip:3000/api/docs
```

---

## Manual Docker Commands

If you prefer to run commands manually instead of using the script:

### Build Image Locally

```bash
docker build \
  --build-arg MONGODB_URI="your-mongodb-uri" \
  --build-arg PORT=3000 \
  -t iamcyberster/lms-be:2026-01-21 \
  -t iamcyberster/lms-be:latest \
  .
```

### Build Multi-Arch Image

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg MONGODB_URI="your-mongodb-uri" \
  --build-arg PORT=3000 \
  -t iamcyberster/lms-be:2026-01-21 \
  -t iamcyberster/lms-be:latest \
  --push \
  .
```

### Run Container

```bash
docker run -d \
  --name lead-app \
  --env-file .env \
  -p 3000:3000 \
  iamcyberster/lms-be:2026-01-21
```

### Container Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs lead-app
docker logs -f lead-app  # follow logs

# Stop container
docker stop lead-app

# Start stopped container
docker start lead-app

# Remove container
docker rm lead-app

# Remove container (force, even if running)
docker rm -f lead-app

# Execute command in running container
docker exec -it lead-app sh
```

### Image Management

```bash
# List local images
docker images

# Remove image
docker rmi iamcyberster/lms-be:2026-01-21

# Remove all unused images
docker image prune -a
```

---

## Troubleshooting

### Permission Denied Error

If you see:
```
ERROR: open /Users/username/.docker/buildx/activity/default: permission denied
```

**Fix:**
```bash
sudo chown -R "$USER" ~/.docker
```

**Prevention:** Don't use `sudo` with Docker commands on macOS/Linux.

### Multi-Arch Build Requires buildx

If you get an error about `buildx`:

```bash
# Create and use a buildx builder
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
```

### Container Won't Start

1. **Check logs:**
   ```bash
   docker logs lead-app
   ```

2. **Check if port is already in use:**
   ```bash
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   ```

3. **Verify .env file exists and has correct values:**
   ```bash
   cat .env
   ```

### MongoDB Connection Issues

- Verify `MONGODB_URI` in `.env` is correct
- Check MongoDB Atlas IP whitelist includes your EC2 IP
- Test connection from EC2:
  ```bash
  curl "your-mongodb-uri"  # Should return connection info
  ```

### Image Too Large

The current Dockerfile includes all dependencies. To reduce size:

- Use `.dockerignore` to exclude unnecessary files
- Consider using `node:20-alpine` (already in use)
- Multi-stage build already optimizes the final image

### Date Tag Not Updating

The script uses `date +%Y-%m-%d`. If you're in a different timezone, the date might differ. The script always uses your local system date.

---

## Summary of Key Commands

### Local Development
```bash
./run-docker.sh
```

### Build & Push to Docker Hub
```bash
docker login
PUSH_MULTI_ARCH=true ./run-docker.sh
```

### Deploy on EC2
```bash
docker pull iamcyberster/lms-be:2026-01-21
docker run -d --name lead-app --env-file .env -p 3000:3000 iamcyberster/lms-be:2026-01-21
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**Last Updated:** January 2026
