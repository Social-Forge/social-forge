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
	Identifier string `json:"identifier" validate:"required,min=3"`
	Password   string `json:"password" validate:"required,min=6"`
	RememberMe bool   `json:"remember_me" validate:"omitempty"`
}
type LoginResponse struct {
	AccessToken  string               `json:"access_token"`
	RefreshToken string               `json:"refresh_token"`
	TokenType    string               `json:"token_type"`
	ExpiresIn    int64                `json:"expires_in"`
	User         *entity.UserResponse `json:"user,omitempty"`
}
type RegisterUserRequest struct {
	FirstName       string `json:"first_name" validate:"required,min=2"`
	LastName        string `json:"last_name" validate:"required,min=2"`
	Username        string `json:"username" validate:"required,min=2"`
	Email           string `json:"email" validate:"required,email"`
	Phone           string `json:"phone,omitempty" validate:"omitempty,e164"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=password"`
}
