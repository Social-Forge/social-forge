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

type PermissionRepository interface {
	BaseRepository
	Create(ctx context.Context, permission *entity.Permission) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Permission, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Permission, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.Permission, int64, error)
	GetAll(ctx context.Context) ([]*entity.Permission, error)
	FindByRoleID(ctx context.Context, roleID uuid.UUID) ([]*entity.Permission, error)
	Update(ctx context.Context, permission *entity.Permission) (*entity.Permission, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
}
type permissionRepository struct {
	*baseRepository
}

func NewPermissionRepository(db *pgxpool.Pool) PermissionRepository {
	return &permissionRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *permissionRepository) Create(ctx context.Context, permission *entity.Permission) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO permissions (id, slug, name, resource, action, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (name) DO NOTHING
		ON CONFLICT (slug) DO NOTHING
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		permission.ID,
		permission.Slug,
		permission.Name,
		permission.Resource,
		permission.Action,
		permission.Description,
		permission.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&permission.ID,
		&permission.CreatedAt,
		&permission.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("permission %s already exists", permission.Name)
		}
		return fmt.Errorf("failed to create permission: %w", err)
	}
	return nil
}
func (r *permissionRepository) Update(ctx context.Context, permission *entity.Permission) (*entity.Permission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE permissions
		SET slug = $1, name = $2, resource = $3, action = $4, description = $5
		WHERE id = $6 AND deleted_at IS NULL
		ON CONFLICT (name) DO UPDATE SET
			slug = EXCLUDED.slug,
			resource = EXCLUDED.resource,
			action = EXCLUDED.action,
			description = EXCLUDED.description,
			updated_at = EXCLUDED.updated_at
		ON CONFLICT (slug) DO UPDATE SET
			name = EXCLUDED.name,
			resource = EXCLUDED.resource,
			action = EXCLUDED.action,
			description = EXCLUDED.description,
			updated_at = EXCLUDED.updated_at
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		permission.Slug,
		permission.Name,
		permission.Resource,
		permission.Action,
		permission.Description,
		permission.UpdatedAt,
		permission.ID,
	}

	var updatePermission entity.Permission
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updatePermission.ID,
		&updatePermission.CreatedAt,
		&updatePermission.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("permission %s not found", permission.Name)
		}
		return nil, fmt.Errorf("failed to update permission: %w", err)
	}
	return &updatePermission, nil
}
func (r *permissionRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Permission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if id == uuid.Nil {
		return nil, fmt.Errorf("permission id is required")
	}

	query := `
		SELECT * FROM permissions
		WHERE id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{id}

	var permission entity.Permission
	err := pgxscan.Get(subCtx, r.db, &permission, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("permission %s not found", id)
		}
		return nil, fmt.Errorf("failed to find permission by id: %w", err)
	}
	return &permission, nil
}
func (r *permissionRepository) FindBySlug(ctx context.Context, slug string) (*entity.Permission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if slug == "" {
		return nil, fmt.Errorf("permission slug is required")
	}

	query := `
		SELECT * FROM permissions
		WHERE slug = $1 AND deleted_at IS NULL
	`
	args := []interface{}{slug}

	var permission entity.Permission
	err := pgxscan.Get(subCtx, r.db, &permission, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("permission %s not found", slug)
		}
		return nil, fmt.Errorf("failed to find permission by slug: %w", err)
	}
	return &permission, nil
}
func (r *permissionRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.Permission, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(subCtx, opts.Filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count permissions: %w", err)
	}

	qb := r.buildBaseQuery("SELECT * FROM permissions", opts.Filter)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("created_at", "DESC") // Default ordering
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset((opts.Pagination.Page - 1) * opts.Pagination.Limit)
		}
	}

	query, args := qb.Build()

	var permissions []*entity.Permission
	err = pgxscan.Select(subCtx, r.db, &permissions, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, totalRows, fmt.Errorf("no permissions found")
		}
		return nil, totalRows, fmt.Errorf("failed to list permissions: %w", err)
	}
	return permissions, totalRows, nil
}
func (r *permissionRepository) GetAll(ctx context.Context) ([]*entity.Permission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM permissions WHERE deleted_at IS NULL`

	var permissions []*entity.Permission
	err := pgxscan.Select(subCtx, r.db, &permissions, query)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to list permissions: %w", err)
	}
	return permissions, nil
}
func (r *permissionRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM permissions", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count permissions: %w", err)
	}
	return count, nil
}
func (r *permissionRepository) FindByRoleID(ctx context.Context, roleID uuid.UUID) ([]*entity.Permission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if roleID == uuid.Nil {
		return nil, fmt.Errorf("role id is required")
	}

	query := `
		SELECT p.* FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.resource, p.action
	`
	args := []interface{}{roleID}

	var permissions []*entity.Permission
	err := pgxscan.Select(subCtx, r.db, &permissions, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no permissions found for role %s", roleID)
		}
		return nil, fmt.Errorf("failed to find permissions by role id: %w", err)
	}
	return permissions, nil
}
func (r *permissionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if id == uuid.Nil {
		return fmt.Errorf("permission id is required")
	}

	query := `
		UPDATE permissions
		SET deleted_at = NOW()
		WHERE id = $1
	`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("permission %s not found", id)
	}
	return nil
}
func (r *permissionRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if id == uuid.Nil {
		return fmt.Errorf("permission id is required")
	}

	query := `
		DELETE FROM permissions
		WHERE id = $1
	`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete permission: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("permission %s not found", id)
	}
	return nil
}
func (r *permissionRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if id == uuid.Nil {
		return fmt.Errorf("permission id is required")
	}

	query := `
		UPDATE permissions
		SET deleted_at = NULL
		WHERE id = $1
	`
	args := []interface{}{id}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore permission: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("permission %s not found", id)
	}
	return nil
}
func (r *permissionRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
		qb.Where("(name ILIKE $? OR slug ILIKE $? OR description ILIKE $? OR resource ILIKE $? OR action ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}

	return qb
}
