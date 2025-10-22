BEGIN;

CREATE MATERIALIZED VIEW messages_search_view AS
SELECT
    m.id,
    m.tenant_id,
    m.sender_id,
    m.content,
    m.media_url,
    m.thumbnail_url,
    m.status,
    m.created_at, -- Tambahkan kolom yang hilang
    m.updated_at, -- Tambahkan kolom yang hilang
    m.slug,
    m.meta_keywords,
    setweight(to_tsvector('english', COALESCE(m.sender_id, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(m.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(p.media_url, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(p.thumbnail_url, '')), 'C') AS full_search_vector
FROM messages m 
WHERE m.deleted_at IS NULL;

CREATE UNIQUE INDEX uq_messages_search_view_id ON messages_search_view(id); -- Wajib jika CONCURRENTLY digunakan
CREATE INDEX idx_messages_search_view_gin ON messages_search_view USING GIN (full_search_vector);
CREATE INDEX idx_messages_search_view_tenant_id ON messages_search_view(tenant_id);


CREATE OR REPLACE FUNCTION refresh_messages_search_view() RETURNS void AS $$
BEGIN
    -- CONCURRENTLY membutuhkan UNIQUE index pada kolom
    REFRESH MATERIALIZED VIEW CONCURRENTLY messages_search_view; 
END;
$$ LANGUAGE plpgsql;