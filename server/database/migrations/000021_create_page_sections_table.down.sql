BEGIN;

DROP IF EXISTS TRIGGER update_page_sections_modtime ON page_sections;

DROP IF EXISTS FUNCTION update_page_sections_modtime();

DROP IF EXISTS INDEX idx_page_sections_page_id;
DROP IF EXISTS INDEX idx_page_sections_created_at;
DROP IF EXISTS INDEX idx_page_sections_updated_at;
DROP IF EXISTS INDEX idx_page_sections_deleted_at;

DROP TABLE IF EXISTS page_sections;

COMMIT;