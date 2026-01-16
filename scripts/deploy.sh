#!/bin/bash
set -e

# =============================================================================
# Kingdom Mind - Blue-Green Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh
#
# This script performs zero-downtime deployments using blue-green strategy:
# 1. Detects which environment (blue/green) is currently active
# 2. Builds and starts the inactive environment
# 3. Waits for health check to pass
# 4. Switches Cloudflare tunnel to the new environment
# 5. Keeps old environment running as fallback
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.blue-green.yml"
CLOUDFLARED_CONFIG="/etc/cloudflared/config.yml"

BLUE_PORT=4001
GREEN_PORT=4002

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect which environment is currently active by checking cloudflared config
get_active_env() {
    if grep -q "localhost:$BLUE_PORT" "$CLOUDFLARED_CONFIG" 2>/dev/null; then
        echo "blue"
    elif grep -q "localhost:$GREEN_PORT" "$CLOUDFLARED_CONFIG" 2>/dev/null; then
        echo "green"
    else
        echo "none"
    fi
}

# Get the inactive environment
get_inactive_env() {
    local active=$(get_active_env)
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Get port for environment
get_port() {
    if [ "$1" = "blue" ]; then
        echo "$BLUE_PORT"
    else
        echo "$GREEN_PORT"
    fi
}

# Health check function
wait_for_health() {
    local env=$1
    local port=$(get_port "$env")
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $env (port $port) to be healthy..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "http://localhost:$port/api/app/config" > /dev/null 2>&1; then
            log_success "$env is healthy!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    log_error "$env failed health check after $max_attempts attempts"
    return 1
}

# Switch cloudflared to new environment
switch_tunnel() {
    local new_env=$1
    local new_port=$(get_port "$new_env")

    log_info "Switching tunnel to $new_env (port $new_port)..."

    # Update cloudflared config
    sudo sed -i "s/localhost:[0-9]*/localhost:$new_port/g" "$CLOUDFLARED_CONFIG"

    # Restart cloudflared
    sudo systemctl restart cloudflared

    sleep 2

    # Verify tunnel is working
    if curl -sf "https://kingdomind.com/api/app/config" > /dev/null 2>&1; then
        log_success "Tunnel switched successfully!"
        return 0
    else
        log_error "Tunnel switch may have failed - please verify manually"
        return 1
    fi
}

# Main deployment function
deploy() {
    log_info "Starting Blue-Green Deployment"
    echo "================================================"

    cd "$PROJECT_DIR"

    # Detect current state
    local active=$(get_active_env)
    local target=$(get_inactive_env)
    local target_port=$(get_port "$target")

    log_info "Current active: $active"
    log_info "Deploying to: $target (port $target_port)"
    echo ""

    # Ensure DB is running
    log_info "Ensuring database is running..."
    docker-compose -f "$COMPOSE_FILE" up -d db
    sleep 3

    # Build and start the target environment
    log_info "Building $target environment..."
    docker-compose -f "$COMPOSE_FILE" build "$target"

    log_info "Starting $target environment..."
    docker-compose -f "$COMPOSE_FILE" up -d "$target"

    # Wait for health check
    if ! wait_for_health "$target"; then
        log_error "Deployment failed - $target is not healthy"
        log_warn "Rolling back - keeping $active as active"
        docker-compose -f "$COMPOSE_FILE" stop "$target"
        exit 1
    fi

    # Switch tunnel
    if ! switch_tunnel "$target"; then
        log_error "Tunnel switch failed"
        log_warn "Please check tunnel configuration manually"
        exit 1
    fi

    echo ""
    log_success "Deployment complete!"
    echo "================================================"
    log_info "Active: $target (port $target_port)"
    log_info "Standby: $active (still running as fallback)"
    echo ""
    log_info "To stop the old environment: docker-compose -f docker-compose.blue-green.yml stop $active"
    log_info "To rollback: ./scripts/deploy.sh (will switch back to $active)"
}

# Show status
status() {
    local active=$(get_active_env)
    echo "================================================"
    echo "Blue-Green Deployment Status"
    echo "================================================"
    echo ""
    echo "Active Environment: $active"
    echo ""
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Health Checks:"
    echo -n "  Blue (port $BLUE_PORT): "
    if curl -sf "http://localhost:$BLUE_PORT/api/app/config" > /dev/null 2>&1; then
        echo -e "${GREEN}healthy${NC}"
    else
        echo -e "${RED}unhealthy${NC}"
    fi
    echo -n "  Green (port $GREEN_PORT): "
    if curl -sf "http://localhost:$GREEN_PORT/api/app/config" > /dev/null 2>&1; then
        echo -e "${GREEN}healthy${NC}"
    else
        echo -e "${RED}unhealthy${NC}"
    fi
    echo ""
}

# Parse arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    status)
        status
        ;;
    rollback)
        log_info "Rolling back (deploying to previous environment)..."
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|status|rollback}"
        exit 1
        ;;
esac
