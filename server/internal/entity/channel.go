package entity

import (
	"time"

	"github.com/google/uuid"
)

// Channel represents available communication channels
type Channel struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name" validate:"required,max=50"`
	Slug        string     `json:"slug" db:"slug" validate:"required,max=50"`
	IconURL     NullString `json:"icon_url,omitempty" db:"icon_url"`
	Description NullString `json:"description,omitempty" db:"description"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// Channel slugs
const (
	ChannelWhatsApp      = "whatsapp"
	ChannelMetaWhatsApp  = "meta_whatsapp"
	ChannelMetaMessenger = "meta_messenger"
	ChannelInstagram     = "instagram"
	ChannelTelegram      = "telegram"
	ChannelWebChat       = "webchat"
	ChannelLinkChat      = "linkchat"
)

// TableName returns the table name for Channel
func (Channel) TableName() string {
	return "channels"
}
