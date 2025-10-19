-- CapLiquify Multi-Tenant Database Migration
-- File: 001_create_public_schema.sql
-- Description: Creates public schema tables for multi-tenant SaaS
-- Date: October 19, 2025

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'suspended');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  schema_name VARCHAR(63) UNIQUE NOT NULL,
  clerk_organization_id VARCHAR(255) UNIQUE NOT NULL,

  -- Subscription
  subscription_tier subscription_tier NOT NULL,
  subscription_status subscription_status NOT NULL,
  trial_ends_at TIMESTAMP,
  subscription_starts_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,

  -- Limits based on tier
  max_users INTEGER,
  max_entities INTEGER,
  features JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tenants_clerk_org ON public.tenants(clerk_organization_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(subscription_status);

-- Comments
COMMENT ON TABLE public.tenants IS 'Master tenant registry for multi-tenant SaaS';
COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name for tenant data isolation';
COMMENT ON COLUMN public.tenants.features IS 'Feature flags JSON: {"ai_forecasting": true, "what_if": true}';

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),

  -- Tenant association
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL,

  -- Metadata
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Comments
COMMENT ON TABLE public.users IS 'User registry with tenant association';
COMMENT ON COLUMN public.users.clerk_user_id IS 'Clerk authentication user ID';

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Billing
  billing_cycle billing_cycle NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription tracking for tenants';
COMMENT ON COLUMN public.subscriptions.amount_cents IS 'Subscription amount in cents (to avoid floating point issues)';

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Event details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Comments
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for compliance and debugging';
COMMENT ON COLUMN public.audit_logs.action IS 'Event action: user.created, forecast.generated, api.connected, etc.';

-- ============================================================================
-- TRIGGERS - Auto-update updated_at timestamp
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS (adjust for your deployment environment)
-- ============================================================================

-- Grant permissions to application user (replace 'app_user' with your actual user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'users', 'subscriptions', 'audit_logs');

  IF table_count = 4 THEN
    RAISE NOTICE 'SUCCESS: All 4 public schema tables created';
  ELSE
    RAISE WARNING 'INCOMPLETE: Expected 4 tables, found %', table_count;
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
