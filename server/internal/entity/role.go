package entity

import (
	"time"

	"github.com/google/uuid"
)

const (
	RoleLevelSuperAdmin  = 1
	RoleLevelAdmin       = 2
	RoleLevelTenantOwner = 3
	RoleLevelSupervisor  = 4
	RoleLevelAgent       = 5
)
const (
	RoleSuperAdmin  = "superadmin"
	RoleAdmin       = "admin"
	RoleTenantOwner = "tenant_owner"
	RoleSupervisor  = "supervisor"
	RoleAgent       = "agent"
)

type Role struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name" validate:"required,max=50"`
	Slug        string     `json:"slug" db:"slug" validate:"required,max=50"`
	Description NullString `json:"description,omitempty" db:"description"`
	Level       int        `json:"level" db:"level" validate:"required,min=1,max=5"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
}

// TableName returns the table name for Role
func (Role) TableName() string {
	return "roles"
}

// IsSuperAdmin checks if role is superadmin
func (r *Role) IsSuperAdmin() bool {
	return r.Level == RoleLevelSuperAdmin
}

// IsAdmin checks if role is admin
func (r *Role) IsAdmin() bool {
	return r.Level == RoleLevelAdmin
}

// IsTenantOwner checks if role is tenant owner
func (r *Role) IsTenantOwner() bool {
	return r.Level == RoleLevelTenantOwner
}

// CanManageTenant checks if role can manage tenant
func (r *Role) CanManageTenant() bool {
	return r.Level <= RoleLevelTenantOwner
}

// HasHigherLevelThan checks if this role has higher level than another role
func (r *Role) HasHigherLevelThan(other *Role) bool {
	return r.Level < other.Level // Lower number = higher level
}
