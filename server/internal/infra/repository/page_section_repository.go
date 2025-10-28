package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PageSectionRepository interface {
	Create(ctx context.Context, section *entity.PageSection) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.PageSection, error)
	Update(ctx context.Context, section *entity.PageSection) (*entity.PageSection, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.PageSection, int64, error)
	ListByPage(ctx context.Context, pageID uuid.UUID, opts *ListOptions) ([]*entity.PageSection, error)
	ReorderSections(ctx context.Context, pageID uuid.UUID, sectionOrders map[uuid.UUID]int) error
	UpdateConfig(ctx context.Context, id uuid.UUID, config *entity.SectionStyleConfig) error
	DuplicateSection(ctx context.Context, sectionID uuid.UUID) (*entity.PageSection, error)
	BulkDelete(ctx context.Context, sectionIDs []uuid.UUID) error
	CountByPage(ctx context.Context, pageID uuid.UUID) (int64, error)
}

type pageSectionRepository struct {
	*baseRepository
}

func NewPageSectionRepository(db *pgxpool.Pool) PageSectionRepository {
	return &pageSectionRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *pageSectionRepository) Create(ctx context.Context, section *entity.PageSection) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO page_sections (
			id, page_id, name, type, order_index,
			style_config, content, is_visible
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	args := []interface{}{
		section.ID,
		section.PageID,
		section.Name,
		section.Type,
		section.OrderIndex,
		section.StyleConfig,
		section.Content,
		section.IsVisible,
		section.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&section.ID,
		&section.CreatedAt,
		&section.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create page section: %w", err)
	}

	return nil
}
func (r *pageSectionRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.PageSection, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM page_sections
		WHERE id = $1 AND deleted_at IS NULL
	`

	var section entity.PageSection
	err := pgxscan.Get(subCtx, r.db, &section, query, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("page section not found")
		}
		return nil, fmt.Errorf("failed to find page section: %w", err)
	}

	return &section, nil
}
func (r *pageSectionRepository) Update(ctx context.Context, section *entity.PageSection) (*entity.PageSection, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE page_sections
		SET name = $1, type = $2, order_index = $3,
			style_config = $4, content = $5, is_visible = $6
		WHERE id = $7 AND deleted_at IS NULL
		RETURNING id, page_id, name, type, order_index,
				  style_config, content, is_visible,
				  created_at, updated_at
	`

	args := []interface{}{
		section.Name,
		section.Type,
		section.OrderIndex,
		section.StyleConfig,
		section.Content,
		section.IsVisible,
		section.ID,
	}

	var updated entity.PageSection
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updated.ID,
		&updated.PageID,
		&updated.Name,
		&updated.Type,
		&updated.OrderIndex,
		&updated.StyleConfig,
		&updated.Content,
		&updated.IsVisible,
		&updated.CreatedAt,
		&updated.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("page section not found")
		}
		return nil, fmt.Errorf("failed to update page section: %w", err)
	}

	return &updated, nil
}
func (r *pageSectionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE page_sections
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete page section: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page section not found")
	}

	return nil
}
func (r *pageSectionRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM page_sections WHERE id = $1`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to hard delete page section: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page section not found")
	}

	return nil
}
func (r *pageSectionRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE page_sections
		SET deleted_at = NULL
		WHERE id = $1 AND deleted_at IS NOT NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to restore page section: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page section not found or already active")
	}

	return nil
}
func (r *pageSectionRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	baseQuery := `SELECT COUNT(*) FROM page_sections`
	qb := r.buildBaseQuery(baseQuery, filter)

	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count page sections: %w", err)
	}

	return count, nil
}
func (r *pageSectionRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.PageSection, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = &ListOptions{}
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM page_sections", opts.Filter)
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

	var sections []*entity.PageSection
	err = pgxscan.Select(subCtx, r.db, &sections, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("no page sections found")
		}
		return nil, 0, fmt.Errorf("failed to search page sections: %w", err)
	}

	return sections, totalRows, nil
}
func (r *pageSectionRepository) ListByPage(ctx context.Context, pageID uuid.UUID, opts *ListOptions) ([]*entity.PageSection, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	// if opts == nil {
	// 	opts = NewListOptions()
	// }

	query := `
		SELECT * FROM page_sections
		WHERE page_id = $1 AND deleted_at IS NULL
		ORDER BY order_index ASC
	`

	var sections []*entity.PageSection
	err := pgxscan.Select(subCtx, r.db, &sections, query, pageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []*entity.PageSection{}, nil
		}
		return nil, fmt.Errorf("failed to list page sections: %w", err)
	}

	return sections, nil
}
func (r *pageSectionRepository) ReorderSections(ctx context.Context, pageID uuid.UUID, sectionOrders map[uuid.UUID]int) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if len(sectionOrders) == 0 {
		return nil
	}

	query := `
		UPDATE page_sections
		SET order_index = $1
		WHERE id = $2 AND page_id = $3 AND deleted_at IS NULL
	`

	batch := &pgx.Batch{}
	for sectionID, orderIndex := range sectionOrders {
		batch.Queue(query, orderIndex, sectionID, pageID)
	}

	br := r.db.SendBatch(subCtx, batch)
	defer br.Close()

	for range sectionOrders {
		_, err := br.Exec()
		if err != nil {
			return fmt.Errorf("failed to reorder sections: %w", err)
		}
	}

	return nil
}
func (r *pageSectionRepository) UpdateConfig(ctx context.Context, id uuid.UUID, config *entity.SectionStyleConfig) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE page_sections
		SET style_config = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, config, id)
	if err != nil {
		return fmt.Errorf("failed to update config: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("page section not found")
	}

	return nil
}
func (r *pageSectionRepository) DuplicateSection(ctx context.Context, sectionID uuid.UUID) (*entity.PageSection, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	original, err := r.FindByID(subCtx, sectionID)
	if err != nil {
		return nil, err
	}

	duplicate := &entity.PageSection{
		ID:          uuid.New(),
		PageID:      original.PageID,
		Type:        original.Type,
		Name:        original.Name + " (Copy)",
		OrderIndex:  original.OrderIndex + 1,
		StyleConfig: original.StyleConfig,
		Content:     original.Content,
		IsVisible:   original.IsVisible,
		CreatedAt:   time.Now(),
	}

	err = r.Create(subCtx, duplicate)
	if err != nil {
		return nil, fmt.Errorf("failed to duplicate section: %w", err)
	}

	return duplicate, nil
}
func (r *pageSectionRepository) BulkDelete(ctx context.Context, sectionIDs []uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if len(sectionIDs) == 0 {
		return nil
	}

	query := `
		UPDATE page_sections
		SET deleted_at = NOW()
		WHERE id = ANY($1) AND deleted_at IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, sectionIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk delete sections: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no sections found to delete")
	}

	return nil
}
func (r *pageSectionRepository) CountByPage(ctx context.Context, pageID uuid.UUID) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT COUNT(*)
		FROM page_sections
		WHERE page_id = $1 AND deleted_at IS NULL
	`

	var count int64
	err := r.db.QueryRow(subCtx, query, pageID).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count sections: %w", err)
	}

	return count, nil
}

func (r *pageSectionRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
		qb.Where("(name ILIKE $? OR type ILIKE $? OR order_index ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}

	if filter.Extra != nil {
		if pageId, ok := filter.Extra["page_id"].(uuid.UUID); ok {
			qb.Where("page_id = $?", pageId)
		}
		if type_, ok := filter.Extra["type"].(string); ok {
			qb.Where("type = $?", type_)
		}
		if isVisible, ok := filter.Extra["is_visible"].(bool); ok {
			qb.Where("is_visible = $?", isVisible)
		}
	}

	return qb
}
