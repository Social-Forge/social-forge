package entity

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user account in the system
type User struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	Email           string     `json:"email" db:"email" validate:"required,email,max=255"`
	Username        string     `json:"username" db:"username" validate:"required,min=3,max=100"`
	PasswordHash    string     `json:"-" db:"password_hash"` // Never expose password hash in JSON
	FullName        string     `json:"full_name" db:"full_name" validate:"required,max=255"`
	Phone           *string    `json:"phone,omitempty" db:"phone" validate:"omitempty,max=20"`
	AvatarURL       *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	IsActive        bool       `json:"is_active" db:"is_active"`
	IsVerified      bool       `json:"is_verified" db:"is_verified"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty" db:"email_verified_at"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// UserWithRole represents a user with their role information
type UserWithRole struct {
	User
	Role     *Role      `json:"role,omitempty"`
	TenantID *uuid.UUID `json:"tenant_id,omitempty"`
}

// UserResponse is the public response struct (excludes sensitive data)
type UserResponse struct {
	ID          uuid.UUID  `json:"id"`
	Email       string     `json:"email"`
	Username    string     `json:"username"`
	FullName    string     `json:"full_name"`
	Phone       *string    `json:"phone,omitempty"`
	AvatarURL   *string    `json:"avatar_url,omitempty"`
	IsActive    bool       `json:"is_active"`
	IsVerified  bool       `json:"is_verified"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// TableName returns the table name for User
func (User) TableName() string {
	return "users"
}

// ToResponse converts User to UserResponse (safe for API)
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		Username:    u.Username,
		FullName:    u.FullName,
		Phone:       u.Phone,
		AvatarURL:   u.AvatarURL,
		IsActive:    u.IsActive,
		IsVerified:  u.IsVerified,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
	}
}

// IsDeleted checks if user is soft deleted
func (u *User) IsDeleted() bool {
	return u.DeletedAt != nil
}

// CanLogin checks if user can login
func (u *User) CanLogin() bool {
	return u.IsActive && !u.IsDeleted()
}

// MarkAsVerified marks user as verified
func (u *User) MarkAsVerified() {
	now := time.Now()
	u.IsVerified = true
	u.EmailVerifiedAt = &now
}

// UpdateLastLogin updates last login timestamp
func (u *User) UpdateLastLogin() {
	now := time.Now()
	u.LastLoginAt = &now
}
