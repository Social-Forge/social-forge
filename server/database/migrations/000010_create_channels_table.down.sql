BEGIN;

DROP TRIGGER IF EXISTS update_channels_modtime ON channels;

DROP INDEX IF EXISTS idx_channels_name;
DROP INDEX IF EXISTS idx_channels_slug; 
DROP INDEX IF EXISTS idx_channels_is_active;
DROP INDEX IF EXISTS idx_channels_created_at;
DROP INDEX IF EXISTS idx_channels_updated_at;
DROP INDEX IF EXISTS idx_channels_deleted_at;

DROP TABLE IF EXISTS channels;

COMMIT;