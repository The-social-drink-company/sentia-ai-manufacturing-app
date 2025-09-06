#!/bin/bash
# Railway deployment script for Sentia Manufacturing Dashboard
# Fixes all common deployment issues and ensures proper build

set -e  # Exit on any error

echo "🚀 Starting Sentia Manufacturing Dashboard deployment to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_step "Validating project structure..."

# Check for required files
required_files=("Caddyfile" "railway.toml" "nixpacks.toml" "vite.config.js")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check environment variables
print_step "Checking environment variables..."

if [ -f ".env" ]; then
    print_success "Found .env file"
    
    # Check for critical environment variables
    critical_vars=("VITE_CLERK_PUBLISHABLE_KEY" "DATABASE_URL")
    for var in "${critical_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            print_success "$var is configured"
        else
            print_warning "$var might not be configured in .env"
        fi
    done
else
    print_warning "No .env file found - make sure environment variables are set in Railway"
fi

# Clean previous builds
print_step "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite
npm cache clean --force
print_success "Build cache cleared"

# Install dependencies
print_step "Installing dependencies..."
npm ci --prefer-offline --no-audit --silent
print_success "Dependencies installed"

# Build the project
print_step "Building React application..."
npm run build

# Validate build output
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "Build completed successfully"
    
    # Show build statistics
    echo ""
    echo "📊 Build Statistics:"
    echo "   - Total files: $(find dist -type f | wc -l)"
    echo "   - Total size: $(du -sh dist | cut -f1)"
    echo "   - JS files: $(find dist -name "*.js" | wc -l)"
    echo "   - CSS files: $(find dist -name "*.css" | wc -l)"
    echo "   - Images: $(find dist -name "*.png" -o -name "*.jpg" -o -name "*.svg" | wc -l)"
    echo ""
else
    print_error "Build failed - dist folder or index.html not found"
    exit 1
fi

# Test Caddy configuration
print_step "Validating Caddyfile..."
if command -v caddy &> /dev/null; then
    caddy validate --config Caddyfile --adapter caddyfile
    print_success "Caddyfile is valid"
else
    print_warning "Caddy not found locally - will be installed on Railway"
fi

# Check git status
print_step "Checking git status..."
if git status --porcelain | grep -q .; then
    print_warning "Uncommitted changes detected. Consider committing before deployment."
    git status --short
else
    print_success "Working directory is clean"
fi

# Show deployment URLs
echo ""
echo "🌐 Your Railway deployment URLs:"
echo "   Production:  https://sentia-manufacturing-dashboard-production.up.railway.app"
echo "   Testing:     https://courageous-insight-testing.up.railway.app"
echo "   Development: https://sentia-manufacturing-dashboard-development.up.railway.app"
echo ""
echo "🔗 Custom domains:"
echo "   Production:  https://sentiaprod.financeflo.ai"
echo "   Testing:     https://sentiatest.financeflo.ai"
echo "   Development: https://sentiadeploy.financeflo.ai"

# Final deployment instructions
echo ""
echo "🚀 Ready for deployment! Next steps:"
echo "1. Commit your changes: git add -A && git commit -m 'Railway deployment fixes'"
echo "2. Push to your branch: git push origin [branch-name]"
echo "3. Railway will automatically detect changes and redeploy"
echo ""
echo "🔍 Monitoring deployment:"
echo "1. Check Railway dashboard for build logs"
echo "2. Monitor health endpoint: /health"
echo "3. Check browser console for any remaining errors"

print_success "Deployment preparation complete! 🎉"