CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_type VARCHAR(255) NOT NULL DEFAULT 'system',
  sender_id UUID  -- user_id if agent, contact_id if contact
  message_type VARCHAR(255) NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(255),
  media_size BIGINT,
  thumbnail_url TEXT,
  channel_message_id VARCHAR(1000), -- Original message ID from channel
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- ID of message being replied to
  status VARCHAR(255) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional message metadata (e.g., quick replies, buttons)
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_messages_sender_type CHECK (sender_type IN ('agent', 'contact', 'system', 'bot')),
  CONSTRAINT chk_messages_message_type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'document', 'reaction', 'sticker', 'interactive', 'template', 'list', 'link')),
  CONSTRAINT chk_messages_status CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  CONSTRAINT chk_message_content CHECK (
    (message_type = 'text' AND content IS NOT NULL) OR 
    (message_type IN ('image','video','audio','file') AND media_url IS NOT NULL) OR
    (message_type NOT IN ('text','image','video','audio','file'))
  ),
  CONSTRAINT chk_sender_reference CHECK (
    (sender_type IN ('agent','contact') AND sender_id IS NOT NULL) OR
    (sender_type IN ('system','bot') AND sender_id IS NULL)
  )
);

CREATE INDEX idx_messages_conversation_active ON messages(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_tenant_active ON messages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender_active ON messages(sender_type, sender_id) WHERE deleted_at IS NULL AND sender_id IS NOT NULL;
CREATE INDEX idx_messages_channel_msg_id ON messages(channel_message_id) WHERE deleted_at IS NULL AND channel_message_id IS NOT NULL;
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE deleted_at IS NULL AND reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_status_active ON messages(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sent_at_desc ON messages(sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_delivered_active ON messages(delivered_at) WHERE deleted_at IS NULL AND delivered_at IS NOT NULL;
CREATE INDEX idx_messages_read_active ON messages(read_at) WHERE deleted_at IS NULL AND read_at IS NOT NULL;
CREATE INDEX idx_messages_failed_active ON messages(failed_at) WHERE deleted_at IS NULL AND failed_at IS NOT NULL;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_updated_at ON messages(updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_messages_conversation_sent ON messages(conversation_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_search_vector ON messages USING GIN(search_vector) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sent_at_brin ON messages USING BRIN(sent_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_tenant_conversation ON messages(tenant_id, conversation_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_tenant_status ON messages(tenant_id, status, sent_at DESC) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_messages_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_modtime
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_modtime();

CREATE OR REPLACE FUNCTION messages_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.media_url, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.error_message, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_messages_search_update
BEFORE INSERT OR UPDATE OF content, media_url, error_message ON messages
FOR EACH ROW
EXECUTE FUNCTION messages_search_update();

CREATE MATERIALIZED VIEW mv_conversation_threads AS
SELECT 
    m.id,
    m.conversation_id,
    m.tenant_id,
    m.sender_type,
    m.sender_id,
    m.message_type,
    m.content,
    m.media_url,
    m.media_type,
    m.status,
    m.sent_at,
    m.reply_to_id,
    m.metadata,
    -- Denormalized data untuk performance
    c.contact_id,
    c.subject as conversation_subject,
    cont.name as contact_name,
    u.name as agent_name,
    -- Analytics fields
    LAG(m.id) OVER (PARTITION BY m.conversation_id ORDER BY m.sent_at) as prev_message_id,
    LEAD(m.id) OVER (PARTITION BY m.conversation_id ORDER BY m.sent_at) as next_message_id,
    COUNT(*) OVER (PARTITION BY m.conversation_id) as message_count_in_convo
FROM messages m
JOIN conversations c ON m.conversation_id = c.id AND NOT c.deleted_at IS NULL
LEFT JOIN contacts cont ON m.sender_type = 'contact' AND m.sender_id = cont.id AND NOT cont.deleted_at IS NULL
LEFT JOIN users u ON m.sender_type = 'agent' AND m.sender_id = u.id AND u.is_active AND NOT u.deleted_at IS NULL
WHERE NOT m.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_conversation_threads_pk ON mv_conversation_threads (id);
CREATE INDEX idx_mv_conversation_threads_conversation_id ON mv_conversation_threads (conversation_id, sent_at DESC);
CREATE INDEX idx_mv_conversation_threads_tenant ON mv_conversation_threads (tenant_id);
CREATE INDEX idx_mv_conversation_threads_sender ON mv_conversation_threads (sender_type, sender_id);
CREATE INDEX idx_mv_conversation_threads_sent_at ON mv_conversation_threads (sent_at DESC);

CREATE MATERIALIZED VIEW mv_message_analytics AS
SELECT 
    tenant_id,
    DATE(sent_at) as message_date,
    sender_type,
    message_type,
    status,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE message_type = 'text') as text_messages,
    COUNT(*) FILTER (WHERE message_type IN ('image','video','audio','file')) as media_messages,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE status = 'read') as read_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    AVG(LENGTH(content)) FILTER (WHERE message_type = 'text') as avg_text_length,
    COUNT(DISTINCT conversation_id) as unique_conversations,
    COUNT(DISTINCT sender_id) FILTER (WHERE sender_type = 'contact') as unique_contacts,
    COUNT(DISTINCT sender_id) FILTER (WHERE sender_type = 'agent') as unique_agents
FROM messages
WHERE NOT deleted_at IS NULL 
  AND sent_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY tenant_id, DATE(sent_at), sender_type, message_type, status;

CREATE UNIQUE INDEX idx_mv_message_analytics_pk ON mv_message_analytics (tenant_id, message_date, sender_type, message_type, status);
CREATE INDEX idx_mv_message_analytics_date ON mv_message_analytics (message_date DESC);
CREATE INDEX idx_mv_message_analytics_tenant ON mv_message_analytics (tenant_id);

CREATE MATERIALIZED VIEW mv_recent_messages AS
SELECT 
    m.*,
    c.contact_id,
    cont.name as contact_name,
    cont.avatar_url as contact_avatar,
    u.name as agent_name,
    u.avatar_url as agent_avatar,
    conv.subject as conversation_subject,
    EXTRACT(EPOCH FROM (NOW() - m.sent_at)) as seconds_ago
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id AND NOT conv.deleted_at IS NULL
LEFT JOIN contacts cont ON m.sender_type = 'contact' AND m.sender_id = cont.id AND NOT cont.deleted_at IS NULL
LEFT JOIN users u ON m.sender_type = 'agent' AND m.sender_id = u.id AND u.is_active AND NOT u.deleted_at IS NULL
WHERE NOT m.deleted_at IS NULL
  AND m.sent_at >= NOW() - INTERVAL '7 days'
ORDER BY m.sent_at DESC;

CREATE UNIQUE INDEX idx_mv_recent_messages_pk ON mv_recent_messages (id);
CREATE INDEX idx_mv_recent_messages_tenant ON mv_recent_messages (tenant_id, sent_at DESC);
CREATE INDEX idx_mv_recent_messages_conversation ON mv_recent_messages (conversation_id, sent_at DESC);

CREATE MATERIALIZED VIEW mv_message_search AS
SELECT 
    m.id,
    m.tenant_id,
    m.conversation_id,
    m.sender_type,
    m.sender_id,
    m.message_type,
    m.content,
    m.media_url,
    m.sent_at,
    m.search_vector,
    -- Denormalized untuk search context
    cont.name as contact_name,
    u.name as agent_name,
    conv.subject as conversation_subject
FROM messages m
LEFT JOIN conversations conv ON m.conversation_id = conv.id AND NOT conv.deleted_at IS NULL
LEFT JOIN contacts cont ON m.sender_type = 'contact' AND m.sender_id = cont.id AND NOT cont.deleted_at IS NULL
LEFT JOIN users u ON m.sender_type = 'agent' AND m.sender_id = u.id AND u.is_active AND NOT u.deleted_at IS NULL
WHERE NOT m.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_message_search_pk ON mv_message_search (id);
CREATE INDEX idx_mv_message_search_vector ON mv_message_search USING GIN(search_vector);
CREATE INDEX idx_mv_message_search_tenant ON mv_message_search (tenant_id);
CREATE INDEX idx_mv_message_search_sent_at ON mv_message_search (sent_at DESC);
CREATE INDEX idx_mv_message_search_content ON mv_message_search USING GIN(to_tsvector('english', content));


CREATE OR REPLACE FUNCTION refresh_message_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Async refresh via background worker
    PERFORM pg_notify('refresh_message_views', 'messages_updated');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_refresh_message_mvs
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_message_materialized_views();

-- Manual refresh functions
CREATE OR REPLACE FUNCTION refresh_conversation_threads()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_threads;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_recent_messages()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_messages;
END;
$$ LANGUAGE plpgsql;

-- Scheduled refresh dengan pg_cron
SELECT cron.schedule('refresh-conversation-threads', '*/2 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_threads');
    
SELECT cron.schedule('refresh-recent-messages', '*/5 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_messages');
    
SELECT cron.schedule('refresh-message-analytics', '0 * * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_message_analytics');