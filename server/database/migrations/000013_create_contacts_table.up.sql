CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'unknown',
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  channel_user_id VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  label_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_contact_at TIMESTAMPTZ,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_contact_tenant_id_channel_id_channel_user_id UNIQUE (tenant_id, channel_id, channel_user_id),
  CONSTRAINT contacts_name_length_check 
    CHECK (length(trim(name)) > 0),
  CONSTRAINT contacts_email_format_check 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_channel_id ON contacts(channel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_channel_user_id ON contacts(channel_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_contacts_is_active ON contacts(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_is_blocked ON contacts(is_blocked) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_created_at ON contacts(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_updated_at ON contacts(updated_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_contacts_search_vector ON contacts USING GIN(search_vector);
CREATE INDEX idx_contacts_active_tenant ON contacts(tenant_id) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_at) WHERE deleted_at IS NULL AND last_contact_at IS NOT NULL;
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_label_ids ON contacts USING GIN(label_ids) WHERE deleted_at IS NULL;

CREATE TRIGGER update_contacts_modtime
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE FUNCTION contacts_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contacts_search_update
    BEFORE INSERT OR UPDATE OF name, email, phone, tags ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION contacts_search_update();

CREATE OR REPLACE MATERIALIZED VIEW mv_contact_summaries AS
SELECT 
    tenant_id,
    channel_id,
    COUNT(*) as total_contacts,
    COUNT(*) FILTER (WHERE is_active = true) as active_contacts,
    COUNT(*) FILTER (WHERE is_blocked = true) as blocked_contacts,
    COUNT(*) FILTER (WHERE last_contact_at >= NOW() - INTERVAL '30 days') as recent_contacts,
    COUNT(*) FILTER (WHERE email IS NOT NULL) as contacts_with_email,
    COUNT(*) FILTER (WHERE phone IS NOT NULL) as contacts_with_phone,
    AVG(EXTRACT(EPOCH FROM (NOW() - last_contact_at))/86400) FILTER (WHERE last_contact_at IS NOT NULL) as avg_days_since_contact,
    MAX(last_contact_at) as latest_contact,
    MIN(created_at) as oldest_contact
FROM contacts
WHERE deleted_at IS NULL
GROUP BY tenant_id, channel_id;

CREATE UNIQUE INDEX idx_mv_contact_summaries_pk ON mv_contact_summaries (tenant_id, channel_id);
CREATE INDEX idx_mv_contact_summaries_tenant ON mv_contact_summaries (tenant_id);
CREATE INDEX idx_mv_contact_summaries_channel ON mv_contact_summaries (channel_id);
CREATE INDEX idx_mv_contact_summaries_active ON mv_contact_summaries (tenant_id, channel_id, active_contacts);

CREATE OR REPLACE FUNCTION refresh_contact_summaries()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_summaries;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE MATERIALIZED VIEW mv_contact_search AS
SELECT 
    c.id,
    c.tenant_id,
    c.channel_id,
    c.name,
    c.email,
    c.phone,
    c.avatar_url,
    c.is_blocked,
    c.is_active,
    c.last_contact_at,
    c.tags,
    c.label_ids,
    c.created_at,
    c.search_vector,
    -- Denormalized channel info jika ada
    ch.name as channel_name,
    ch.type as channel_type
FROM contacts c
LEFT JOIN channels ch ON c.channel_id = ch.id
WHERE c.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_contact_search_pk ON mv_contact_search (id);
CREATE INDEX idx_mv_contact_search_tenant ON mv_contact_search (tenant_id);
CREATE INDEX idx_mv_contact_search_vector ON mv_contact_search USING GIN(search_vector);
CREATE INDEX idx_mv_contact_search_tags ON mv_contact_search USING GIN(tags);
CREATE INDEX idx_mv_contact_search_name ON mv_contact_search (name);
CREATE INDEX idx_mv_contact_search_email ON mv_contact_search (email);
CREATE INDEX idx_mv_contact_search_phone ON mv_contact_search (phone);

CREATE MATERIALIZED VIEW mv_recent_contacts AS
SELECT 
    c.*,
    ch.name as channel_name,
    EXTRACT(EPOCH FROM (NOW() - c.last_contact_at))/86400 as days_since_contact
FROM contacts c
LEFT JOIN channels ch ON c.channel_id = ch.id
WHERE c.deleted_at IS NULL 
  AND c.last_contact_at >= NOW() - INTERVAL '90 days'
  AND c.is_active = true;

CREATE UNIQUE INDEX idx_mv_recent_contacts_pk ON mv_recent_contacts (id);
CREATE INDEX idx_mv_recent_contacts_tenant ON mv_recent_contacts (tenant_id);
CREATE INDEX idx_mv_recent_contacts_last_contact ON mv_recent_contacts (last_contact_at DESC);
CREATE INDEX idx_mv_recent_contacts_days_since ON mv_recent_contacts (days_since_contact);

CREATE MATERIALIZED VIEW mv_contact_tags_analytics AS
SELECT 
    tenant_id,
    channel_id,
    UNNEST(tags) as tag,
    COUNT(*) as contact_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(*) FILTER (WHERE is_blocked = true) as blocked_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - last_contact_at))/86400) FILTER (WHERE last_contact_at IS NOT NULL) as avg_days_since_contact
FROM contacts
WHERE deleted_at IS NULL AND tags != '{}'
GROUP BY tenant_id, channel_id, UNNEST(tags);

CREATE UNIQUE INDEX idx_mv_contact_tags_pk ON mv_contact_tags_analytics (tenant_id, channel_id, tag);
CREATE INDEX idx_mv_contact_tags_tag ON mv_contact_tags_analytics (tag);
CREATE INDEX idx_mv_contact_tags_active ON mv_contact_tags_analytics (tenant_id, channel_id, active_count);
CREATE INDEX idx_mv_contact_tags_blocked ON mv_contact_tags_analytics (tenant_id, channel_id, blocked_count);

-- Trigger untuk auto-refresh pada contacts changes
CREATE OR REPLACE FUNCTION refresh_contact_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh secara asynchronous
    PERFORM pg_notify('refresh_materialized_views', 'contacts_updated');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_contact_mvs
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_contact_materialized_views();

-- Background worker untuk refresh (gunakan pg_cron jika available)

-- Schedule periodic refresh
SELECT cron.schedule('refresh-contact-summaries', '*/5 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_summaries');
    
SELECT cron.schedule('refresh-contact-search', '*/10 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_search');
    
SELECT cron.schedule('refresh-recent-contacts', '*/15 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_contacts');
    
SELECT cron.schedule('refresh-contact-tags', '*/30 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_tags_analytics');

-- ✅ Comments untuk documentation
COMMENT ON TABLE contacts IS 'Stores customer/contact information across multiple channels';
COMMENT ON COLUMN contacts.tenant_id IS 'Multi-tenant isolation';
COMMENT ON COLUMN contacts.channel_user_id IS 'User ID in the external channel (WhatsApp, Telegram, etc)';
COMMENT ON COLUMN contacts.metadata IS 'Flexible storage for channel-specific data';
COMMENT ON COLUMN contacts.label_ids IS 'References to labels/categories';
COMMENT ON COLUMN contacts.search_vector IS 'Full-text search index for quick searching';