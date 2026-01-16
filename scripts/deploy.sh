#!/bin/bash
set -e

# =============================================================================
# Kingdom Mind - Simple Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh
#
# Production: Port 4000 (ALWAYS)
# Development: Port 3000
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${YELLOW}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$PROJECT_DIR"

echo "================================================"
echo "Kingdom Mind - Simple Deploy"
echo "================================================"
echo ""

# Step 1: Build
log_info "Building Docker image..."
docker build -t km-app:latest .

# Step 2: Quick swap
log_info "Swapping containers (brief downtime)..."
docker stop km-prod 2>/dev/null || true
docker rm km-prod 2>/dev/null || true

docker run -d --name km-prod \
  --env-file .env.production.local \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e DATABASE_URL="postgresql://kingdom_user:781-1mGLUV_rx9uAQhH5S6VUwoxBykZ0@db:5432/kingdom_mind" \
  -p 4000:4000 \
  --network km-master_km-prod-net \
  --restart unless-stopped \
  km-app:latest

# Step 3: Verify
log_info "Waiting for startup..."
sleep 3

if curl -sf "http://localhost:4000" > /dev/null 2>&1; then
    log_success "Production is live on port 4000!"
else
    log_error "Health check failed - check logs: docker logs km-prod"
    exit 1
fi

echo ""
echo "================================================"
log_success "Deployment complete!"
echo "================================================"
