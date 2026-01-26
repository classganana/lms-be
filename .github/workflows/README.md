# GitHub Actions Workflows

## Docker Build and Push

The `docker-build-push.yml` workflow automatically builds and pushes Docker images to Docker Hub.

### Triggers

- **Push to main/master**: Builds and pushes new image
- **Tags (v*)**: Builds and pushes versioned image (e.g., `v1.0.0`)
- **Pull Requests**: Builds image but doesn't push (for testing)
- **Manual**: Can be triggered manually from GitHub Actions tab

### Required Secrets

Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

1. **DOCKER_USERNAME**: Your Docker Hub username
2. **DOCKER_PASSWORD**: Your Docker Hub password or access token
3. **MONGODB_URI**: (Optional) MongoDB connection string for build args

### Image Tags

Images are tagged with:
- `latest` - Latest build from main/master branch
- `main` or `master` - Branch name
- `v1.0.0` - Semantic version from git tags
- `main-abc1234` - Branch name + commit SHA

### Multi-Architecture Support

Builds for both:
- `linux/amd64` (Intel/AMD servers)
- `linux/arm64` (ARM servers, Apple Silicon)

### Cache

Uses Docker registry cache for faster builds:
- Cache stored as: `iamcyberster/lms-be:buildcache`
- Subsequent builds reuse cached layers

### Setup Instructions

1. Go to your GitHub repository
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password/token
   - `MONGODB_URI`: (Optional) Your MongoDB URI
4. Push to main/master branch to trigger the workflow

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Build and Push Docker Image**
3. Click **Run workflow**
4. Select branch and click **Run workflow**
