CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(255) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  meta_image_url VARCHAR(255),
  meta_og_title VARCHAR(255),
  meta_og_description TEXT,
  meta_og_image_url VARCHAR(255),
  meta_twitter_title VARCHAR(255),
  meta_twitter_description TEXT,
  meta_twitter_image_url VARCHAR(255),
  meta_og_type VARCHAR(255),
  meta_og_url VARCHAR(255),
  meta_og_site_name VARCHAR(255),
  meta_article_published_time TIMESTAMP WITH TIME ZONE,
  meta_article_modified_time TIMESTAMP WITH TIME ZONE,
  meta_article_author VARCHAR(255)[],
  meta_article_section VARCHAR(255),
  meta_article_tag VARCHAR(255)[],
  meta_og_author VARCHAR(255)[],
  template VARCHAR(255),
  theme_config JSONB,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  views INT NOT NULL DEFAULT 0
  search_vector TSVector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_pages_tenant_id_slug UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX idx_pages_division_id ON pages(division_id);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_is_active ON pages(is_active);
CREATE INDEX idx_pages_views ON pages (views);
CREATE INDEX idx_pages_created_at ON pages(created_at);
CREATE INDEX idx_pages_updated_at ON pages(updated_at);
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at);

-- (Improvitations) --
CREATE INDEX idx_pages_search_gin ON pages USING GIN (search_vector);
CREATE INDEX idx_pages_search_published_gin ON pages USING GIN (search_vector) 
WHERE deleted_at IS NULL AND status = 'published';

CREATE TRIGGER update_pages_modtime
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE FUNCTION pages_set_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.is_published := TRUE;
    NEW.published_at := CURRENT_TIMESTAMP;
  ELSIF NEW.status <> 'published' AND OLD.status = 'published' THEN
    NEW.is_published := FALSE;
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_set_published_trigger
BEFORE UPDATE ON pages
FOR EACH ROW
WHEN (NEW.status <> OLD.status)
EXECUTE FUNCTION pages_set_published();

CREATE OR REPLACE FUNCTION pages_search_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.meta_title, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.meta_description, '')), 'C') ||
        -- Perbaikan: Menggunakan array_to_string untuk array TEXT[]
        setweight(to_tsvector('english', array_to_string(NEW.meta_keywords, ' ')), 'C');
    PERFORM pg_notify('refresh_search_view', ''); -- Notifikasi pg_notify
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION pages_search_update();

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