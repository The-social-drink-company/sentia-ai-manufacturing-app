# Context Documentation - Sentia Manufacturing Dashboard

## Overview

This directory contains comprehensive documentation for the Sentia Manufacturing Dashboard, organized by domain and purpose. Each subdirectory contains specific context files that guide development, deployment, and maintenance of the system.

## Directory Structure

### 📊 `/api-documentation/`
External API integration documentation for third-party services:
- Amazon SP-API integration
- Shopify API configuration
- Xero accounting integration
- Unleashed inventory management
- OpenAI and Claude AI services

### 💼 `/business-logic/`
Core business rules and algorithms:
- Data validation rules
- Forecasting algorithms
- Inventory optimization logic
- Working capital calculations
- Manufacturing constraints

### 📋 `/business-requirements/`
Business specifications and requirements:
- User acceptance criteria
- Admin panel requirements
- Cash flow management specs
- Data source definitions
- Enterprise implementation plans
- Seasonal pattern analysis
- Supply chain constraints

### 🔐 `/clerk-authentication/`
Clerk authentication system documentation:
- Deployment guides
- Configuration settings
- Role-based access control
- Security best practices

### 🗄 `/database-schemas/`
Database structure and relationships:
- Entity relationship diagrams
- Prisma schema definitions
- Migration strategies
- pgvector configuration

### 🚀 `/deployment-configs/`
Deployment and infrastructure configuration:
- Render deployment settings
- Environment configurations
- Observability setup
- Performance optimization

### 🛠 `/development-methodology/`
Development practices and guidelines:
- Coding standards
- Git workflow
- Testing strategies
- Code review process

### 🔧 `/environment-configuration/`
Environment-specific settings:
- Development environment setup
- Production configurations
- Environment variables documentation

### 🎨 `/ui-components/`
UI/UX specifications and component documentation:
- Dashboard layouts
- Widget specifications
- Theme system
- Responsive design guidelines

### 📖 `/claude-code-docs/`
Claude Code integration documentation:
- MCP server setup
- AI orchestration patterns
- Tool configurations

### 🔬 `/technical-specifications/`
Technical architecture documentation:
- System architecture
- API design patterns
- Performance requirements
- Security specifications

## Key Documents

### Critical Files for New Developers

1. **[DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md)**
   - All deployment environment URLs
   - Health check endpoints
   - Monitoring dashboards

2. **[ENTERPRISE_IMPLEMENTATION_PLAN.md](./business-requirements/ENTERPRISE_IMPLEMENTATION_PLAN.md)**
   - Complete implementation roadmap
   - Feature prioritization
   - Timeline and milestones

3. **[CLERK_ENTERPRISE_IMPLEMENTATION_COMPLETE.md](./CLERK_ENTERPRISE_IMPLEMENTATION_COMPLETE.md)**
   - Authentication system documentation
   - Security implementation details

4. **[vibe_coding_guide.md](./development-methodology/vibe_coding_guide.md)**
   - Coding standards and practices
   - Development workflow

## Quick Reference

### Environment URLs
- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com

### Key Technologies
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL with pgvector
- Authentication: Clerk
- AI: OpenAI GPT-4 + Claude via MCP

### Important Commands
```bash
# Development
npm run dev              # Start development servers
npm run build           # Build for production
npm run test            # Run test suite
npm run lint            # Check code quality

# Database
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio

# Deployment
git push origin development  # Deploy to dev
git push origin test        # Deploy to test
git push origin production # Deploy to production
```

## Documentation Standards

### File Naming Convention
- Use snake_case for documentation files
- Use UPPER_CASE for critical/important docs
- Include timestamps in deployment docs

### Content Structure
1. **Title** - Clear, descriptive title
2. **Overview** - Brief summary of content
3. **Details** - Comprehensive information
4. **Examples** - Code samples where applicable
5. **References** - Links to related docs

### Update Frequency
- API Documentation: On integration changes
- Business Logic: On rule modifications
- Deployment Configs: On infrastructure updates
- Development Guides: On process changes

## Contributing

When adding new context documentation:

1. Place files in the appropriate subdirectory
2. Follow the naming conventions
3. Include a clear title and overview
4. Update this README if adding new categories
5. Link related documentation

## Support

For questions about documentation:
- Check existing docs first
- Consult the codebase index (CODEBASE_INDEX.md)
- Review GitHub SpecKit (.github/SPECKIT.md)
- Contact the development team

---

Last Updated: September 2025
Version: 1.0.0