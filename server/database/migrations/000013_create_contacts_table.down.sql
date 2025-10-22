BEGIN;

DROP TRIGGER IF EXISTS update_contacts_modtime ON contacts;

DROP INDEX IF EXISTS idx_contacts_tenant_id;
DROP INDEX IF EXISTS idx_contacts_channel_id;
DROP INDEX IF EXISTS idx_contacts_channel_user_id;
DROP INDEX IF EXISTS idx_contacts_phone;
DROP INDEX IF EXISTS idx_contacts_email;
DROP INDEX IF EXISTS idx_contacts_is_active;
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_updated_at;
DROP INDEX IF EXISTS idx_contacts_deleted_at;

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS chk_contact_tenant_id_channel_id_channel_user_id;

DROP TABLE IF EXISTS contacts CASCADE;

COMMENT ON TABLE contacts IS 'Customer/contact information';

COMMIT;