package dto

import (
	"errors"
	"social-forge/internal/entity"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrPermissionDenied   = errors.New("permission denied")
)

type JWTClaims struct {
	UserID             string   `json:"user_id"`
	Email              string   `json:"email"`
	TenantID           string   `json:"tenant_id,omitempty"`
	UserTenantID       string   `json:"user_tenant_id,omitempty"`
	RoleID             string   `json:"role_id,omitempty"`
	RoleName           []string `json:"role_name,omitempty"`
	PermissionName     []string `json:"permission_name"`
	PermissionResource []string `json:"permission_resource"`
	PermissionAction   []string `json:"permission_action"`
	Permissions        []string `json:"permissions"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}
type LoginResponse struct {
	AccessToken  string               `json:"access_token"`
	RefreshToken string               `json:"refresh_token"`
	TokenType    string               `json:"token_type"`
	ExpiresIn    int64                `json:"expires_in"`
	User         *entity.UserResponse `json:"user,omitempty"`
}
