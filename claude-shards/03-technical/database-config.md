# Database & Data Management

**Last Updated**: October 20, 2025
**Category**: Technical
**Related Shards**: [architecture-overview.md](./architecture-overview.md), [../02-project-context/multi-tenant-transformation.md](../02-project-context/multi-tenant-transformation.md)

## Database Configuration

- **Primary**: Render PostgreSQL with pgvector extension
- **ORM**: Prisma for type-safe database operations
- **Migrations**: Prisma migrations for schema management
- **Vector Support**: pgvector for embeddings and semantic search
- **Development**: Real data connections in all environments

## Key Data Models

- **Users**: Authentication and role management
- **Financial Models**: Working capital, AR/AP, cash flow
- **Manufacturing**: Jobs, resources, capacity planning
- **Dashboard**: User layouts, widget preferences

## Multi-Tenant Schema Architecture

```
PostgreSQL Database
├── public schema (shared metadata)
│   ├── tenants (master tenant registry)
│   ├── users (tenant association)
│   ├── subscriptions (Stripe billing)
│   └── audit_logs (compliance trail)
│
├── tenant_<uuid1> schema (Tenant A's data)
│   ├── companies, products, sales, inventory
│   ├── forecasts, working_capital_metrics
│   ├── scenarios, api_credentials
│   └── user_preferences
│
└── tenant_<uuid2> schema (Tenant B's data)
    └── (same 9 tables)
```

## Database Configuration (All Environments)

- All environments use Render PostgreSQL with pgvector extension
- Automatic connection string injection via render.yaml
- Support for vector embeddings and semantic search
- **Database Expiration**: Free tier expires **November 16, 2025** (upgrade required)

---

[← Previous: Integrations](./integrations.md) | [Next: Project Structure →](./project-structure.md) | [Back to Main →](../../CLAUDE.md)