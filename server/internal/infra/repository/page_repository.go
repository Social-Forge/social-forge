package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/config"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type PageRepository interface {
	Create(ctx context.Context, page *entity.Page) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Page, error)
	FindBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*entity.Page, error)
	Update(ctx context.Context, page *entity.Page) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.Page, int64, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	Publish(ctx context.Context, id uuid.UUID) error
	Unpublish(ctx context.Context, id uuid.UUID) error
	UpdateMetadata(ctx context.Context, id uuid.UUID, metadata *entity.PageMetaData) error
	FindPublishedBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*entity.Page, error)
	IncrementViews(ctx context.Context, id uuid.UUID) error
}

type pageRepository struct {
	*baseRepository
}

func NewPageRepository(db *pgxpool.Pool) PageRepository {
	return &pageRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *pageRepository) Create(ctx context.Context, page *entity.Page) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO pages (
			id, tenant_id, division_id, title, slug, description, content, status,
			meta_title, meta_description, meta_keywords, meta_image_url, meta_og_title,
			meta_og_description, meta_og_image_url, meta_og_type, meta_og_url, meta_og_site_name,
			meta_twitter_card, meta_twitter_title, meta_twitter_description, meta_twitter_image_url,
			meta_article_published_time, meta_article_modified_time, meta_article_author, meta_article_section, meta_article_tags,
			template, theme_config, published_at, is_published, featured_image_url, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
		ON CONFLICT ON CONSTRAINT chk_pages_tenant_id_slug DO NOTHING
		RETURNING id, created_at, updated_at
	`

	args := []interface{}{
		page.ID,
		page.TenantID,
		page.DivisionID,
		page.Title,
		page.Slug,
		page.Description,
		page.Content,
		page.Status,
		page.MetaTitle,
		page.MetaDescription,
		page.MetaKeywords,
		page.MetaImageURL,
		page.MetaOGTitle,
		page.MetaOGDescription,
		page.MetaOGImageURL,
		page.MetaOGType,
		page.MetaOGURL,
		page.MetaOGSiteName,
		page.MetaTwitterCard,
		page.MetaTwitterTitle,
		page.MetaTwitterDescription,
		page.MetaTwitterImageURL,
		page.MetaArticlePublishedTime,
		page.MetaArticleModifiedTime,
		page.MetaArticleAuthor,
		page.MetaArticleSection,
		page.MetaArticleTags,
		page.Template,
		page.ThemeConfig,
		page.PublishedAt,
		page.IsPublished,
		page.FeaturedImageURL,
		page.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&page.ID,
		&page.CreatedAt,
		&page.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_pages_tenant_id_slug":
				return fmt.Errorf("page with slug '%s' already exists for tenant '%s'", page.Slug, page.TenantID)
			case "chk_pages_status":
				return fmt.Errorf("page with status '%s' is not valid", page.Status)
			case "chk_pages_slug_format":
				return fmt.Errorf("page with slug '%s' does not match the required format", page.Slug)
			default:
				return fmt.Errorf("failed to create page: %w", err)
			}
		}
		return fmt.Errorf("failed to create page: %w", err)
	}

	return nil
}
func (r *pageRepository) Update(ctx context.Context, page *entity.Page) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE pages
		SET title = $1, slug = $2, description = $3, content = $4, status = $5,
			meta_title = $6, meta_description = $7, meta_keywords = $8, meta_image_url = $9, meta_og_title = $10,
			meta_og_description = $11, meta_og_image_url = $12, meta_og_type = $13, meta_og_url = $14, meta_og_site_name = $15,
			meta_twitter_card = $16, meta_twitter_title = $17, meta_twitter_description = $18, meta_twitter_image_url = $19,
			meta_article_published_time = $20, meta_article_modified_time = $21, meta_article_author = $22, meta_article_section = $23, meta_article_tags = $24,
			template = $25, theme_config = $26, published_at = $27, is_published = $28, featured_image_url = $29, updated_at = $30
		WHERE id = $31
		RETURNING id, created_at, updated_at
	`

	args := []interface{}{
		page.Title,
		page.Slug,
		page.Description,
		page.Content,
		page.Status,
		page.MetaTitle,
		page.MetaDescription,
		page.MetaKeywords,
		page.MetaImageURL,
		page.MetaOGTitle,
		page.MetaOGDescription,
		page.MetaOGImageURL,
		page.MetaOGType,
		page.MetaOGURL,
		page.MetaOGSiteName,
		page.MetaTwitterCard,
		page.MetaTwitterTitle,
		page.MetaTwitterDescription,
		page.MetaTwitterImageURL,
		page.MetaArticlePublishedTime,
		page.MetaArticleModifiedTime,
		page.MetaArticleAuthor,
		page.MetaArticleSection,
		page.MetaArticleTags,
		page.Template,
		page.ThemeConfig,
		page.PublishedAt,
		page.IsPublished,
		page.FeaturedImageURL,
		page.UpdatedAt,
		page.ID,
	}

	var (
		id        uuid.UUID
		createdAt time.Time
		updatedAt time.Time
	)

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&id,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_pages_tenant_id_slug":
				return fmt.Errorf("page with slug '%s' already exists for tenant '%s'", page.Slug, page.TenantID)
			case "chk_pages_status":
				return fmt.Errorf("page with status '%s' is not valid", page.Status)
			case "chk_pages_slug_format":
				return fmt.Errorf("page with slug '%s' does not match the required format", page.Slug)
			default:
				return fmt.Errorf("failed to create page: %w", err)
			}
		}
		return fmt.Errorf("failed to update page: %w", err)
	}
	return nil
}
func (r *pageRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Page, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM pages WHERE id = $1 AND deleted_at IS NULL`
	args := []interface{}{id}

	var page entity.Page
	err := pgxscan.Get(subCtx, r.db, &page, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("page with id '%s' not found", id)
		}
		return nil, fmt.Errorf("failed to find page by id: %w", err)
	}
	return &page, nil
}
func (r *pageRepository) FindBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*entity.Page, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM pages WHERE tenant_id = $1 AND slug = $2 AND deleted_at IS NULL`
	args := []interface{}{tenantID, slug}

	var page entity.Page
	err := pgxscan.Get(subCtx, r.db, &page, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("page with slug '%s' not found for tenant '%s'", slug, tenantID)
		}
		return nil, fmt.Errorf("failed to find page by slug: %w", err)
	}
	return &page, nil
}
func (r *pageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE pages SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete page: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page with id '%s' not found", id)
	}
	return nil
}
func (r *pageRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM pages WHERE id = $1`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete permanently page: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page with id '%s' not found", id)
	}
	return nil
}
func (r *pageRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE pages SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore page: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page with id '%s' not found or already restored", id)
	}
	return nil
}
func (r *pageRepository) Publish(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE pages
		SET is_published = true, published_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to publish page: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page not found")
	}

	return nil
}
func (r *pageRepository) Unpublish(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE pages
		SET is_published = false
		WHERE id = $1 AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to unpublish page: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page not found")
	}

	return nil
}
func (r *pageRepository) FindPublishedBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*entity.Page, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM pages
		WHERE tenant_id = $1 
		  AND slug = $2 
		  AND is_published = true
		  AND deleted_at IS NULL
		LIMIT 1
	`

	var page entity.Page
	err := pgxscan.Get(subCtx, r.db, &page, query, tenantID, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("page not found")
		}
		return nil, fmt.Errorf("failed to find page: %w", err)
	}

	return &page, nil
}
func (r *pageRepository) IncrementViews(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE pages
		SET view_count = view_count + 1
		WHERE id = $1 AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to increment views: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		config.Logger.Error("failed to increment views: page not found", zap.Int64("rows_affected", cmdTag.RowsAffected()))
	}

	return nil
}
func (r *pageRepository) UpdateMetadata(ctx context.Context, id uuid.UUID, metadata *entity.PageMetaData) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE pages
		SET meta_title = $1, meta_description = $2, meta_keywords = $3, meta_image_url = $4, meta_og_title = $5,
		meta_og_description = $6, meta_og_image_url = $7, meta_og_type = $8, meta_og_url = $9, meta_og_site_name = $10,
		meta_twitter_card = $12, meta_twitter_title = $13, meta_twitter_description = $14, meta_twitter_image_url = $15,
		meta_article_published_time = $16, meta_article_modified_time = $17, meta_article_author = $18, meta_article_section = $19, meta_article_tags = $20
		WHERE id = $21 AND deleted_at IS NULL
	`

	args := []interface{}{
		metadata.MetaTitle, metadata.MetaDescription, metadata.MetaKeywords, metadata.MetaImageURL, metadata.MetaOGTitle,
		metadata.MetaOGDescription, metadata.MetaOGImageURL, metadata.MetaOGType, metadata.MetaOGURL, metadata.MetaOGSiteName,
		metadata.MetaTwitterCard, metadata.MetaTwitterTitle, metadata.MetaTwitterDescription, metadata.MetaTwitterImageURL,
		metadata.MetaArticlePublishedTime, metadata.MetaArticleModifiedTime, metadata.MetaArticleAuthor, metadata.MetaArticleSection, metadata.MetaArticleTags,
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update metadata: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page with id '%s' not found", id)
	}

	return nil
}
func (r *pageRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	baseQuery := `SELECT COUNT(*) FROM pages`
	qb := r.buildBaseQuery(baseQuery, filter)

	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count pages: %w", err)
	}

	return count, nil
}
func (r *pageRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.Page, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = &ListOptions{}
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM pages", opts.Filter)
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("created_at", "DESC")
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}
	query, args := qb.Build()

	var pages []*entity.Page
	err = pgxscan.Select(subCtx, r.db, &pages, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("no pages found")
		}
		return nil, 0, fmt.Errorf("failed to search pages: %w", err)
	}

	return pages, totalRows, nil
}
func (r *pageRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
	qb := NewQueryBuilder(baseQuery)

	if filter == nil {
		qb.Where("deleted_at IS NULL")
		return qb
	}

	if filter.IncludeDeleted != nil && *filter.IncludeDeleted {
		qb.Where("deleted_at IS NOT NULL")
	} else {
		qb.Where("deleted_at IS NULL")
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(title ILIKE $? OR slug ILIKE $? OR description ILIKE $? OR content ILIKE $?)", searchPattern, searchPattern, searchPattern, searchPattern)
	}
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", filter.TenantID)
	}
	if filter.DivisionID != nil {
		qb.Where("division_id = $?", filter.DivisionID)
	}
	if filter.Extra != nil {
		if status, ok := filter.Extra["status"].(uuid.UUID); ok {
			qb.Where("status = $?", status)
		}
		if publishedAt, ok := filter.Extra["published_at"].(time.Time); ok {
			qb.Where("published_at = $?", publishedAt)
		}
	}

	return qb
}
