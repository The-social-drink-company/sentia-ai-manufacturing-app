# k6 Load Testing Suite

**BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure**

Comprehensive k6 load testing scripts for multi-tenant middleware performance validation.

---

## 📋 **Overview**

This directory contains three k6 load testing scenarios:

1. **tenant-creation.js** - Tenant provisioning storm (50 tenants/minute)
2. **api-load.js** - Concurrent API requests (1000 RPS target)
3. **mixed-workload.js** - Realistic production workload (70/20/10 read/write/analytics)

---

## 🚀 **Quick Start**

```bash
# Install k6
brew install k6  # macOS
# or visit https://k6.io/docs/get-started/installation/

# Run tests
k6 run tests/load/tenant-creation.js
k6 run tests/load/api-load.js
k6 run tests/load/mixed-workload.js

# Against production
k6 run tests/load/api-load.js -e API_URL=https://api.capliquify.com
```

See full documentation below for detailed usage.

---

**Last Updated**: 2025-10-20
**Epic**: BMAD-MULTITENANT-003 (Integration & Performance Testing)
