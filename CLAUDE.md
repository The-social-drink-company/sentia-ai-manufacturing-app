# CLAUDE.md - Navigation Index

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: October 23, 2025
**Documentation Structure**: Modular shards for better maintainability
**Current Status**: 85% production-ready | Multi-tenant Phases 1-6 complete | 4-6 weeks to production

## 🚨 Critical Rules (MUST READ)

### 🔴 NEVER AUTOMATICALLY COMMIT TO TEST/PRODUCTION BRANCHES
- ✅ Work in `main` branch
- ❌ NO auto-commits to `test` or `production` without explicit instruction
- ❌ NO PRs to test/production without explicit user request

### 📝 Development Standards
- Do what's asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- DO NOT add code comments unless asked

## 📚 Documentation Structure

The documentation is organized into focused shards for better maintainability:

### [01-methodology/](claude-shards/01-methodology/)
- **[bmad-method.md](claude-shards/01-methodology/bmad-method.md)** - BMAD-METHOD v6-Alpha framework
- **[bmad-auto-update.md](claude-shards/01-methodology/bmad-auto-update.md)** - Autonomous framework updates
- **[autonomous-git.md](claude-shards/01-methodology/autonomous-git.md)** - Git automation system

### [02-project-context/](claude-shards/02-project-context/)
- **[ecosystem-positioning.md](claude-shards/02-project-context/ecosystem-positioning.md)** - CapLiquify & FinanceFlo.ai relationship
- **[multi-tenant-transformation.md](claude-shards/02-project-context/multi-tenant-transformation.md)** - SaaS transformation progress
- **[implementation-status.md](claude-shards/02-project-context/implementation-status.md)** - Feature completion tracking

### [03-technical/](claude-shards/03-technical/)
- **[architecture-overview.md](claude-shards/03-technical/architecture-overview.md)** - System architecture
- **[authentication-system.md](claude-shards/03-technical/authentication-system.md)** - Clerk auth integration
- **[integrations.md](claude-shards/03-technical/integrations.md)** - External API status
- **[database-config.md](claude-shards/03-technical/database-config.md)** - Database setup
- **[project-structure.md](claude-shards/03-technical/project-structure.md)** - Directory organization

### [04-deployment/](claude-shards/04-deployment/)
- **[deployment-infrastructure.md](claude-shards/04-deployment/deployment-infrastructure.md)** - Render setup
- **[environment-setup.md](claude-shards/04-deployment/environment-setup.md)** - Environment variables
- **[branch-strategy.md](claude-shards/04-deployment/branch-strategy.md)** - Git workflow
- **[critical-deployment-rules.md](claude-shards/04-deployment/critical-deployment-rules.md)** - ⚠️ MUST READ

### [05-guidelines/](claude-shards/05-guidelines/)
- **[reality-summary.md](claude-shards/05-guidelines/reality-summary.md)** - What actually works
- **[code-standards.md](claude-shards/05-guidelines/code-standards.md)** - Development standards
- **[security.md](claude-shards/05-guidelines/security.md)** - Security practices
- **[important-instructions.md](claude-shards/05-guidelines/important-instructions.md)** - Critical instructions

## 🚀 Quick Start

1. **Development Methodology**: Using BMAD-METHOD v6-Alpha (see [methodology](claude-shards/01-methodology/bmad-method.md))
2. **Current Status**: Multi-tenant SaaS transformation Phases 1-6 complete
3. **Integrations**: 2/4 operational (Shopify, Amazon), 1/4 partial (Unleashed), 1/4 stub (Xero)
4. **Next Action**: Run `bmad pm workflow-status` to check project status

## ⚡ Active Systems

### 🤖 BMAD Auto-Update Agent ✅

**Status**: Operational - Autonomous daily framework updates
**Version**: 1.0.0

An autonomous system that automatically keeps your BMAD-METHOD framework up-to-date with the latest v6-alpha releases while **preserving 100% of your project work**.

**Key Features**:
- ✅ **Fully Autonomous**: Runs daily at 3:00 AM via Windows Task Scheduler
- ✅ **Smart Detection**: Only updates when new v6-alpha commits available
- ✅ **100% Safe**: Automatic backups before every update
- ✅ **Project Preservation**: Never loses epics, stories, retrospectives (141 files preserved)
- ✅ **Git Integration**: Automatic commits with descriptive messages
- ✅ **Rollback Capable**: Automatic rollback on failure
- ✅ **Zero Configuration**: Works out of the box with sensible defaults

**Quick Commands**:
```bash
# Test in dry-run mode
node scripts/bmad-auto-update.cjs --dry-run

# Manual update trigger
node scripts/bmad-auto-update.cjs --force

# Run test suite
node scripts/test-update.cjs --verbose

# Setup scheduled task (PowerShell as Admin)
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1
```

For complete documentation, see [bmad-auto-update.md](claude-shards/01-methodology/bmad-auto-update.md)

### 🤖 Autonomous Git Agent ✅
**Status**: Operational - Auto-commits, pushes, and suggests PRs
For complete documentation, see [autonomous-git.md](claude-shards/01-methodology/autonomous-git.md)

## 📌 Project Context

### Ecosystem Positioning
**CapLiquify** is a specialized working capital SaaS built on **FinanceFlo.ai** infrastructure.
For complete details, see [ecosystem-positioning.md](claude-shards/02-project-context/ecosystem-positioning.md)

### Multi-Tenant Transformation
**Status**: Phases 1-6 complete (Database, Backend, Auth, Marketing, Admin, Billing)
For complete details, see [multi-tenant-transformation.md](claude-shards/02-project-context/multi-tenant-transformation.md)

### Implementation Status
**Current**: 85% production-ready | 4-6 weeks remaining
For complete details, see [implementation-status.md](claude-shards/02-project-context/implementation-status.md)


## 🔧 Technical Details

For architecture, authentication, integrations, and database configuration, see:
- [03-technical/](claude-shards/03-technical/) - Technical documentation

## 🚢 Deployment

For deployment infrastructure, environment setup, and branch strategy, see:
- [04-deployment/](claude-shards/04-deployment/) - Deployment documentation

## 📋 Guidelines

For reality summary, code standards, and security practices, see:
- [05-guidelines/](claude-shards/05-guidelines/) - Guidelines and standards

---

## 🎯 Summary

This project is an **85% production-ready** manufacturing intelligence platform with:
- ✅ Complete multi-tenant SaaS foundation (Phases 1-6 done)
- ✅ Enterprise-grade architecture (React, Node.js, Prisma, PostgreSQL)
- ✅ Production-ready authentication (Clerk) and billing (Stripe)
- ⚠️ 2/4 integrations operational (Shopify, Amazon), 1 partial (Unleashed), 1 stub (Xero)
- ⏳ 4-6 weeks remaining: integration fixes + testing + hardening

**For detailed information, navigate to the appropriate shard documentation above.**
