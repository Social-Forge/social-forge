package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// Contact represents a customer/contact
type Contact struct {
	ID            uuid.UUID        `json:"id" db:"id"`
	TenantID      uuid.UUID        `json:"tenant_id" db:"tenant_id" validate:"required"`
	Name          string           `json:"name" db:"name"`
	Email         *string          `json:"email,omitempty" db:"email" validate:"omitempty,email"`
	Phone         *string          `json:"phone,omitempty" db:"phone"`
	AvatarURL     *string          `json:"avatar_url,omitempty" db:"avatar_url"`
	ChannelID     uuid.UUID        `json:"channel_id" db:"channel_id" validate:"required"`
	ChannelUserID string           `json:"channel_user_id" db:"channel_user_id" validate:"required"`
	Metadata      *ContactMetadata `json:"metadata,omitempty" db:"metadata"`
	LabelIDs      pq.StringArray   `json:"label_ids,omitempty" db:"label_ids"`
	Tags          pq.StringArray   `json:"tags,omitempty" db:"tags"`
	IsBlocked     bool             `json:"is_blocked" db:"is_blocked"`
	LastContactAt *time.Time       `json:"last_contact_at,omitempty" db:"last_contact_at"`
	IsActive      bool             `json:"is_active" db:"is_active"`
	SearchVector  string           `json:"-" db:"search_vector"`
	CreatedAt     time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time       `json:"deleted_at,omitempty" db:"deleted_at"`
}

// ContactMetadata holds custom fields
type ContactMetadata map[string]interface{}

func (cm ContactMetadata) Value() (driver.Value, error) {
	if cm == nil {
		return nil, nil
	}
	return json.Marshal(cm)
}

func (cm *ContactMetadata) Scan(value interface{}) error {
	if value == nil {
		*cm = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, cm)
}

func (Contact) TableName() string {
	return "contacts"
}
