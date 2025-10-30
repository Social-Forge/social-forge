package entity

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	Email           string     `json:"email" db:"email" validate:"required,email,max=255"`
	Username        string     `json:"username" db:"username" validate:"required,min=3,max=100"`
	PasswordHash    string     `json:"-" db:"password_hash"`
	FullName        string     `json:"full_name" db:"full_name" validate:"required,max=255"`
	Phone           NullString `json:"phone,omitempty" db:"phone" validate:"omitempty,max=20"`
	AvatarURL       NullString `json:"avatar_url,omitempty" db:"avatar_url"`
	TwoFaSecret     NullString `json:"two_fa_secret,omitempty" db:"two_fa_secret"`
	IsActive        bool       `json:"is_active" db:"is_active"`
	IsVerified      bool       `json:"is_verified" db:"is_verified"`
	EmailVerifiedAt NullTime   `json:"email_verified_at,omitempty" db:"email_verified_at"`
	LastLoginAt     NullTime   `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt       NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
}

type UserWithRole struct {
	User
	Role     *Role      `json:"role,omitempty"`
	TenantID *uuid.UUID `json:"tenant_id,omitempty"`
}

type UserResponse struct {
	ID              uuid.UUID                   `json:"id"`
	Email           string                      `json:"email"`
	Username        string                      `json:"username"`
	FullName        string                      `json:"full_name"`
	Phone           string                      `json:"phone,omitempty"`
	AvatarURL       string                      `json:"avatar_url,omitempty"`
	TwoFaSecret     string                      `json:"two_fa_secret,omitempty"`
	IsActive        bool                        `json:"is_active"`
	IsVerified      bool                        `json:"is_verified"`
	EmailVerifiedAt time.Time                   `json:"email_verified_at,omitempty"`
	LastLoginAt     time.Time                   `json:"last_login_at,omitempty"`
	CreatedAt       time.Time                   `json:"created_at"`
	UpdatedAt       time.Time                   `json:"updated_at"`
	UserTenant      UserTenant                  `json:"user_tenant"`
	Tenant          Tenant                      `json:"tenant"`
	Role            Role                        `json:"role"`
	RolePermissions []RolePermissionWithDetails `json:"role_permissions"`
	Metadata        UserTenantMetadata          `json:"metadata"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:              u.ID,
		Email:           u.Email,
		Username:        u.Username,
		FullName:        u.FullName,
		Phone:           u.Phone.String,
		AvatarURL:       u.AvatarURL.String,
		IsActive:        u.IsActive,
		IsVerified:      u.IsVerified,
		EmailVerifiedAt: u.EmailVerifiedAt.Time,
		LastLoginAt:     u.LastLoginAt.Time,
		CreatedAt:       u.CreatedAt,
		UpdatedAt:       u.UpdatedAt,
	}
}

func (u *User) IsDeleted() bool {
	return u.DeletedAt.Valid
}

func (u *User) CanLogin() bool {
	return u.IsActive && !u.IsDeleted()
}

func (u *User) MarkAsVerified() {
	now := time.Now()
	u.IsVerified = true
	u.EmailVerifiedAt = NewNullTimePtr(&now)
}

func (u *User) UpdateLastLogin() {
	now := time.Now()
	u.LastLoginAt = NewNullTimePtr(&now)
}
func (u *User) IsTwoFaActive() bool {
	return u.TwoFaSecret.Valid
}
