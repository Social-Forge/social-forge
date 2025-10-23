CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[] DEFAULT '{}',
  meta_image_url VARCHAR(255),
  meta_og_title VARCHAR(255),
  meta_og_description TEXT,
  meta_og_image_url TEXT,
  meta_og_type VARCHAR(255) DEFAULT 'website',
  meta_og_url TEXT,
  meta_og_site_name VARCHAR(255),
  meta_twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  meta_twitter_title VARCHAR(255),
  meta_twitter_description TEXT,
  meta_twitter_image_url TEXT,
  meta_article_published_time TIMESTAMPTZ,
  meta_article_modified_time TIMESTAMPTZ,
  meta_article_author TEXT[] DEFAULT '{}',
  meta_article_section VARCHAR(255),
  meta_article_tags TEXT[] DEFAULT '{}',
  template VARCHAR(255),
  theme_config JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  view_count BIGINT NOT NULL DEFAULT 0,
  featured_image_url TEXT,
  reading_time_minutes INT DEFAULT 1,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_pages_tenant_id_slug UNIQUE (tenant_id, slug),
  CONSTRAINT chk_pages_status CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT chk_pages_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT chk_pages_view_count CHECK (view_count >= 0),
  CONSTRAINT chk_pages_reading_time_minutes CHECK (reading_time_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pages_tenant_active ON pages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_division_active ON pages(division_id) WHERE deleted_at IS NULL AND division_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pages_status_published ON pages(status) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_slug_active ON pages(tenant_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_published_at ON pages(published_at DESC) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_view_count ON pages(view_count DESC) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_created_at_desc ON pages(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_updated_at_desc ON pages(updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_pages_search_vector ON pages USING GIN(search_vector) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_search_published ON pages USING GIN(search_vector) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_tenant_published ON pages(tenant_id, published_at DESC) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_tenant_status ON pages(tenant_id, status, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_featured ON pages(tenant_id, view_count DESC, published_at DESC) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_meta_keywords ON pages USING GIN(meta_keywords) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_article_tags ON pages USING GIN(meta_article_tags) WHERE deleted_at IS NULL AND is_published = true;

CREATE OR REPLACE FUNCTION update_pages_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_pages_modtime
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_pages_modtime();

CREATE OR REPLACE FUNCTION pages_manage_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_published dan published_at
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.is_published := TRUE;
    NEW.published_at := COALESCE(NEW.published_at, NOW());
  ELSIF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.is_published := FALSE;
    NEW.published_at := NULL;
  END IF;
  
  -- Auto-set meta jika kosong
  IF NEW.meta_title IS NULL AND NEW.title IS NOT NULL THEN
    NEW.meta_title := NEW.title;
  END IF;
  
  IF NEW.meta_description IS NULL AND NEW.description IS NOT NULL THEN
    NEW.meta_description := NEW.description;
  END IF;
  
  -- Auto-calculate reading time
  IF NEW.content IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.content IS DISTINCT FROM NEW.content) THEN
    NEW.reading_time_minutes := GREATEST(1, ceil(length(NEW.content) / 1000)); -- ~1000 chars per minute
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_pages_manage_published
BEFORE INSERT OR UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION pages_manage_published();

CREATE OR REPLACE FUNCTION pages_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.meta_title, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.meta_description, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(COALESCE(NEW.meta_keywords, '{}'), ' ')), 'C') ||
        setweight(to_tsvector('english', array_to_string(COALESCE(NEW.meta_article_tags, '{}'), ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_pages_search_update
BEFORE INSERT OR UPDATE OF title, description, content, meta_title, meta_description, meta_keywords, meta_article_tags ON pages
FOR EACH ROW
EXECUTE FUNCTION pages_search_update();

CREATE OR REPLACE TRIGGER trigger_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE MATERIALIZED VIEW mv_published_pages AS
SELECT 
    p.id,
    p.tenant_id,
    p.division_id,
    p.title,
    p.slug,
    p.description,
    p.content,
    p.meta_title,
    p.meta_description,
    p.meta_keywords,
    p.meta_image_url,
    p.meta_og_title,
    p.meta_og_description,
    p.meta_og_image_url,
    p.meta_twitter_title,
    p.meta_twitter_description,
    p.meta_twitter_image_url,
    p.featured_image_url,
    p.published_at,
    p.view_count,
    p.reading_time_minutes,
    p.search_vector,
    p.created_at,
    p.updated_at,
    -- Denormalized data
    t.name as tenant_name,
    d.name as division_name,
    -- SEO scores (calculated)
    CASE 
        WHEN length(COALESCE(p.meta_title, '')) > 0 AND length(COALESCE(p.meta_description, '')) > 0 THEN 'high'
        WHEN length(COALESCE(p.meta_title, '')) > 0 OR length(COALESCE(p.meta_description, '')) > 0 THEN 'medium'
        ELSE 'low'
    END as seo_score,
    -- Popularity score
    (p.view_count * 0.6 + EXTRACT(EPOCH FROM (NOW() - p.published_at))/86400 * 0.4) as popularity_score
FROM pages p
JOIN tenants t ON p.tenant_id = t.id AND t.is_active
LEFT JOIN divisions d ON p.division_id = d.id AND d.is_active
WHERE NOT p.deleted_at IS NULL 
  AND p.is_published = true
  AND p.published_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_published_pages_pk ON mv_published_pages (id);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_tenant ON mv_published_pages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_slug ON mv_published_pages (tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_search ON mv_published_pages USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_published ON mv_published_pages (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_popularity ON mv_published_pages (popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_mv_published_pages_views ON mv_published_pages (view_count DESC);

CREATE MATERIALIZED VIEW mv_page_analytics AS
SELECT 
    p.tenant_id,
    p.division_id,
    DATE(p.published_at) as publish_date,
    -- Content metrics
    COUNT(*) as total_pages,
    COUNT(*) FILTER (WHERE p.view_count > 0) as viewed_pages,
    SUM(p.view_count) as total_views,
    AVG(p.view_count) as avg_views_per_page,
    MAX(p.view_count) as max_views,
    -- SEO metrics
    COUNT(*) FILTER (WHERE p.meta_title IS NOT NULL) as pages_with_meta_title,
    COUNT(*) FILTER (WHERE p.meta_description IS NOT NULL) as pages_with_meta_desc,
    COUNT(*) FILTER (WHERE p.meta_keywords != '{}') as pages_with_keywords,
    COUNT(*) FILTER (WHERE p.featured_image_url IS NOT NULL) as pages_with_featured_image,
    -- Content quality
    AVG(length(COALESCE(p.content, ''))) as avg_content_length,
    AVG(p.reading_time_minutes) as avg_reading_time,
    -- Recent performance
    COUNT(*) FILTER (WHERE p.published_at >= NOW() - INTERVAL '30 days') as pages_last_30_days,
    SUM(p.view_count) FILTER (WHERE p.published_at >= NOW() - INTERVAL '30 days') as views_last_30_days
FROM pages p
WHERE NOT p.deleted_at IS NULL 
  AND p.is_published = true
  AND p.published_at IS NOT NULL
GROUP BY p.tenant_id, p.division_id, DATE(p.published_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_page_analytics_pk ON mv_page_analytics (tenant_id, division_id, publish_date);
CREATE INDEX IF NOT EXISTS idx_mv_page_analytics_tenant ON mv_page_analytics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_page_analytics_date ON mv_page_analytics (publish_date DESC);

CREATE MATERIALIZED VIEW mv_sitemap_pages AS
SELECT 
    p.id,
    p.tenant_id,
    p.slug,
    p.published_at,
    p.updated_at,
    p.meta_og_type as page_type,
    -- Priority calculation based on views and recency
    CASE 
        WHEN p.view_count > 1000 THEN 1.0
        WHEN p.view_count > 100 THEN 0.8
        WHEN p.view_count > 10 THEN 0.6
        ELSE 0.4
    END as sitemap_priority,
    -- Change frequency estimation
    CASE 
        WHEN p.updated_at >= NOW() - INTERVAL '1 day' THEN 'daily'
        WHEN p.updated_at >= NOW() - INTERVAL '1 week' THEN 'weekly'
        WHEN p.updated_at >= NOW() - INTERVAL '1 month' THEN 'monthly'
        ELSE 'yearly'
    END as change_frequency
FROM pages p
WHERE NOT p.deleted_at IS NULL 
  AND p.is_published = true
  AND p.published_at IS NOT NULL
ORDER BY p.published_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sitemap_pages_pk ON mv_sitemap_pages (id);
CREATE INDEX IF NOT EXISTS idx_mv_sitemap_pages_tenant ON mv_sitemap_pages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_sitemap_pages_priority ON mv_sitemap_pages (sitemap_priority DESC);

CREATE MATERIALIZED VIEW mv_page_management AS
SELECT 
    p.id,
    p.tenant_id,
    p.division_id,
    p.title,
    p.slug,
    p.status,
    p.is_published,
    p.view_count,
    p.published_at,
    p.updated_at,
    p.created_at,
    -- Management metrics
    CASE 
        WHEN p.status = 'published' AND p.view_count = 0 THEN 'published_no_views'
        WHEN p.status = 'published' AND p.view_count > 0 THEN 'published_with_views'
        WHEN p.status = 'draft' THEN 'draft'
        WHEN p.status = 'archived' THEN 'archived'
    END as management_status,
    -- Content readiness
    CASE 
        WHEN p.content IS NULL THEN 'missing_content'
        WHEN p.meta_title IS NULL THEN 'missing_meta_title'
        WHEN p.meta_description IS NULL THEN 'missing_meta_desc'
        WHEN p.featured_image_url IS NULL THEN 'missing_image'
        ELSE 'ready'
    END as content_readiness,
    -- Age analysis
    EXTRACT(DAYS FROM NOW() - p.created_at) as days_since_creation,
    EXTRACT(DAYS FROM NOW() - COALESCE(p.updated_at, p.created_at)) as days_since_update
FROM pages p
WHERE NOT p.deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_page_management_pk ON mv_page_management (id);
CREATE INDEX IF NOT EXISTS idx_mv_page_management_tenant ON mv_page_management (tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_page_management_status ON mv_page_management (management_status);
CREATE INDEX IF NOT EXISTS idx_mv_page_management_readiness ON mv_page_management (content_readiness);

CREATE OR REPLACE FUNCTION refresh_page_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('refresh_page_views', 'pages_updated');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_refresh_page_mvs
    AFTER INSERT OR UPDATE OR DELETE ON pages
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_page_materialized_views();

-- Scheduled refresh
-- SELECT cron.schedule('refresh-published-pages', '*/3 * * * *', 
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_published_pages');
    
-- SELECT cron.schedule('refresh-page-analytics', '0 */6 * * *', 
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_page_analytics');
    
-- SELECT cron.schedule('refresh-sitemap-pages', '0 2 * * *', 
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sitemap_pages');
    
-- SELECT cron.schedule('refresh-page-management', '0 3 * * *', 
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_page_management');