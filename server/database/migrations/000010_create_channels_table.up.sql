CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon_url VARCHAR(255),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_channels_name ON channels(name);
CREATE INDEX idx_channels_slug ON channels(slug); 
CREATE INDEX idx_channels_is_active ON channels(is_active);
CREATE INDEX idx_channels_created_at ON channels(created_at);
CREATE INDEX idx_channels_updated_at ON channels(updated_at);
CREATE INDEX idx_channels_deleted_at ON channels(deleted_at);

CREATE OR REPLACE FUNCTION update_channels_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_channels_modtime
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION update_channels_modtime();

COMMENT ON TABLE channels IS 'Available communication channels whatsapp, meta_whatsapp, meta_messenger, telegram, webchat, linkchat';