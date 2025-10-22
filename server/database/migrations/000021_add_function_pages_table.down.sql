BEGIN;

--------------------------------------------------------------------------------
-- 1. Jatuhkan Fungsi Refresh
--------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS refresh_pages_search_view();
DROP FUNCTION IF EXISTS refresh_pages_views_daily();

--------------------------------------------------------------------------------
-- 2. Jatuhkan Index dari Materialized View
--------------------------------------------------------------------------------

-- Index dari pages_search_view
DROP INDEX IF EXISTS uq_pages_search_view_id; 
DROP INDEX IF EXISTS idx_pages_search_view_gin;
DROP INDEX IF EXISTS idx_pages_search_view_tenant_id;

-- Index dari pages_views_daily
DROP INDEX IF EXISTS uq_pages_views_daily_day;

--------------------------------------------------------------------------------
-- 3. Jatuhkan Materialized View
--------------------------------------------------------------------------------

DROP MATERIALIZED VIEW IF EXISTS pages_search_view;
DROP MATERIALIZED VIEW IF EXISTS pages_views_daily;

COMMIT;