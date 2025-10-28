package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RolePermissionRepository interface {
	Create(ctx context.Context, rolePermission *entity.RolePermission) error
	CreateBatch(ctx context.Context, rolePermissions []entity.RolePermission) error
	Update(ctx context.Context, rolePermission *entity.RolePermission) (*entity.RolePermission, error)
	List(ctx context.Context, roleID string) ([]*entity.RolePermission, error)
	Delete(ctx context.Context, rolePermission *entity.RolePermission) error
}
type rolePermissionRepository struct {
	*baseRepository
}

func NewRolePermissionRepository(db *pgxpool.Pool) RolePermissionRepository {
	return &rolePermissionRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *rolePermissionRepository) Create(ctx context.Context, rolePermission *entity.RolePermission) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO role_permissions (role_id, permission_id, created_at) 
	VALUES ($1, $2, $3) 
	ON CONFLICT ON CONSTRAINT chk_role_permission_unique DO NOTHING
	RETURNING id, created_at, updated_at`

	args := []interface{}{rolePermission.RoleID, rolePermission.PermissionID, rolePermission.CreatedAt}

	err := r.db.QueryRow(subCtx, query, args...).Scan(&rolePermission.ID, &rolePermission.CreatedAt, &rolePermission.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("failed to create role permission: %w", err)
	}
	return nil
}
func (r *rolePermissionRepository) CreateBatch(ctx context.Context, rolePermissions []entity.RolePermission) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO role_permissions (role_id, permission_id, created_at) 
	VALUES ($1, $2, $3) 
	ON CONFLICT ON CONSTRAINT chk_role_permission_unique DO NOTHING
	RETURNING id, created_at, updated_at`

	tx, err := r.db.Begin(subCtx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(subCtx)

	err = r.WithTransaction(subCtx, func(tx pgx.Tx) error {
		for _, rolePermission := range rolePermissions {
			args := []interface{}{rolePermission.RoleID, rolePermission.PermissionID, rolePermission.CreatedAt}
			err = tx.QueryRow(subCtx, query, args...).Scan(&rolePermission.ID, &rolePermission.CreatedAt, &rolePermission.UpdatedAt)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					continue
				}
				return fmt.Errorf("failed to create role permission: %w", err)
			}
		}
		return nil
	})

	if err = tx.Commit(subCtx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	if err != nil {
		return fmt.Errorf("failed to create role permissions: %w", err)
	}
	return nil
}

func (r *rolePermissionRepository) Update(ctx context.Context, rolePermission *entity.RolePermission) (*entity.RolePermission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE role_permissions 
	SET permission_id = $1 
	WHERE id = $2 
	RETURNING id, role_id, permission_id, created_at, updated_at`

	args := []interface{}{rolePermission.PermissionID, rolePermission.ID}

	var updateRolePermission entity.RolePermission
	err := r.db.QueryRow(subCtx, query, args...).Scan(&updateRolePermission.ID, &updateRolePermission.RoleID, &updateRolePermission.PermissionID, &updateRolePermission.CreatedAt, &updateRolePermission.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_role_permission_unique":
				return nil, fmt.Errorf("role permission already exists: %w", err)
			default:
				return nil, fmt.Errorf("failed to update role permission unique constraint: %w", err)
			}
		}
		return nil, fmt.Errorf("failed to update role permission: %w", err)
	}
	return &updateRolePermission, nil
}
func (r *rolePermissionRepository) List(ctx context.Context, roleID string) ([]*entity.RolePermission, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT id, role_id, permission_id, created_at, updated_at FROM role_permissions WHERE role_id = $1`

	args := []interface{}{roleID}

	rows, err := r.db.Query(subCtx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list role permissions: %w", err)
	}
	defer rows.Close()

	var rolePermissions []*entity.RolePermission
	for rows.Next() {
		var rolePermission entity.RolePermission
		err := rows.Scan(&rolePermission.ID, &rolePermission.RoleID, &rolePermission.PermissionID, &rolePermission.CreatedAt, &rolePermission.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role permission: %w", err)
		}
		rolePermissions = append(rolePermissions, &rolePermission)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate role permissions: %w", err)
	}
	return rolePermissions, nil
}
func (r *rolePermissionRepository) Delete(ctx context.Context, rolePermission *entity.RolePermission) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM role_permissions WHERE id = $1`

	args := []interface{}{rolePermission.ID}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete role permission: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("role permission not found: %w", err)
	}
	return nil
}
