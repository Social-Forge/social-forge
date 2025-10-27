package dto

import "errors"

var (
	ErrEmailAlreadyExists    = errors.New("email already exists")
	ErrUsernameAlreadyExists = errors.New("username already exists")
	ErrPhoneAlreadyExists    = errors.New("phone already exists")
	ErrWeakPassword          = errors.New("password too weak")
)

type UpdateUserRequest struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Phone     string `json:"phone,omitempty" validate:"omitempty,e164"`
	Avatar    string `json:"avatar,omitempty"`
}
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=new_password"`
}
