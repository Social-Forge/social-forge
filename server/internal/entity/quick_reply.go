package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type QuickReply struct {
	ID          uuid.UUID           `json:"id" db:"id"`
	TenantID    uuid.UUID           `json:"tenant_id" db:"tenant_id" validate:"required"`
	CreatedByID uuid.UUID           `json:"created_by_id" db:"created_by_id" validate:"required"`
	Title       string              `json:"title" db:"title" validate:"required,max=255"`
	Shortcut    string              `json:"shortcut" db:"shortcut" validate:"required,max=50"`
	Content     string              `json:"content" db:"content" validate:"required"`
	MediaType   NullString          `json:"media_type,omitempty" db:"media_type" validate:"omitempty,oneof=text image video audio document file location contact button quick_reply"`
	MediaURL    NullString          `json:"media_url,omitempty" db:"media_url"`
	IsShared    bool                `json:"is_shared" db:"is_shared"`
	UsageCount  int                 `json:"usage_count" db:"usage_count"`
	LastUsedAt  NullTime            `json:"last_used_at,omitempty" db:"last_used_at"`
	MetaData    *QuickReplyMetaData `json:"meta_data,omitempty" db:"meta_data"`
	IsActive    bool                `json:"is_active" db:"is_active"`
	CreatedAt   time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at" db:"updated_at"`
	DeletedAt   NullTime            `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	QuickReplyMediaTypeText       = "text"
	QuickReplyMediaTypeImage      = "image"
	QuickReplyMediaTypeVideo      = "video"
	QuickReplyMediaTypeAudio      = "audio"
	QuickReplyMediaTypeFile       = "file"
	QuickReplyMediaTypeLocation   = "location"
	QuickReplyMediaTypeContact    = "contact"
	QuickReplyMediaTypeButton     = "button"
	QuickReplyMediaTypeQuickReply = "quick_reply"
	QuickReplyMediaTypeLink       = "link"
	QuickReplyMediaTypeDocument   = "document"
)

type QuickReplyMetaData map[string]interface{}

func (QuickReply) TableName() string {
	return "quick_replies"
}
func (cm QuickReplyMetaData) Value() (driver.Value, error) {
	if cm == nil {
		return nil, nil
	}
	return json.Marshal(cm)
}

func (cm *QuickReplyMetaData) Scan(value interface{}) error {
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
func (qr *QuickReply) IncrementUsage() {
	qr.UsageCount++
	now := time.Now()
	qr.LastUsedAt = NewNullTime(now)
}
