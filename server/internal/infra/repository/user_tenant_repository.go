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

type UserTenantRepository interface {
	Create(ctx context.Context, userTenant *entity.UserTenant) (*entity.UserTenant, error)
	Update(ctx context.Context, userTenant *entity.UserTenant) (*entity.UserTenant, error)
	ListByUserID(ctx context.Context, userID string) ([]*entity.UserTenant, error)
	ListByTenantID(ctx context.Context, tenantID string) ([]*entity.UserTenant, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.UserTenant, int64, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
}
type userTenantRepository struct {
	*baseRepository
}

func NewUserTenantRepository(db *pgxpool.Pool) UserTenantRepository {
	return &userTenantRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *userTenantRepository) Create(ctx context.Context, userTenant *entity.UserTenant) (*entity.UserTenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO user_tenants (id, user_id, tenant_id, role_id, is_active, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	ON CONFLICT ON CONSTRAINT chk_user_tenant DO NOTHING
	RETURNING id, user_id, tenant_id, role_id, is_active, created_at, updated_at`

	args := []interface{}{
		userTenant.ID,
		userTenant.UserID,
		userTenant.TenantID,
		userTenant.RoleID,
		userTenant.IsActive,
		userTenant.CreatedAt,
		userTenant.UpdatedAt,
	}

	var createdUserTenant entity.UserTenant
	if err := r.db.QueryRow(subCtx, query, args...).Scan(
		&createdUserTenant.ID,
		&createdUserTenant.UserID,
		&createdUserTenant.TenantID,
		&createdUserTenant.RoleID,
		&createdUserTenant.IsActive,
		&createdUserTenant.CreatedAt,
		&createdUserTenant.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user already exists in tenant")
		}
		return nil, fmt.Errorf("query row failed: %w", err)
	}
	return &createdUserTenant, nil
}
func (r *userTenantRepository) Update(ctx context.Context, userTenant *entity.UserTenant) (*entity.UserTenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE user_tenants
	SET role_id = $1, is_active = $2, updated_at = $3
	WHERE id = $4
	RETURNING id, user_id, tenant_id, role_id, is_active, created_at, updated_at`

	args := []interface{}{
		userTenant.RoleID,
		userTenant.IsActive,
		userTenant.UpdatedAt,
		userTenant.ID,
	}

	var updatedUserTenant entity.UserTenant
	if err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updatedUserTenant.ID,
		&updatedUserTenant.UserID,
		&updatedUserTenant.TenantID,
		&updatedUserTenant.RoleID,
		&updatedUserTenant.IsActive,
		&updatedUserTenant.CreatedAt,
		&updatedUserTenant.UpdatedAt,
	); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_user_tenant":
				return nil, fmt.Errorf("user tenant already exists: %w", err)
			default:
				return nil, fmt.Errorf("unknown constraint: %w", err)
			}
		}
		return nil, fmt.Errorf("query row failed: %w", err)
	}
	return &updatedUserTenant, nil
}
func (r *userTenantRepository) ListByUserID(ctx context.Context, userID string) ([]*entity.UserTenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM user_tenants
	WHERE user_id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		userID,
	}

	var userTenants []*entity.UserTenant
	if err := pgxscan.Select(subCtx, r.db, &userTenants, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no user tenants found")
		}
		return nil, fmt.Errorf("query rows failed: %w", err)
	}
	return userTenants, nil
}
func (r *userTenantRepository) ListByTenantID(ctx context.Context, tenantID string) ([]*entity.UserTenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM user_tenants WHERE tenant_id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		tenantID,
	}

	var userTenants []*entity.UserTenant
	if err := pgxscan.Select(subCtx, r.db, &userTenants, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no user tenants found")
		}
		return nil, fmt.Errorf("query rows failed: %w", err)
	}
	return userTenants, nil
}
func (r *userTenantRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	baseQuery := `SELECT COUNT(*) FROM user_tenants`
	qb := r.buildQuery(baseQuery, filter)

	query, args := qb.Build()

	var count int64
	if err := r.db.QueryRow(subCtx, query, args...).Scan(&count); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("query row failed: %w", err)
	}
	return count, nil
}
func (r *userTenantRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.UserTenant, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	baseQuery := `SELECT * FROM user_tenants`
	qb := r.buildQuery(baseQuery, opts.Filter)

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

	var userTenants []*entity.UserTenant
	if err := pgxscan.Select(subCtx, r.db, &userTenants, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("no user tenants found")
		}
		return nil, 0, fmt.Errorf("failed to query rows: %w", err)
	}
	return userTenants, totalRows, nil
}
func (r *userTenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE user_tenants SET deleted_at = NOW() WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete user tenant: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no rows affected")
	}
	return nil
}
func (r *userTenantRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM user_tenants WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete user tenant: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no rows affected")
	}
	return nil
}
func (r *userTenantRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE user_tenants SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore user tenant: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no rows affected, user tenant may not be deleted")
	}
	return nil
}

func (r *userTenantRepository) buildQuery(baseQuery string, filter *Filter) *QueryBuilder {
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

	if filter.UserID != nil {
		qb.Where("user_id = $1", filter.UserID)
	}
	if filter.TenantID != nil {
		qb.Where("tenant_id = $1", filter.TenantID)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $1", filter.IsActive)
	}
	if filter.Extra != nil {
		if roleID, ok := filter.Extra["role_id"].(uuid.UUID); ok {
			qb.Where("role_id = $2", roleID)
		}
	}
	return qb
}
