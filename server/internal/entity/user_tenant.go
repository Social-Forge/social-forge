package entity

import (
	"time"

	"github.com/google/uuid"
)

// UserTenant represents the many-to-many relationship between users and tenants
type UserTenant struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	TenantID  uuid.UUID  `json:"tenant_id" db:"tenant_id" validate:"required"`
	RoleID    uuid.UUID  `json:"role_id" db:"role_id" validate:"required"`
	IsActive  bool       `json:"is_active" db:"is_active"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// UserTenantWithDetails represents a user-tenant relationship with full details
type UserTenantWithDetails struct {
	UserTenant
	User   *User   `json:"user,omitempty"`
	Tenant *Tenant `json:"tenant,omitempty"`
	Role   *Role   `json:"role,omitempty"`
}

// TableName returns the table name for UserTenant
func (UserTenant) TableName() string {
	return "user_tenants"
}
