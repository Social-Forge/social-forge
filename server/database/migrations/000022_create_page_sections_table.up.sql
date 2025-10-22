CREATE TABLE page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    content JSONB NOT NULL,
    style_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_page_sections_tenant_id ON page_sections(tenant_id);
CREATE INDEX idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX idx_page_sections_created_at ON page_sections(created_at);
CREATE INDEX idx_page_sections_updated_at ON page_sections(updated_at);
CREATE INDEX idx_page_sections_deleted_at ON page_sections(deleted_at);

CREATE OR REPLACE TRIGGER update_page_sections_modtime
BEFORE UPDATE ON page_sections
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();