package dto

import (
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TypeVerify string

var (
	ResetPassword     TypeVerify = "reset_password"
	EmailVerification TypeVerify = "email_verification"
	RegistrationInfo  TypeVerify = "registration_info"
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
	TwoFaToken   string               `json:"two_fa_token"`
	TokenType    string               `json:"token_type"`
	ExpiresIn    int64                `json:"expires_in"`
	User         *entity.UserResponse `json:"user,omitempty"`
	Status       string               `json:"status"`
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
type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}
type ResetPasswordRequest struct {
	Token           string `json:"token" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

type SendMailMetaData struct {
	Token     string               `json:"token"`
	Type      TypeVerify           `json:"type"`
	To        string               `json:"to"`
	User      *entity.UserResponse `json:"user,omitempty"`
	Origin    string               `json:"origin"`
	Password  string               `json:"password,omitempty"`
	ExpiredAt time.Time            `json:"expired_at"`
}

func (m *SendMailMetaData) GetURL(origin string) string {
	switch m.Type {
	case ResetPassword:
		return fmt.Sprintf("https://%s/auth/reset?token=%s", origin, m.Token)
	case EmailVerification:
		return fmt.Sprintf("https://%s/auth/verify-email?token=%s", origin, m.Token)
	default:
		return ""
	}
}
func (m *SendMailMetaData) GetType() TypeVerify {
	return m.Type
}
