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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuickReplyRepository interface {
	Create(ctx context.Context, autoReply *entity.QuickReply) error
	Update(ctx context.Context, autoReply *entity.QuickReply) (*entity.QuickReply, error)
	FindByID(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*entity.QuickReply, error)
	FindByCreatedID(ctx context.Context, createdID uuid.UUID, tenantID uuid.UUID) ([]*entity.QuickReply, error)
	Delete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.QuickReply, int64, error)
	FindByShortcut(ctx context.Context, tenantID uuid.UUID, shortcut string) ([]*entity.QuickReply, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*entity.QuickReply, int64, error)
	ListByCreatedID(ctx context.Context, createdID uuid.UUID, tenantID uuid.UUID) ([]*entity.QuickReply, int64, error)
	IncrementUsageCount(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
}

type quickReplyRepository struct {
	*baseRepository
}

func NewQuickReplyRepository(db *pgxpool.Pool) QuickReplyRepository {
	return &quickReplyRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *quickReplyRepository) Create(ctx context.Context, autoReply *entity.QuickReply) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO quick_replies (
			id, tenant_id, created_by_id, title, shortcut, content, media_type, media_url, is_shared, usage_count, meta_data, is_active, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
		ON CONFLICT ON CONSTRAINT chk_quick_replies_tenant_id_shortcut DO NOTHING
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		autoReply.ID, autoReply.TenantID, autoReply.CreatedByID, autoReply.Title, autoReply.Shortcut,
		autoReply.Content, autoReply.MediaType, autoReply.MediaURL, autoReply.IsShared, autoReply.UsageCount,
		autoReply.MetaData, autoReply.IsActive, autoReply.CreatedAt,
	}
	rows, err := r.db.Query(subCtx, query, args...)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_quick_replies_media_type":
				return fmt.Errorf("quick reply with media type '%s' already exists for tenant '%s': %w", autoReply.MediaType.String, autoReply.TenantID, err)
			default:
				return fmt.Errorf("failed to create quick reply: %w", err)
			}
		}
		return fmt.Errorf("failed to create quick reply: %w", err)
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&autoReply.ID, &autoReply.CreatedAt, &autoReply.UpdatedAt)
		if err != nil {
			return fmt.Errorf("failed to scan quick reply: %w", err)
		}
	}
	return nil
}
func (r *quickReplyRepository) Update(ctx context.Context, autoReply *entity.QuickReply) (*entity.QuickReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE quick_replies SET
			title = $1,
			shortcut = $2,
			content = $3,
			media_type = $4,
			media_url = $5,
			is_shared = $6,
			meta_data = $7,
			is_active = $8,
			updated_at = $9
		WHERE id = $10 AND tenant_id = $11
		RETURNING id, tenant_id, created_by_id, title, shortcut, content, 
		media_type, media_url, is_shared, meta_data, is_active, created_at, updated_at
	`
	args := []interface{}{
		autoReply.Title, autoReply.Shortcut, autoReply.Content, autoReply.MediaType, autoReply.MediaURL,
		autoReply.IsShared, autoReply.MetaData, autoReply.IsActive, autoReply.UpdatedAt,
		autoReply.ID, autoReply.TenantID,
	}
	rows, err := r.db.Query(subCtx, query, args...)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_quick_replies_tenant_id_shortcut":
				return nil, fmt.Errorf("quick reply with shortcut '%s' already exists for tenant '%s': %w", autoReply.Shortcut, autoReply.TenantID, err)
			case "chk_quick_replies_media_type":
				return nil, fmt.Errorf("quick reply with media type '%s' already exists for tenant '%s': %w", autoReply.MediaType.String, autoReply.TenantID, err)
			default:
				return nil, fmt.Errorf("failed to create quick reply: %w", err)
			}
		}
		return nil, fmt.Errorf("failed to update quick reply: %w", err)
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&autoReply.ID, &autoReply.TenantID, &autoReply.CreatedByID, &autoReply.Title, &autoReply.Shortcut,
			&autoReply.Content, &autoReply.MediaType, &autoReply.MediaURL, &autoReply.IsShared, &autoReply.MetaData,
			&autoReply.IsActive, &autoReply.CreatedAt, &autoReply.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quick reply: %w", err)
		}
	}
	return autoReply, nil
}
func (r *quickReplyRepository) FindByID(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*entity.QuickReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM quick_replies WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		id, tenantID,
	}

	var autoReply entity.QuickReply
	err := pgxscan.Get(subCtx, r.db, &autoReply, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("quick reply not found")
		}
		return nil, fmt.Errorf("failed to find quick reply by id: %w", err)
	}
	return &autoReply, nil
}
func (r *quickReplyRepository) FindByCreatedID(ctx context.Context, createdID uuid.UUID, tenantID uuid.UUID) ([]*entity.QuickReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM quick_replies WHERE created_by_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		createdID, tenantID,
	}

	var autoReplies []*entity.QuickReply
	err := pgxscan.Select(subCtx, r.db, &autoReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("quick replies not found")
		}
		return nil, fmt.Errorf("failed to find quick replies by created id: %w", err)
	}
	return autoReplies, nil
}
func (r *quickReplyRepository) Delete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE quick_replies SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	args := []interface{}{
		id, tenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete quick reply: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("quick reply not found or already deleted")
	}

	return nil
}
func (r *quickReplyRepository) HardDelete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM quick_replies WHERE id = $1 AND tenant_id = $2`

	args := []interface{}{
		id, tenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete quick reply: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("quick reply not found or already deleted")
	}

	return nil
}
func (r *quickReplyRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM quick_replies", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("no quick replies found: %w", err)
		}
		return 0, fmt.Errorf("failed to count quick reply: %w", err)
	}
	return count, nil
}
func (r *quickReplyRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.QuickReply, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = &ListOptions{}
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM quick_replies", opts.Filter)

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

	var quickReplies []*entity.QuickReply
	err = pgxscan.Select(subCtx, r.db, &quickReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to get list quick reply: %w", err)
	}
	return quickReplies, totalRows, nil
}
func (r *quickReplyRepository) FindByShortcut(ctx context.Context, tenantID uuid.UUID, shortcut string) ([]*entity.QuickReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM quick_replies WHERE shortcut ILIKE $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		"%" + shortcut + "%", tenantID,
	}

	var quickReplies []*entity.QuickReply
	err := pgxscan.Select(subCtx, r.db, &quickReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("quick reply not found")
		}
		return nil, fmt.Errorf("failed to find quick reply by shortcut: %w", err)
	}
	return quickReplies, nil
}
func (r *quickReplyRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*entity.QuickReply, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM quick_replies WHERE tenant_id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{
		tenantID,
	}

	var quickReplies []*entity.QuickReply
	err := pgxscan.Select(subCtx, r.db, &quickReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to get list quick reply: %w", err)
	}
	return quickReplies, 0, nil
}
func (r *quickReplyRepository) ListByCreatedID(ctx context.Context, createdID uuid.UUID, tenantID uuid.UUID) ([]*entity.QuickReply, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	var totalRows int64
	queryCount := `SELECT COUNT(*) FROM quick_replies WHERE created_by_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	argsCount := []interface{}{
		createdID, tenantID,
	}
	err := r.db.QueryRow(subCtx, queryCount, argsCount...).Scan(&totalRows)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to count quick reply: %w", err)
	}

	query := `
		SELECT * FROM quick_replies WHERE created_by_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		createdID, tenantID,
	}
	var quickReplies []*entity.QuickReply
	err = pgxscan.Select(subCtx, r.db, &quickReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to get list quick reply: %w", err)
	}
	return quickReplies, totalRows, nil
}
func (r *quickReplyRepository) IncrementUsageCount(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE quick_replies SET usage_count = usage_count + 1 WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		id, tenantID,
	}
	_, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("quick reply not found")
		}
		return fmt.Errorf("failed to increment usage count: %w", err)
	}
	return nil
}

func (r *quickReplyRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
		qb.Where("(title ILIKE $? OR shortcut ILIKE $? OR content ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", filter.TenantID)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $?", filter.IsActive)
	}
	if filter.Extra != nil {
		if createdByID, ok := filter.Extra["created_by_id"].(uuid.UUID); ok {
			qb.Where("created_by_id = $?", createdByID)
		}
		if mediaType, ok := filter.Extra["media_type"].(string); ok {
			qb.Where("media_type = $?", mediaType)
		}
		if isShared, ok := filter.Extra["is_shared"].(bool); ok {
			qb.Where("is_shared = $?", isShared)
		}
	}

	return qb
}
