CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_type VARCHAR(255) NOT NULL CHECK (sender_type IN ('agent', 'contact', 'system', 'bot')),
  sender_id UUID  -- user_id if agent, contact_id if contact
  message_type VARCHAR(255) NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'document', 'reaction', 'sticker', 'interactive', 'template', 'list', 'link')),
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(255),
  media_size BIGINT,
  thumbnail_url TEXT,
  channel_message_id VARCHAR(255), -- Original message ID from channel
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- ID of message being replied to
  status VARCHAR(255) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB, -- Additional message metadata (e.g., quick replies, buttons)
  search_vector TSVector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_sender_type_sender_id ON messages(sender_type, sender_id);
CREATE INDEX idx_messages_channel_message_id ON messages(channel_message_id);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_delivered_at ON messages(delivered_at);
CREATE INDEX idx_messages_read_at ON messages(read_at);
CREATE INDEX idx_messages_failed_at ON messages(failed_at);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_updated_at ON messages(updated_at);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);


CREATE TRIGGER update_messages_modtime
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


CREATE OR REPLACE FUNCTION messages_search_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.sender_id::text, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.media_url, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.thumbnail_url, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.channel_message_id, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.error_message, '')), 'C');
        setweight(to_tsvector('english', COALESCE(NEW.meta_description, '')), 'C') ||
        -- Perbaikan: Menggunakan array_to_string untuk array TEXT[]
        setweight(to_tsvector('english', array_to_string(NEW.meta_keywords, ' ')), 'C');
    PERFORM pg_notify('refresh_search_view', ''); -- Notifikasi pg_notify
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION messages_search_update();

-- Improve text search configuration (should be separate migration if using migration system)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'english'
    ) THEN
        ALTER TEXT SEARCH CONFIGURATION english
        ALTER MAPPING FOR hword, hword_part, word
        WITH english_stem;
    END IF;
END $$;
