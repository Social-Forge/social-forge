package entity

import (
	"time"

	"github.com/google/uuid"
)

type UserTenant struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	TenantID  uuid.UUID `json:"tenant_id" db:"tenant_id" validate:"required"`
	RoleID    uuid.UUID `json:"role_id" db:"role_id" validate:"required"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	DeletedAt NullTime  `json:"deleted_at,omitempty" db:"deleted_at"`
}

type UserTenantWithDetails struct {
	UserTenant      UserTenant                  `json:"user_tenant"`
	User            User                        `json:"user"`
	Tenant          Tenant                      `json:"tenant"`
	Role            Role                        `json:"role"`
	RolePermissions []RolePermissionWithDetails `json:"role_permissions"`
	Metadata        UserTenantMetadata          `json:"metadata"`
}
type UserTenantWithDetailsNested struct {
	UserTenant      UserTenant                 `json:"user_tenant"`
	User            User                       `json:"user"`
	Tenant          Tenant                     `json:"tenant"`
	Role            Role                       `json:"role"`
	RolePermissions []RolePermissionWithNested `json:"role_permissions"`
	Metadata        UserTenantMetadata         `json:"metadata"`
}

type UserTenantMetadata struct {
	PermissionCount int       `json:"permission_count"`
	UserStatus      string    `json:"user_status"`
	LastUpdated     time.Time `json:"last_updated"`
}

func (UserTenant) TableName() string {
	return "user_tenants"
}
func (u *UserTenantWithDetails) ToResponse() *UserResponse {
	return &UserResponse{
		ID:              u.User.ID,
		Email:           u.User.Email,
		Username:        u.User.Username,
		FullName:        u.User.FullName,
		Phone:           u.User.Phone.String,
		AvatarURL:       u.User.AvatarURL.String,
		IsActive:        u.User.IsActive,
		IsVerified:      u.User.IsVerified,
		EmailVerifiedAt: u.User.EmailVerifiedAt.Time,
		LastLoginAt:     u.User.LastLoginAt.Time,
		CreatedAt:       u.User.CreatedAt,
		UpdatedAt:       u.User.UpdatedAt,
		UserTenant:      u.UserTenant,
		Tenant:          u.Tenant,
		Role:            u.Role,
		RolePermissions: u.RolePermissions,
		Metadata:        u.Metadata,
	}
}
