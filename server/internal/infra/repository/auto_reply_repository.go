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

type AutoReplyRepository interface {
	Create(ctx context.Context, autoReply *entity.AutoReply) error
	Update(ctx context.Context, autoReply *entity.AutoReply) (*entity.AutoReply, error)
	FindByID(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*entity.AutoReply, error)
	ListByDivisionID(ctx context.Context, divisionID uuid.UUID, tenantID uuid.UUID) ([]*entity.AutoReply, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.AutoReply, int64, error)
	Delete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
}
type autoReplyRepository struct {
	*baseRepository
}

func NewAutoReplyRepository(db *pgxpool.Pool) AutoReplyRepository {
	return &autoReplyRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *autoReplyRepository) Create(ctx context.Context, autoReply *entity.AutoReply) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO auto_replies (
			id, tenant_id, division_id, trigger_type, trigger_value, message, media_url, media_type, is_active, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
		ON CONFLICT ON CONSTRAINT chk_auto_replies_tenant_id_trigger_type DO UPDATE SET
			trigger_type = EXCLUDED.trigger_type,
			trigger_value = EXCLUDED.trigger_value,
			message = EXCLUDED.message,
			media_url = EXCLUDED.media_url,
			media_type = EXCLUDED.media_type,
			is_active = EXCLUDED.is_active
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		autoReply.ID, autoReply.TenantID, autoReply.DivisionID, autoReply.TriggerType, autoReply.TriggerValue,
		autoReply.Message, autoReply.MediaURL, autoReply.MediaType, autoReply.IsActive, autoReply.CreatedAt,
	}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&autoReply.ID, &autoReply.CreatedAt, &autoReply.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "chk_auto_replies_trigger_type":
				return fmt.Errorf("auto reply with trigger_type %s already exists", autoReply.TriggerType)
			case "chk_auto_replies_media_type":
				val, errCons := autoReply.MediaType.Value()
				if errCons != nil {
					return fmt.Errorf("failed to get media_type value: %w", errCons)
				}
				return fmt.Errorf("auto reply with media_type %v already exists for tenant %s", val, autoReply.TenantID)
			default:
				return fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return fmt.Errorf("failed to create auto reply: %w", err)
	}
	return nil
}
func (r *autoReplyRepository) Update(ctx context.Context, autoReply *entity.AutoReply) (*entity.AutoReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE auto_replies SET
		    trigger_type = $1,
			trigger_value = $2,
			message = $3,
			media_url = $4,
			media_type = $5,
			is_active = $6
		WHERE id = $7 AND tenant_id = $8
		ON CONFLICT ON CONSTRAINT chk_auto_replies_tenant_id_trigger_type DO UPDATE SET
			trigger_type = EXCLUDED.trigger_type,
			trigger_value = EXCLUDED.trigger_value,
			message = EXCLUDED.message,
			media_url = EXCLUDED.media_url,
			media_type = EXCLUDED.media_type,
			is_active = EXCLUDED.is_active
		RETURNING id, tenant_id, division_id, trigger_type, trigger_value, message, media_url, media_type, is_active, created_at, updated_at
	`
	args := []interface{}{
		autoReply.TriggerType, autoReply.TriggerValue, autoReply.Message, autoReply.MediaURL, autoReply.MediaType, autoReply.IsActive, autoReply.UpdatedAt,
		autoReply.ID, autoReply.TenantID,
	}
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&autoReply.ID, &autoReply.TenantID, &autoReply.DivisionID, &autoReply.TriggerType, &autoReply.TriggerValue,
		&autoReply.Message, &autoReply.MediaURL, &autoReply.MediaType, &autoReply.IsActive, &autoReply.CreatedAt, &autoReply.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "chk_auto_replies_trigger_type":
				return nil, fmt.Errorf("auto reply with trigger_type %s already exists", autoReply.TriggerType)
			case "chk_auto_replies_media_type":
				val, errCons := autoReply.MediaType.Value()
				if errCons != nil {
					return nil, fmt.Errorf("failed to get media_type value: %w", errCons)
				}
				return nil, fmt.Errorf("auto reply with media_type %v already exists for tenant %s", val, autoReply.TenantID)
			default:
				return nil, fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return nil, fmt.Errorf("failed to update auto reply: %w", err)
	}
	return autoReply, nil
}
func (r *autoReplyRepository) FindByID(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*entity.AutoReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM auto_replies WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		id, tenantID,
	}
	autoReply := &entity.AutoReply{}
	err := pgxscan.Get(subCtx, r.db, &autoReply, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("auto reply not found")
		}
		return nil, fmt.Errorf("failed to find auto reply: %w", err)
	}
	return autoReply, nil
}
func (r *autoReplyRepository) ListByDivisionID(ctx context.Context, divisionID uuid.UUID, tenantID uuid.UUID) ([]*entity.AutoReply, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM auto_replies WHERE division_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	args := []interface{}{
		divisionID, tenantID,
	}
	autoReplies := []*entity.AutoReply{}
	err := pgxscan.Select(subCtx, r.db, &autoReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("auto replies not found")
		}
		return nil, fmt.Errorf("failed to list auto replies: %w", err)
	}
	return autoReplies, nil
}
func (r *autoReplyRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM auto_replies", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count auto replies: %w", err)
	}
	return count, nil
}
func (r *autoReplyRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.AutoReply, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(subCtx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM auto_replies", opts.Filter)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("level", "ASC") // Default ordering
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset((opts.Pagination.Page - 1) * opts.Pagination.Limit)
		}
	}

	query, args := qb.Build()
	autoReplies := []*entity.AutoReply{}
	err = pgxscan.Select(subCtx, r.db, &autoReplies, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("auto replies not found")
		}
		return nil, 0, fmt.Errorf("failed to list auto replies: %w", err)
	}
	return autoReplies, totalRows, nil
}
func (r *autoReplyRepository) Delete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE auto_replies SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	args := []interface{}{
		id, tenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete auto reply: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("auto reply not found or already deleted")
	}

	return nil
}
func (r *autoReplyRepository) HardDelete(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM auto_replies WHERE id = $1 AND tenant_id = $2`
	args := []interface{}{
		id, tenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete auto reply: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("auto reply not found or already deleted")
	}

	return nil
}

func (r *autoReplyRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", *filter.TenantID)
	}
	if filter.DivisionID != nil {
		qb.Where("division_id = $?", *filter.DivisionID)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(message ILIKE $? OR trigger_value ILIKE $?)", searchPattern, searchPattern)
	}
	if filter.Extra != nil {
		if triggerType, ok := filter.Extra["trigger_type"].(string); ok {
			qb.Where("trigger_type = $?", triggerType)
		}
		if mediaType, ok := filter.Extra["media_type"].(string); ok {
			qb.Where("media_type = $?", mediaType)
		}
	}

	return qb
}
