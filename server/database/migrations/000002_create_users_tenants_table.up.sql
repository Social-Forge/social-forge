CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subdomain VARCHAR(100) UNIQUE,
  logo_url VARCHAR(255),
  description TEXT,
  max_divisions INTEGER NOT NULL DEFAULT 10,
  max_agents INTEGER NOT NULL DEFAULT 10,
  max_quick_replies INTEGER NOT NULL DEFAULT 1000,
  max_pages INTEGER NOT NULL DEFAULT 20,
  max_whatsapp INTEGER NOT NULL DEFAULT 1,
  max_max_whatsapp_meta INTEGER NOT NULL DEFAULT 1,
  max_meta_messenger INTEGER NOT NULL DEFAULT 10,
  max_telegram INTEGER NOT NULL DEFAULT 10,
  max_webchat INTEGER NOT NULL DEFAULT 10,
  max_linkchat INTEGER NOT NULL DEFAULT 10,
  subscription_plan VARCHAR(255) NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status VARCHAR(255) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'canceled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_subscription_plan CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  CONSTRAINT chk_subscription_status CHECK (subscription_status IN ('active', 'suspended', 'canceled', 'expired'))

);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);   
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_updated_at ON tenants(updated_at);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);


CREATE TRIGGER update_tenants_modtime
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE tenants IS 'Multi-tenant organizations/companies';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN tenants.subscription_plan IS 'Subscription tier: free, starter, pro, enterprise';
COMMENT ON COLUMN tenants.subscription_status IS 'Subscription status: active, suspended, canceled, expired';