BEGIN;

DROP TRIGGER IF EXISTS update_tokens_modtime ON tokens;

DROP FUNCTION IF EXISTS update_tokens_modtime();

DROP INDEX IF EXISTS idx_tokens_user_id;
DROP INDEX IF EXISTS idx_tokens_token;
DROP INDEX IF EXISTS idx_tokens_created_at;
DROP INDEX IF EXISTS idx_tokens_updated_at;
DROP INDEX IF EXISTS idx_tokens_type;

DROP TABLE IF EXISTS tokens;

COMMIT;