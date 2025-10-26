package entity

import (
	"time"

	"github.com/google/uuid"
)

const (
	TokenResetPassword = "reset_password"
	TokenVerifyEmail   = "email_verification"
)

type Token struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	Token     string     `json:"token" db:"token" validate:"required"`
	Type      string     `json:"type" db:"type" validate:"required"`
	IsUsed    bool       `json:"is_used" db:"is_used"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at" validate:"required"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}
type TokenMetadata struct {
	UserID             uuid.UUID          `json:"user_id"`
	Email              string             `json:"email"`
	Role               *Role              `json:"role,omitempty"`
	TenantID           *uuid.UUID         `json:"tenant_id,omitempty"`
	UserTenantID       *uuid.UUID         `json:"user_tenant_id,omitempty"`
	RoleName           []string           `json:"role_name,omitempty"`
	PermissionName     []string           `json:"permission_name"`
	PermissionResource []string           `json:"permission_resource"`
	PermissionAction   []string           `json:"permission_action"`
	Metadata           UserTenantMetadata `json:"metadata"`
	IssuedAt           int64              `json:"issued_at"`
	UserAgent          *string            `json:"user_agent,omitempty"`
}

func (Token) TableName() string {
	return "tokens"
}
func (t *Token) IsExpired() bool {
	return t.ExpiresAt.Before(time.Now())
}
func (t *Token) IsValid() bool {
	return t.Type == TokenResetPassword || t.Type == TokenVerifyEmail
}
func (t *Token) IsTokenUsed() bool {
	return t.IsUsed
}
func (t *Token) IsResetPassword() bool {
	return t.Type == TokenResetPassword
}
func (t *Token) IsVerifyEmail() bool {
	return t.Type == TokenVerifyEmail
}
