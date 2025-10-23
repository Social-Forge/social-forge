package entity

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	UserID       uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	AccessToken  string     `json:"access_token" db:"access_token" validate:"required"`
	RefreshToken string     `json:"refresh_token" db:"refresh_token" validate:"required"`
	ExpiresAt    time.Time  `json:"expires_at" db:"expires_at" validate:"required"`
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	IsRevoked    bool       `json:"is_revoked" db:"is_revoked"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

func (Session) TableName() string {
	return "sessions"
}
func (t *Session) IsExpired() bool {
	return t.ExpiresAt.Before(time.Now())
}
func (t *Session) IsSessionRevoked() bool {
	return t.IsRevoked
}
