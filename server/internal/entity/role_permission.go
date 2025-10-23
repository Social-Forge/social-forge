package entity

import (
	"time"

	"github.com/google/uuid"
)

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	RoleID       uuid.UUID  `json:"role_id" db:"role_id" validate:"required"`
	PermissionID uuid.UUID  `json:"permission_id" db:"permission_id" validate:"required"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// RolePermissionWithDetails represents a role-permission relationship with full details
type RolePermissionWithDetails struct {
	RolePermission
	Role       *Role       `json:"role,omitempty"`
	Permission *Permission `json:"permission,omitempty"`
}

// TableName returns the table name for RolePermission
func (RolePermission) TableName() string {
	return "role_permissions"
}
