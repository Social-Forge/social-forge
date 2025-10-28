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

type LabelRepository interface {
	Create(ctx context.Context, label *entity.Label) error
	Update(ctx context.Context, label *entity.Label) (*entity.Label, error)
	ListByAgentOwnerID(ctx context.Context, agentOwnerID uuid.UUID, tenantID uuid.UUID) ([]*entity.Label, error)
	Delete(ctx context.Context, label *entity.Label) error
	HardDelete(ctx context.Context, label *entity.Label) error
	CleanUpByTenant(ctx context.Context, tenantID uuid.UUID) error
	CleanUpAll(ctx context.Context) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.Label, int64, error)
}
type labelRepository struct {
	*baseRepository
}

func NewLabelRepository(db *pgxpool.Pool) LabelRepository {
	return &labelRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *labelRepository) Create(ctx context.Context, label *entity.Label) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO labels (id, tenant_id, agent_owner_id, name, slug, description, color, is_active, created_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT ON CONSTRAINT chk_label_agent_id_name DO NOTHING
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		label.ID, label.TenantID, label.AgentOwnerID, label.Name, label.Slug, label.Description, label.Color, label.IsActive, label.CreatedAt,
	}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&label.ID, &label.CreatedAt, &label.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "chk_label_agent_id_slug":
				return fmt.Errorf("label with agent_owner_id %s and slug %s already exists", label.AgentOwnerID, label.Slug)
			default:
				return fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return fmt.Errorf("failed to create label: %w", err)
	}
	return nil
}
func (r *labelRepository) Update(ctx context.Context, label *entity.Label) (*entity.Label, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE labels
		SET name = $1, slug = $2, description = $3, color = $4, is_active = $5
		WHERE id = $6 AND tenant_id = $7
		ON CONFLICT ON CONSTRAINT chk_label_agent_id_name
		DO UPDATE SET
			slug = EXCLUDED.slug,
			description = EXCLUDED.description,
			color = EXCLUDED.color,
			is_active = EXCLUDED.is_active
		RETURNING id, tenant_id, agent_owner_id, name, slug, description, color, is_active, created_at, updated_at
	`
	args := []interface{}{
		label.Name, label.Slug, label.Description, label.Color, label.IsActive, label.ID, label.TenantID,
	}

	labelUpdate := entity.Label{}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&labelUpdate.ID, &labelUpdate.TenantID, &labelUpdate.AgentOwnerID, &labelUpdate.Name, &labelUpdate.Slug, &labelUpdate.Description, &labelUpdate.Color, &labelUpdate.IsActive, &labelUpdate.CreatedAt, &labelUpdate.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "chk_label_agent_id_slug":
				return nil, fmt.Errorf("label with agent_owner_id %s and slug %s already exists", label.AgentOwnerID, label.Slug)
			default:
				return nil, fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return nil, fmt.Errorf("failed to update label: %w", err)
	}
	return &labelUpdate, nil
}
func (r *labelRepository) ListByAgentOwnerID(ctx context.Context, agentOwnerID uuid.UUID, tenantID uuid.UUID) ([]*entity.Label, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM labels
		WHERE agent_owner_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
	`
	args := []interface{}{
		agentOwnerID, tenantID,
	}

	var labels []*entity.Label
	err := pgxscan.Select(subCtx, r.db, &labels, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no labels found for agent_owner_id %s and tenant_id %s", agentOwnerID, tenantID)
		}
		return nil, fmt.Errorf("failed to list labels: %w", err)
	}
	return labels, nil

}
func (r *labelRepository) Delete(ctx context.Context, label *entity.Label) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE labels
		SET is_active = false, deleted_at = NOW()
		WHERE id = $1 AND tenant_id = $2
	`
	args := []interface{}{
		label.ID, label.TenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("label with id %s and tenant_id %s not found", label.ID, label.TenantID)
		}
		return fmt.Errorf("failed to delete label: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("label with id %s and tenant_id %s not found", label.ID, label.TenantID)
	}
	return nil
}
func (r *labelRepository) HardDelete(ctx context.Context, label *entity.Label) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM labels
		WHERE id = $1 AND tenant_id = $2
	`
	args := []interface{}{
		label.ID, label.TenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("label with id %s and tenant_id %s not found", label.ID, label.TenantID)
		}
		return fmt.Errorf("failed to hard delete label: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("label with id %s and tenant_id %s not found", label.ID, label.TenantID)
	}
	return nil
}
func (r *labelRepository) CleanUpByTenant(ctx context.Context, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM labels
		WHERE tenant_id = $1 AND (deleted_at IS NOT NULL OR is_active = false)
	`
	args := []interface{}{
		tenantID,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to clean up labels for tenant %s: %w", tenantID, err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no labels found for tenant %s", tenantID)
	}
	return nil
}
func (r *labelRepository) CleanUpAll(ctx context.Context) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM labels
		WHERE deleted_at IS NOT NULL OR is_active = false
	`

	cmdTag, err := r.db.Exec(subCtx, query)
	if err != nil {
		return fmt.Errorf("failed to clean up all labels: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no labels found to clean up")
	}
	return nil
}
func (r *labelRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	baseQuery := `SELECT COUNT(*) FROM labels`
	qb := r.buildBaseQuery(baseQuery, filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count labels: %w", err)
	}

	return count, nil
}
func (r *labelRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.Label, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}
	qb := r.buildBaseQuery("SELECT * FROM labels", opts.Filter)

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
	var labels []*entity.Label
	err = pgxscan.Select(subCtx, r.db, &labels, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("no labels found")
		}
		return nil, 0, fmt.Errorf("failed to list labels: %w", err)
	}

	return labels, totalRows, nil
}

func (r *labelRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
		qb.Where("tenant_id = $?", filter.TenantID)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(name ILIKE $? OR slug ILIKE $? OR description ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $?", *filter.IsActive)
	}
	if filter.Extra != nil {
		if agentOwnerID, ok := filter.Extra["agent_owner_id"].(uuid.UUID); ok {
			qb.Where("agent_owner_id = $?", agentOwnerID)
		}
		if color, ok := filter.Extra["color"].(string); ok {
			qb.Where("color ILIKE $?", "%"+color+"%")
		}
	}

	return qb
}
