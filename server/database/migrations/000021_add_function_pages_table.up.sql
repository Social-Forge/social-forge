BEGIN;
--------------------------------------------------------------------------------
-- 1. Full-Text Search Materialized View (pages_search_view)
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW pages_search_view AS
SELECT
    p.id,
    p.tenant_id,
    p.title,
    p.description,
    p.status,
    p.created_at, -- Tambahkan kolom yang hilang
    p.updated_at, -- Tambahkan kolom yang hilang
    p.slug,
    p.meta_keywords,
    setweight(to_tsvector('english', COALESCE(p.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(p.slug, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(p.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(p.meta_title, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(p.meta_description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(p.meta_keywords, ' ')), 'C') AS full_search_vector
FROM pages p
WHERE p.deleted_at IS NULL;

CREATE UNIQUE INDEX uq_pages_search_view_id ON pages_search_view(id); -- Wajib jika CONCURRENTLY digunakan
CREATE INDEX idx_pages_search_view_gin ON pages_search_view USING GIN (full_search_vector);
CREATE INDEX idx_pages_search_view_tenant_id ON pages_search_view(tenant_id);

-- Fungsi Refresh untuk Search View
CREATE OR REPLACE FUNCTION refresh_pages_search_view() RETURNS void AS $$
BEGIN
    -- CONCURRENTLY membutuhkan UNIQUE index pada kolom
    REFRESH MATERIALIZED VIEW CONCURRENTLY pages_search_view; 
END;
$$ LANGUAGE plpgsql;

CREATE MATERIALIZED VIEW pages_views_daily AS
SELECT
    date_trunc('day', created_at) as day, -- Gunakan created_at atau published_at
    SUM(view_count) as total_views, -- Ganti views menjadi view_count
    COUNT(id) as page_count
FROM pages
GROUP BY 1;

CREATE UNIQUE INDEX uq_pages_views_daily_day ON pages_views_daily(day);

CREATE OR REPLACE FUNCTION refresh_pages_views_daily()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY pages_views_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;