# Render PostgreSQL Database Configuration

## Database Connection Details

### Development Database
- **Database ID**: `dpg-d344rkfdiees73a20c50-a`
- **Database Name**: `sentia_manufacturing_dev`
- **Username**: `sentia_dev`
- **Password**: `nZ4vtXienMAwxahr0GJByc2qXFIFSoYL`
- **Port**: `5432`

#### Connection URLs:
```bash
# Internal (for Render services)
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev

# External (for local development)
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev
```

#### PSQL Command:
```bash
PGPASSWORD=nZ4vtXienMAwxahr0GJByc2qXFIFSoYL psql -h dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com -U sentia_dev sentia_manufacturing_dev
```

---

### Testing Database
- **Database ID**: `dpg-d344rkfdiees73a20c40-a`
- **Database Name**: `sentia_manufacturing_test`
- **Username**: `sentia_test`
- **Password**: `He45HKApt8BjbCXXVPtEhIxbaBXxk3we`
- **Port**: `5432`

#### Connection URLs:
```bash
# Internal (for Render services)
DATABASE_URL=postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test

# External (for local development)
DATABASE_URL=postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test
```

#### PSQL Command:
```bash
PGPASSWORD=He45HKApt8BjbCXXVPtEhIxbaBXxk3we psql -h dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com -U sentia_test sentia_manufacturing_test
```

---

### Production Database
- **Database ID**: `dpg-d344rkfdiees73a20c30-a`
- **Database Name**: `sentia_manufacturing_prod`
- **Username**: `sentia_prod`
- **Password**: `nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2`
- **Port**: `5432`

#### Connection URLs:
```bash
# Internal (for Render services)
DATABASE_URL=postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod

# External (for local development)
DATABASE_URL=postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com/sentia_manufacturing_prod
```

#### PSQL Command:
```bash
PGPASSWORD=nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2 psql -h dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com -U sentia_prod sentia_manufacturing_prod
```

---

## Access Control

All databases are configured with the following access control:
- **Allowed IP Range**: `0.0.0.0/0` (everywhere)
- **Description**: Open access for development and deployment

---

## Environment Variable Configuration

### For Render Services

When deploying to Render, use the **internal** connection URLs in your environment variables:

#### Development Service
```env
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev
```

#### Testing Service
```env
DATABASE_URL=postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test
```

#### Production Service
```env
DATABASE_URL=postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod
```

### For Local Development

When developing locally, use the **external** connection URLs:

```env
# Development
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev

# Testing
DATABASE_URL=postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test

# Production (use with caution)
DATABASE_URL=postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com/sentia_manufacturing_prod
```

---

## Prisma Configuration

Update your `prisma/schema.prisma` file to use the Render database:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Database Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

## Connection Pooling

Render PostgreSQL databases support connection pooling. The connection URLs provided above already include the necessary configuration for optimal performance.

### Recommended Pool Settings:
```env
DB_POOL_MIN=5
DB_POOL_MAX=50
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
```

---

## Security Notes

1. **Never commit database credentials to Git**
2. **Use environment variables for all database connections**
3. **Rotate passwords regularly for production databases**
4. **Use internal URLs for Render services to avoid internet latency**
5. **Use external URLs only for local development and debugging**

---

## Troubleshooting

### Connection Issues

If you cannot connect to the database:

1. **Check IP whitelist**: Ensure your IP is allowed (currently set to 0.0.0.0/0)
2. **Verify credentials**: Double-check username and password
3. **Use correct URL**: Internal for Render services, external for local
4. **Check database status**: Verify the database is running in Render dashboard

### Common Errors

- **ECONNREFUSED**: Database is down or URL is incorrect
- **FATAL: password authentication failed**: Incorrect username or password
- **FATAL: database does not exist**: Wrong database name
- **timeout**: Network issues or database overloaded

---

## Support

For database issues:
1. Check Render dashboard for database status
2. Review logs in Render dashboard
3. Contact Render support if issues persist

---

*Last Updated: December 2024*