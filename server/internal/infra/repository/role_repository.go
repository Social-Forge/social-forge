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

type RoleRepository interface {
	BaseRepository
	Create(ctx context.Context, role *entity.Role) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Role, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Role, error)
	List(ctx context.Context, opts *ListOptions) ([]*entity.Role, error)
	Update(ctx context.Context, role *entity.Role) (*entity.Role, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
}
type roleRepository struct {
	*baseRepository
}

func NewRoleRepository(db *pgxpool.Pool) RoleRepository {
	return &roleRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *roleRepository) Create(ctx context.Context, role *entity.Role) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO roles (id, name, slug, description, level, created_at)
	VALUES ($1, $2, $3, $4, $5, $6)
	ON CONFLICT (name) DO NOTHING ON CONFLICT (slug) DO NOTHING 
	RETURNING id, created_at, updated_at`

	args := []interface{}{
		role.ID,
		role.Name,
		role.Slug,
		role.Description,
		role.Level,
		role.CreatedAt,
		role.UpdatedAt,
	}

	var roleID uuid.UUID
	var createdAt, updatedAt time.Time
	err := r.db.QueryRow(subCtx, query, args...).Scan(&roleID, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("role not found or already deleted")
		}
		return fmt.Errorf("failed to create role: %w", err)
	}

	role.ID = roleID
	role.CreatedAt = createdAt
	role.UpdatedAt = updatedAt
	return nil
}
func (r *roleRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Role, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM roles WHERE id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		id,
	}

	var role entity.Role
	err := pgxscan.Get(subCtx, r.db, role, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find role by id: %w", err)
	}
	return &role, nil
}
func (r *roleRepository) FindBySlug(ctx context.Context, slug string) (*entity.Role, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM roles WHERE slug = $1 AND deleted_at IS NULL`

	args := []interface{}{
		slug,
	}

	var role entity.Role
	err := pgxscan.Get(subCtx, r.db, role, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find role by slug: %w", err)
	}
	return &role, nil
}
func (r *roleRepository) List(ctx context.Context, opts *ListOptions) ([]*entity.Role, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}
	qb := NewQueryBuilder("SELECT * FROM roles")
	if opts.Filter.IncludeDeleted != nil && *opts.Filter.IncludeDeleted {
		qb.Where("deleted_at IS NOT NULL")
	} else {
		qb.Where("deleted_at IS NULL")
	}
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

	var roles []*entity.Role
	err := pgxscan.Select(subCtx, r.db, &roles, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to list roles: %w", err)
	}
	return roles, nil
}
func (r *roleRepository) Update(ctx context.Context, role *entity.Role) (*entity.Role, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE roles SET 
	name = $1, 
	slug = $2, 
	description = $3, 
	level = $4, 
	updated_at = $5 
	WHERE id = $6 AND deleted_at IS NULL
	ON CONFLICT (name) DO UPDATE SET 
	name = EXCLUDED.name, 
	description = EXCLUDED.description, 
	level = EXCLUDED.level, 
	updated_at = EXCLUDED.updated_at 
	ON CONFLICT (slug) DO UPDATE SET 
	slug = EXCLUDED.slug, 
	description = EXCLUDED.description, 
	level = EXCLUDED.level, 
	updated_at = EXCLUDED.updated_at 
	RETURNING id, name, slug, description, level, created_at, updated_at`

	args := []interface{}{
		role.Name,
		role.Slug,
		role.Description,
		role.Level,
		role.UpdatedAt,
		role.ID,
	}

	var updateRole entity.Role
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updateRole.ID,
		&updateRole.Name,
		&updateRole.Slug,
		&updateRole.Description,
		&updateRole.Level,
		&updateRole.CreatedAt,
		&updateRole.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("role not found or already deleted")
		}
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	return &updateRole, nil
}
func (r *roleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE roles SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("role not found or already deleted")
		}
		return fmt.Errorf("failed to delete role: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("role not found or already deleted")
	}

	return nil
}
func (r *roleRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM roles WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("role not found or already deleted")
		}
		return fmt.Errorf("failed to hard delete role: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("role not found or already deleted")
	}

	return nil
}
func (r *roleRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE roles SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("role not found or not deleted")
		}
		return fmt.Errorf("failed to restore role: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("role not found or not deleted")
	}

	return nil
}
