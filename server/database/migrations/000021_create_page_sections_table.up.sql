CREATE TABLE IF NOT EXISTS page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    content JSONB NOT NULL,
    style_config JSONB,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_name ON page_sections(name);
CREATE INDEX IF NOT EXISTS idx_page_sections_type ON page_sections(type);
CREATE INDEX IF NOT EXISTS idx_page_sections_order_index ON page_sections(order_index);
CREATE INDEX IF NOT EXISTS idx_page_sections_is_visible ON page_sections(is_visible);   
CREATE INDEX IF NOT EXISTS idx_page_sections_created_at ON page_sections(created_at);
CREATE INDEX IF NOT EXISTS idx_page_sections_updated_at ON page_sections(updated_at);
CREATE INDEX IF NOT EXISTS idx_page_sections_deleted_at ON page_sections(deleted_at);

CREATE OR REPLACE FUNCTION update_page_sections_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_page_sections_modtime
BEFORE UPDATE ON page_sections
FOR EACH ROW
EXECUTE FUNCTION update_page_sections_modtime();
