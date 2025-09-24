#!/bin/bash

# Sentia Manufacturing Dashboard - Production Deployment Script
# Enterprise-grade deployment with comprehensive validation and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG="$PROJECT_ROOT/logs/deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
ENVIRONMENT="production"
RAILWAY_PROJECT_ID="b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f"
RAILWAY_TOKEN_PROD="3e0053fc-ea90-49ec-9708-e09d58cad4a0"

# Health check configuration
HEALTH_CHECK_URL="https://sentiadeploy.financeflo.ai/health"
HEALTH_CHECK_TIMEOUT=300
HEALTH_CHECK_RETRIES=10

# Create necessary directories
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Error handling
handle_error() {
    local line_number=$1
    log_error "Deployment failed at line $line_number"
    log_error "Initiating rollback procedure..."
    rollback_deployment
    exit 1
}

trap 'handle_error $LINENO' ERR

# Pre-deployment validation
validate_environment() {
    log "🔍 Validating deployment environment..."
    
    # Check required tools
    command -v railway >/dev/null 2>&1 || { log_error "Railway CLI not found. Please install it first."; exit 1; }
    command -v node >/dev/null 2>&1 || { log_error "Node.js not found. Please install it first."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm not found. Please install it first."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18.0.0"
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_NODE_VERSION') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $NODE_VERSION is not supported. Required: $REQUIRED_NODE_VERSION or higher"
        exit 1
    fi
    
    # Validate Railway authentication
    if ! railway whoami >/dev/null 2>&1; then
        log_error "Railway CLI not authenticated. Please run 'railway login' first."
        exit 1
    fi
    
    # Check environment variables
    if [ -z "${RAILWAY_TOKEN_PROD:-}" ]; then
        log_error "RAILWAY_TOKEN_PROD environment variable not set"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

# Pre-deployment tests
run_pre_deployment_tests() {
    log "🧪 Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "📦 Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log "🔍 Running code quality checks..."
    npm run lint || { log_error "Linting failed"; exit 1; }
    
    # Run unit tests
    log "🧪 Running unit tests..."
    npm run test:unit || { log_error "Unit tests failed"; exit 1; }
    
    # Run integration tests
    log "🔗 Running integration tests..."
    npm run test:integration || { log_error "Integration tests failed"; exit 1; }
    
    # Run security scan
    log "🔒 Running security scan..."
    npm audit --audit-level high || { log_error "Security vulnerabilities found"; exit 1; }
    
    # Build application
    log "🏗️  Building application..."
    npm run build:production || { log_error "Build failed"; exit 1; }
    
    log_success "Pre-deployment tests completed"
}

# Database migration check
check_database_migrations() {
    log "🗄️  Checking database migrations..."
    
    # Check if migrations are needed
    if npm run db:migrate:status | grep -q "pending"; then
        log_warning "Pending database migrations found"
        
        # Create database backup
        log "💾 Creating database backup..."
        npm run db:backup --backup-dir="$BACKUP_DIR" || { log_error "Database backup failed"; exit 1; }
        
        # Run migrations
        log "🔄 Running database migrations..."
        npm run db:migrate || { log_error "Database migration failed"; exit 1; }
        
        log_success "Database migrations completed"
    else
        log_success "No pending database migrations"
    fi
}

# Deploy to Railway
deploy_to_railway() {
    log "🚀 Deploying to Railway production..."
    
    # Set Railway project and environment
    export RAILWAY_TOKEN="$RAILWAY_TOKEN_PROD"
    railway link "$RAILWAY_PROJECT_ID" || { log_error "Failed to link Railway project"; exit 1; }
    
    # Deploy with production configuration
    log "📤 Uploading application to Railway..."
    railway up --detach || { log_error "Railway deployment failed"; exit 1; }
    
    # Wait for deployment to complete
    log "⏳ Waiting for deployment to complete..."
    sleep 30
    
    # Get deployment status
    DEPLOYMENT_ID=$(railway status --json | jq -r '.deployments[0].id')
    log "📋 Deployment ID: $DEPLOYMENT_ID"
    
    # Monitor deployment progress
    local retries=0
    local max_retries=20
    
    while [ $retries -lt $max_retries ]; do
        DEPLOYMENT_STATUS=$(railway status --json | jq -r '.deployments[0].status')
        
        case "$DEPLOYMENT_STATUS" in
            "SUCCESS")
                log_success "Deployment completed successfully"
                return 0
                ;;
            "FAILED"|"CRASHED")
                log_error "Deployment failed with status: $DEPLOYMENT_STATUS"
                return 1
                ;;
            "BUILDING"|"DEPLOYING")
                log "🔄 Deployment in progress... ($DEPLOYMENT_STATUS)"
                sleep 30
                ;;
            *)
                log "📊 Deployment status: $DEPLOYMENT_STATUS"
                sleep 15
                ;;
        esac
        
        retries=$((retries + 1))
    done
    
    log_error "Deployment timeout after $max_retries attempts"
    return 1
}

# Health checks
perform_health_checks() {
    log "🏥 Performing health checks..."
    
    local retries=0
    local success=false
    
    while [ $retries -lt $HEALTH_CHECK_RETRIES ] && [ "$success" = false ]; do
        log "🔍 Health check attempt $((retries + 1))/$HEALTH_CHECK_RETRIES..."
        
        if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            success=true
            log_success "Health check passed"
        else
            retries=$((retries + 1))
            if [ $retries -lt $HEALTH_CHECK_RETRIES ]; then
                log_warning "Health check failed, retrying in 30 seconds..."
                sleep 30
            fi
        fi
    done
    
    if [ "$success" = false ]; then
        log_error "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
        return 1
    fi
    
    return 0
}

