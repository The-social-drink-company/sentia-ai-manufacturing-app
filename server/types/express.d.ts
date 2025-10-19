/**
 * Express type extensions for multi-tenant context
 *
 * @module server/types/express
 */

import { Tenant, UserRole } from './tenant.types'

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant
      tenantSchema?: string
      userRole?: UserRole
      organizationId?: string
      userId?: string
      readOnly?: boolean
    }
  }
}

export {}
