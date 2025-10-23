package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ChannelIntegration represents a tenant's channel integration
type ChannelIntegration struct {
	ID            uuid.UUID          `json:"id" db:"id"`
	TenantID      uuid.UUID          `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID    *uuid.UUID         `json:"division_id,omitempty" db:"division_id"`
	ChannelID     uuid.UUID          `json:"channel_id" db:"channel_id" validate:"required"`
	Name          string             `json:"name" db:"name" validate:"required,max=255"`
	Type          string             `json:"type" db:"type" validate:"required,oneof=whatsapp meta_whatsapp meta_messenger instagram telegram webchat linkchat"`
	Identifier    *string            `json:"identifier,omitempty" db:"identifier"`
	AccessToken   *string            `json:"-" db:"access_token"`  // Hidden from JSON
	RefreshToken  *string            `json:"-" db:"refresh_token"` // Hidden from JSON
	WebhookURL    *string            `json:"webhook_url,omitempty" db:"webhook_url"`
	WebhookSecret *string            `json:"-" db:"webhook_secret"` // Hidden from JSON
	Config        *IntegrationConfig `json:"config,omitempty" db:"config"`
	IsActive      bool               `json:"is_active" db:"is_active"`
	IsVerified    bool               `json:"is_verified" db:"is_verified"`
	VerifiedAt    *time.Time         `json:"verified_at,omitempty" db:"verified_at"`
	LastSyncAt    *time.Time         `json:"last_sync_at,omitempty" db:"last_sync_at"`
	CreatedAt     time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time         `json:"deleted_at,omitempty" db:"deleted_at"`
}

// IntegrationConfig holds channel-specific configuration
type IntegrationConfig map[string]interface{}

// Value implements the driver.Valuer interface
func (ic IntegrationConfig) Value() (driver.Value, error) {
	if ic == nil {
		return nil, nil
	}
	return json.Marshal(ic)
}

// Scan implements the sql.Scanner interface
func (ic *IntegrationConfig) Scan(value interface{}) error {
	if value == nil {
		*ic = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, ic)
}

// TableName returns the table name
func (ChannelIntegration) TableName() string {
	return "channel_integrations"
}

// IsDeleted checks if integration is soft deleted
func (ci *ChannelIntegration) IsDeleted() bool {
	return ci.DeletedAt != nil
}

// MarkAsVerified marks integration as verified
func (ci *ChannelIntegration) MarkAsVerified() {
	now := time.Now()
	ci.IsVerified = true
	ci.VerifiedAt = &now
}
