BEGIN;

DROP TRIGGER IF EXISTS update_contacts_modtime ON contacts;
DROP TRIGGER IF EXISTS tsvector_update ON contacts;
DROP TRIGGER IF EXISTS refresh_contact_summaries ON contacts;
DROP TRIGGER IF EXISTS refresh_contact_materialized_views ON contacts;

DROP FUNCTION IF EXISTS update_contacts_modtime;
DROP FUNCTION IF EXISTS contact_search_update;
DROP FUNCTION IF EXISTS refresh_contact_summaries;
DROP FUNCTION IF EXISTS refresh_contact_materialized_views;

DROP MATERIALIZED VIEW IF EXISTS mv_contact_summaries;
DROP MATERIALIZED VIEW IF EXISTS mv_contact_search;
DROP MATERIALIZED VIEW IF EXISTS mv_recent_contacts;
DROP MATERIALIZED VIEW IF EXISTS mv_contact_tags_analytics;


DROP INDEX IF EXISTS idx_contacts_tenant_id;
DROP INDEX IF EXISTS idx_contacts_channel_id;
DROP INDEX IF EXISTS idx_contacts_channel_user_id;
DROP INDEX IF EXISTS idx_contacts_unique_non_null_phone;
DROP INDEX IF EXISTS idx_contacts_unique_non_null_email;
DROP INDEX IF EXISTS idx_contacts_is_active;
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_updated_at;
DROP INDEX IF EXISTS idx_contacts_deleted_at;

DROP INDEX IF EXISTS idx_mv_contact_summaries_pk;
DROP INDEX IF EXISTS idx_mv_contact_summaries_tenant;
DROP INDEX IF EXISTS idx_mv_contact_summaries_channel;
DROP INDEX IF EXISTS idx_mv_contact_summaries_active;

DROP INDEX IF EXISTS idx_mv_contact_search_pk;
DROP INDEX IF EXISTS idx_mv_contact_search_tenant;
DROP INDEX IF EXISTS idx_mv_contact_search_vector;
DROP INDEX IF EXISTS idx_mv_contact_search_tags;
DROP INDEX IF EXISTS idx_mv_contact_search_name;
DROP INDEX IF EXISTS idx_mv_contact_search_email;
DROP INDEX IF EXISTS idx_mv_contact_search_phone;

DROP INDEX IF EXISTS idx_mv_recent_contacts_pk;
DROP INDEX IF EXISTS idx_mv_recent_contacts_tenant;
DROP INDEX IF EXISTS idx_mv_recent_contacts_last_contact;
DROP INDEX IF EXISTS idx_mv_recent_contacts_days_since;

DROP INDEX IF EXISTS idx_mv_contact_tags_pk;
DROP INDEX IF EXISTS idx_mv_contact_tags_tag;
DROP INDEX IF EXISTS idx_mv_contact_tags_active;
DROP INDEX IF EXISTS idx_mv_contact_tags_blocked;

-- ALTER TABLE contacts DROP CONSTRAINT IF EXISTS chk_contact_tenant_id_channel_id_channel_user_id;
-- ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_name_length_check;
-- ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_format_check;

DROP TABLE IF EXISTS contacts CASCADE;

COMMENT ON TABLE contacts IS 'Customer/contact information';

COMMIT;