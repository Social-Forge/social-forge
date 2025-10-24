CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'email_verification' CHECK (type IN ('reset_password', 'email_verification')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens (token) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens (created_at);
CREATE INDEX IF NOT EXISTS idx_tokens_updated_at ON tokens (updated_at);
CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens (type);

CREATE OR REPLACE FUNCTION update_tokens_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_tokens_modtime
BEFORE UPDATE ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_tokens_modtime();
