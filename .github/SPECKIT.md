# GitHub SpecKit - Sentia Manufacturing Dashboard

## 🚀 Project Overview

**Sentia Manufacturing Dashboard** is an enterprise-grade, AI-powered manufacturing operations platform built with React, Node.js, and advanced machine learning capabilities. The system provides real-time monitoring, predictive analytics, and comprehensive business intelligence for manufacturing operations.

### Key Metrics
- **Components**: 269+ React components
- **Services**: 45+ backend services
- **API Endpoints**: 138+ microservices
- **Dependencies**: 220+ npm packages
- **Code Quality**: Refactored and optimized
- **Test Coverage**: Comprehensive testing suite

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Technology Stack](#technology-stack)
3. [Features](#features)
4. [Development Setup](#development-setup)
5. [Deployment](#deployment)
6. [API Documentation](#api-documentation)
7. [Security](#security)
8. [Contributing](#contributing)
9. [License](#license)

## 🏗 Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                 │
├─────────────────────────────────────────────────────────┤
│                  API Gateway (Express)                   │
├─────────────────────────────────────────────────────────┤
│              Business Logic Layer (Services)             │
├─────────────────────────────────────────────────────────┤
│           Data Access Layer (Prisma ORM)                │
├─────────────────────────────────────────────────────────┤
│         PostgreSQL with pgvector extension              │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture
- **Layout System**: Header, Sidebar, Footer with responsive design
- **Dashboard Widgets**: Modular, draggable widgets with real-time updates
- **Authentication**: Clerk-based authentication with role-based access control
- **State Management**: Zustand for client state, TanStack Query for server state
- **Real-time Updates**: Server-Sent Events (SSE) and WebSocket connections

## 💻 Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **Vite 7.1.7** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **TanStack Query 5.90.1** - Data fetching and caching
- **Zustand 5.0.8** - State management
- **React Router 6.30.1** - Client-side routing
- **Recharts 2.15.4** - Data visualization
- **Three.js 0.180.0** - 3D graphics

### Backend
- **Node.js 20.19.0+** - Runtime environment
- **Express 4.21.2** - Web framework
- **Prisma 6.15.0** - ORM and database toolkit
- **PostgreSQL** - Primary database with pgvector
- **Redis 5.8.2** - Caching and sessions
- **BullMQ 5.58.7** - Job queue management

### AI & Machine Learning
- **OpenAI API 4.104.0** - GPT integration
- **Model Context Protocol** - AI orchestration
- **ML Libraries** - kmeans, regression analysis
- **Vector Database** - pgvector for embeddings

### Authentication & Security
- **Clerk 5.47.0** - Authentication service
- **JWT** - Token-based authentication
- **Helmet 8.1.0** - Security headers
- **Express Rate Limit** - API rate limiting
- **CORS** - Cross-origin resource sharing

### Monitoring & Observability
- **Winston 3.11.0** - Structured logging
- **Sentry 10.10.0** - Error tracking
- **Prometheus Client** - Metrics collection
- **Custom Dashboards** - Real-time monitoring

## ✨ Features

### Core Features
1. **Enterprise Dashboard System**
   - 10-stage progressive loading
   - Responsive grid layout with drag-and-drop
   - Dark/light theme support
   - Keyboard shortcuts for navigation

2. **Financial Management**
   - Working Capital Analysis
   - What-If Scenario Modeling
   - Cash Flow Forecasting
   - Cost Analysis & Reporting

3. **Manufacturing Operations**
   - Production Tracking & Optimization
   - Quality Control Management
   - Inventory Management
   - Demand Forecasting

4. **AI-Powered Analytics**
   - Predictive Maintenance
   - Anomaly Detection
   - Natural Language Insights
   - Automated Reporting

5. **Integration Capabilities**
   - Xero Accounting
   - Shopify Commerce
   - Amazon SP-API
   - Custom API Webhooks

## 🛠 Development Setup

### Prerequisites
```bash
# Required
Node.js 20.19.0+
npm 10.0.0+
PostgreSQL 15+
Redis (optional for caching)

# Environment Variables (see .env.template)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
DATABASE_URL=postgresql://...
```

### Installation
```bash
# Clone repository
git clone https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git

# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start development servers
npm run dev
```

### Available Scripts
```json
{
  "dev": "Start development servers",
  "build": "Build for production",
  "test": "Run test suite",
  "lint": "Run ESLint",
  "format": "Format code with Prettier"
}
```

## 🚀 Deployment

### Environments
- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com

### Deployment Process
```bash
# Development branch
git push origin development  # Auto-deploys to dev

# Testing branch
git push origin test         # Auto-deploys to test

# Production branch
git push origin production   # Auto-deploys to production
```

### Infrastructure
- **Hosting**: Render.com
- **Database**: Render PostgreSQL with pgvector
- **CDN**: Cloudflare
- **Monitoring**: Custom monitoring dashboards

## 📚 API Documentation

### Base URLs
- Development: `https://sentia-manufacturing-development.onrender.com/api`
- Production: `https://sentia-manufacturing-production.onrender.com/api`

### Key Endpoints
```
GET    /api/health                 # Health check
GET    /api/dashboard/data          # Dashboard data
POST   /api/auth/login              # User authentication
GET    /api/working-capital/overview # Financial data
POST   /api/forecasting/predict     # AI predictions
GET    /api/inventory/status        # Inventory levels
POST   /api/production/optimize     # Production optimization
```

### Authentication
All API requests require authentication via Bearer token:
```
Authorization: Bearer <jwt_token>
```

## 🔐 Security

### Security Measures
- **Authentication**: Clerk-based with MFA support
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: TLS 1.3 for transport, AES-256 for storage
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API rate limiting per user/IP
- **Security Headers**: Helmet.js security headers
- **Vulnerability Scanning**: Regular dependency audits

### Compliance
- GDPR compliant data handling
- SOC 2 Type II controls
- ISO 27001 standards
- PCI DSS for payment processing

## 👥 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### 2025-09-25 Repository Reset
- Fresh clone created to eliminate accumulated lint and formatting errors.
- All context and SpecKit documentation synchronized with the new baseline.
- Teams must rebase feature branches onto the refreshed repository before merging.

### Code Standards
- ESLint configuration enforced
- Prettier for code formatting
- Comprehensive testing required
- Documentation for new features

### Pull Request Process
1. Update documentation
2. Add/update tests
3. Ensure all tests pass
4. Request code review
5. Merge after approval

## 📄 License

This project is proprietary software owned by The Social Drink Company.

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/issues)
- **Documentation**: [Full documentation](./docs)
- **Email**: support@sentia.com

## 🏆 Acknowledgments

Built with enterprise-grade technologies and best practices for scalable manufacturing operations management.

---

Last Updated: September 2025
Version: 1.0.5