# Post-deployment validation
validate_deployment() {
    log "✅ Validating deployment..."
    
    # Test critical endpoints
    log "🔍 Testing critical endpoints..."
    
    # Health endpoint
    if ! curl -f -s "$HEALTH_CHECK_URL" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
        log_error "Health endpoint validation failed"
        return 1
    fi
    
    # API endpoints
    local api_endpoints=(
        "/api/auth/health"
        "/api/forecasting/health"
        "/api/reporting/health"
        "/api/integrations/health"
        "/api/workflows/health"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local url="https://sentiadeploy.financeflo.ai$endpoint"
        if ! curl -f -s "$url" >/dev/null 2>&1; then
            log_error "API endpoint validation failed: $endpoint"
            return 1
        fi
    done
    
    # Test database connectivity
    log "🗄️  Testing database connectivity..."
    if ! curl -f -s "https://sentiadeploy.financeflo.ai/api/health/database" | jq -e '.connected == true' >/dev/null 2>&1; then
        log_error "Database connectivity test failed"
        return 1
    fi
    
    # Test integrations
    log "🔗 Testing external integrations..."
    local integration_endpoints=(
        "/api/integrations/unleashed/health"
        "/api/integrations/shopify/health"
        "/api/integrations/xero/health"
        "/api/integrations/ai/health"
    )
    
    for endpoint in "${integration_endpoints[@]}"; do
        local url="https://sentiadeploy.financeflo.ai$endpoint"
        if ! curl -f -s "$url" >/dev/null 2>&1; then
            log_warning "Integration health check failed: $endpoint (non-critical)"
        fi
    done
    
    # Performance baseline test
    log "⚡ Running performance baseline test..."
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$HEALTH_CHECK_URL")
    
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log_warning "Response time is higher than expected: ${response_time}s"
    else
        log_success "Response time is within acceptable range: ${response_time}s"
    fi
    
    log_success "Deployment validation completed"
}

# Rollback function
rollback_deployment() {
    log_error "🔄 Initiating rollback procedure..."
    
    # Get previous deployment
    local previous_deployment
    previous_deployment=$(railway deployments --json | jq -r '.[1].id // empty')
    
    if [ -n "$previous_deployment" ]; then
        log "⏪ Rolling back to deployment: $previous_deployment"
        railway rollback "$previous_deployment" || {
            log_error "Rollback failed"
            return 1
        }
        
        # Wait for rollback to complete
        sleep 60
        
        # Verify rollback
        if perform_health_checks; then
            log_success "Rollback completed successfully"
        else
            log_error "Rollback verification failed"
            return 1
        fi
    else
        log_error "No previous deployment found for rollback"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "🧹 Performing cleanup..."
    
    # Remove temporary files
    rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/.next/cache" 2>/dev/null || true
    
    # Compress deployment logs
    if [ -f "$DEPLOYMENT_LOG" ]; then
        gzip "$DEPLOYMENT_LOG" 2>/dev/null || true
    fi
    
    log_success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    log "📢 Sending deployment notification..."
    
    # Slack notification (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
            *) color="warning" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"Sentia Dashboard Deployment\",\"text\":\"$message\",\"footer\":\"Railway Production\",\"ts\":$(date +%s)}]}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ]; then
        echo "$message" | mail -s "Sentia Dashboard Deployment - $status" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# Main deployment function
main() {
    log "🚀 Starting Sentia Manufacturing Dashboard production deployment..."
    log "📅 Deployment started at: $(date)"
    log "🏷️  Environment: $ENVIRONMENT"
    log "📋 Project ID: $RAILWAY_PROJECT_ID"
    
    # Deployment steps
    validate_environment
    run_pre_deployment_tests
    check_database_migrations
    deploy_to_railway
    perform_health_checks
    validate_deployment
    
    # Success notification
    local deployment_time=$((SECONDS / 60))
    local success_message="✅ Production deployment completed successfully in ${deployment_time} minutes"
    log_success "$success_message"
    send_notification "success" "$success_message"
    
    cleanup
    
    log "🎉 Deployment completed successfully!"
    log "🌐 Application URL: https://sentiadeploy.financeflo.ai"
    log "📊 Health Check: $HEALTH_CHECK_URL"
    log "📝 Deployment log: $DEPLOYMENT_LOG.gz"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Check if running with proper arguments
    if [ "$#" -gt 0 ] && [ "$1" = "--help" ]; then
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help          Show this help message"
        echo "  --dry-run       Perform validation without deploying"
        echo "  --force         Skip confirmation prompts"
        echo ""
        echo "Environment Variables:"
        echo "  RAILWAY_TOKEN_PROD    Railway production token"
        echo "  SLACK_WEBHOOK_URL     Slack webhook for notifications"
        echo "  NOTIFICATION_EMAIL    Email for deployment notifications"
        exit 0
    fi
    
    # Dry run option
    if [ "$#" -gt 0 ] && [ "$1" = "--dry-run" ]; then
        log "🔍 Performing dry run (validation only)..."
        validate_environment
        run_pre_deployment_tests
        log_success "Dry run completed successfully"
        exit 0
    fi
    
    # Confirmation prompt (unless --force is used)
    if [ "$#" -eq 0 ] || [ "$1" != "--force" ]; then
        echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION environment.${NC}"
        echo -e "${YELLOW}   This will affect the live application at https://sentiadeploy.financeflo.ai${NC}"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Start deployment
    main "$@"
fi

