#!/bin/bash
# CapLiquify Branding Verification Script
# BMAD-REBRAND-002 - Verification Phase

echo "🔍 CapLiquify Branding Verification"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize counters
PLATFORM_REFS=0
TENANT_REFS=0
ERRORS=0

echo "📋 Phase 1: Checking for platform 'Sentia' references (should be 'CapLiquify')"
echo "-----------------------------------------------------------------------------"

# Check source code for platform branding (exclude tenant name)
echo "Checking src/ directory..."
PLATFORM_MATCHES=$(grep -r "Sentia Manufacturing\|Sentia AI\|Sentia Dashboard\|Sentia branding\|real Sentia data\|Sentia database" \
  src/ \
  --exclude-dir=node_modules \
  --exclude="*.test.js" \
  --exclude="*.spec.js" 2>/dev/null | wc -l)

if [ "$PLATFORM_MATCHES" -gt 0 ]; then
  echo -e "${RED}❌ Found $PLATFORM_MATCHES platform 'Sentia' references in src/${NC}"
  grep -rn "Sentia Manufacturing\|Sentia AI\|Sentia Dashboard\|Sentia branding\|real Sentia data\|Sentia database" \
    src/ \
    --exclude-dir=node_modules \
    --exclude="*.test.js" \
    --exclude="*.spec.js" 2>/dev/null | head -10
  PLATFORM_REFS=$((PLATFORM_REFS + PLATFORM_MATCHES))
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No platform 'Sentia' references in src/${NC}"
fi

echo ""
echo "Checking services/ directory..."
SERVICE_MATCHES=$(grep -r "Sentia Manufacturing\|Sentia AI\|real Sentia data\|Sentia database" \
  services/ \
  --exclude-dir=node_modules 2>/dev/null | wc -l)

if [ "$SERVICE_MATCHES" -gt 0 ]; then
  echo -e "${RED}❌ Found $SERVICE_MATCHES platform 'Sentia' references in services/${NC}"
  grep -rn "Sentia Manufacturing\|Sentia AI\|real Sentia data\|Sentia database" \
    services/ \
    --exclude-dir=node_modules 2>/dev/null | head -10
  PLATFORM_REFS=$((PLATFORM_REFS + SERVICE_MATCHES))
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No platform 'Sentia' references in services/${NC}"
fi

echo ""
echo "📋 Phase 2: Verifying valid tenant references (should exist)"
echo "------------------------------------------------------------"

# Check tenant seed file
TENANT_FILE="prisma/seed-tenant-sentia-spirits.js"
if [ -f "$TENANT_FILE" ]; then
  TENANT_COUNT=$(grep -c "Sentia Spirits" "$TENANT_FILE" 2>/dev/null || echo "0")
  echo -e "${GREEN}✅ Found $TENANT_COUNT 'Sentia Spirits' references in tenant seed file${NC}"
  TENANT_REFS=$TENANT_COUNT
else
  echo -e "${RED}❌ Tenant seed file not found: $TENANT_FILE${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check multi-tenant architecture doc
ARCH_DOC="docs/MULTI-TENANT-ARCHITECTURE.md"
if [ -f "$ARCH_DOC" ]; then
  ARCH_COUNT=$(grep -c "Sentia Spirits" "$ARCH_DOC" 2>/dev/null || echo "0")
  echo -e "${GREEN}✅ Found $ARCH_COUNT 'Sentia Spirits' references in architecture doc${NC}"
else
  echo -e "${YELLOW}⚠️  Architecture doc not found: $ARCH_DOC${NC}"
fi

echo ""
echo "📋 Phase 3: Critical user-facing checks"
echo "----------------------------------------"

# Check sign-in page
if grep -q "CapLiquify Manufacturing" "src/pages/SignInPage.jsx" 2>/dev/null; then
  echo -e "${GREEN}✅ Sign-in page shows 'CapLiquify Manufacturing'${NC}"
else
  echo -e "${RED}❌ Sign-in page missing 'CapLiquify' branding${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check sign-up page
if grep -q "CapLiquify Manufacturing" "src/pages/SignUpPage.jsx" 2>/dev/null; then
  echo -e "${GREEN}✅ Sign-up page shows 'CapLiquify Manufacturing'${NC}"
else
  echo -e "${RED}❌ Sign-up page missing 'CapLiquify' branding${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check main sidebar
if grep -q "Capliquify" "src/components/layout/Sidebar.jsx" 2>/dev/null; then
  echo -e "${GREEN}✅ Main sidebar shows 'Capliquify'${NC}"
else
  echo -e "${RED}❌ Main sidebar missing 'Capliquify' branding${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check landing page
if grep -q "CapLiquify\|Capliquify" "src/pages/LandingPage.jsx" 2>/dev/null; then
  echo -e "${GREEN}✅ Landing page shows 'CapLiquify' branding${NC}"
else
  echo -e "${RED}❌ Landing page missing 'CapLiquify' branding${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📊 Summary"
echo "=========="
echo "Platform 'Sentia' references found: $PLATFORM_REFS"
echo "Valid 'Sentia Spirits' (tenant) references: $TENANT_REFS"
echo "Critical errors: $ERRORS"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$PLATFORM_REFS" -eq 0 ]; then
  echo -e "${GREEN}🎉 VERIFICATION PASSED!${NC}"
  echo "✅ All platform branding uses 'CapLiquify'"
  echo "✅ Tenant name 'Sentia Spirits' properly preserved"
  echo "✅ Critical user-facing pages correctly branded"
  exit 0
else
  echo -e "${RED}❌ VERIFICATION FAILED${NC}"
  echo "Please review and fix the issues above"
  exit 1
fi
