BEGIN;

DROP TRIGGER IF EXISTS update_pages_modtime ON pages;
DROP TRIGGER IF EXISTS trigger_pages_manage_published ON pages;
DROP TRIGGER IF EXISTS trigger_pages_search_update ON pages;
DROP TRIGGER IF EXISTS trigger_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS trigger_refresh_page_mvs ON pages;

DROP FUNCTION IF EXISTS update_pages_modtime();
DROP FUNCTION IF EXISTS pages_manage_published();
DROP FUNCTION IF EXISTS pages_search_update();
DROP FUNCTION IF EXISTS refresh_page_materialized_views();

DROP MATERIALIZED VIEW IF EXISTS mv_published_pages;
DROP MATERIALIZED VIEW IF EXISTS mv_page_analytics;
DROP MATERIALIZED VIEW IF EXISTS mv_sitemap_pages;
DROP MATERIALIZED VIEW IF EXISTS mv_page_management;

DROP INDEX IF EXISTS idx_pages_tenant_active;
DROP INDEX IF EXISTS idx_pages_division_active;
DROP INDEX IF EXISTS idx_pages_status_published;
DROP INDEX IF EXISTS idx_pages_slug_active;
DROP INDEX IF EXISTS idx_pages_published_at;
DROP INDEX IF EXISTS idx_pages_view_count;
DROP INDEX IF EXISTS idx_pages_created_at_desc;
DROP INDEX IF EXISTS idx_pages_updated_at_desc;
DROP INDEX IF EXISTS idx_pages_deleted_at;
DROP INDEX IF EXISTS idx_pages_search_vector;
DROP INDEX IF EXISTS idx_pages_search_published;
DROP INDEX IF EXISTS idx_pages_tenant_published;
DROP INDEX IF EXISTS idx_pages_tenant_status;
DROP INDEX IF EXISTS idx_pages_featured;
DROP INDEX IF EXISTS idx_pages_meta_keywords;
DROP INDEX IF EXISTS idx_pages_article_tags;
DROP INDEX IF EXISTS idx_mv_published_pages_pk;
DROP INDEX IF EXISTS idx_mv_published_pages_tenant;
DROP INDEX IF EXISTS idx_mv_published_pages_slug;
DROP INDEX IF EXISTS idx_mv_published_pages_search_vector;
DROP INDEX IF EXISTS idx_mv_published_pages_published_at;
DROP INDEX IF EXISTS idx_mv_published_pages_popularity;
DROP INDEX IF EXISTS idx_mv_published_pages_views;
DROP INDEX IF EXISTS idx_mv_page_analytics_pk;
DROP INDEX IF EXISTS idx_mv_page_analytics_tenant;
DROP INDEX IF EXISTS idx_mv_page_analytics_date;
DROP INDEX IF EXISTS idx_mv_sitemap_pages_pk;
DROP INDEX IF EXISTS idx_mv_sitemap_pages_tenant;
DROP INDEX IF EXISTS idx_mv_sitemap_pages_priority;
DROP INDEX IF EXISTS idx_mv_page_management_pk;
DROP INDEX IF EXISTS idx_mv_page_management_tenant;
DROP INDEX IF EXISTS idx_mv_page_management_status;
DROP INDEX IF EXISTS idx_mv_page_management_readiness;

-- ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_tenant_id_slug;
-- ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_status;
-- ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_slug_format;
-- ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_view_count;
-- ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_reading_time_minutes;

DROP TABLE IF EXISTS pages CASCADE;

COMMIT;