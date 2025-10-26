package entity

import (
	"time"

	"github.com/google/uuid"
)

type RolePermission struct {
	ID           uuid.UUID   `json:"id" db:"id"`
	RoleID       uuid.UUID   `json:"role_id" db:"role_id" validate:"required"`
	PermissionID uuid.UUID   `json:"permission_id" db:"permission_id" validate:"required"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time  `json:"deleted_at,omitempty" db:"deleted_at"`
	Role         *Role       `json:"role,omitempty"`
	Permission   *Permission `json:"permission,omitempty"`
}

type RolePermissionWithDetails struct {
	// RolePermission
	ID           uuid.UUID `json:"id"`
	RoleID       uuid.UUID `json:"role_id"`
	PermissionID uuid.UUID `json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	// Denormalized
	RoleName           string `json:"role_name"`
	RoleSlug           string `json:"role_slug"`
	PermissionName     string `json:"permission_name"`
	PermissionSlug     string `json:"permission_slug"`
	PermissionResource string `json:"permission_resource"`
	PermissionAction   string `json:"permission_action"`
}
type RolePermissionWithNested struct {
	RolePermission RolePermission `json:"role_permission"`
	Role           Role           `json:"role"`
	Permission     Permission     `json:"permission"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
