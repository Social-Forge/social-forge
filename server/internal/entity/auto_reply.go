package entity

import (
	"time"

	"github.com/google/uuid"
)

type AutoReply struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	TenantID     uuid.UUID  `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID   uuid.UUID  `json:"division_id" db:"division_id" validate:"required"`
	TriggerType  string     `json:"trigger_type" db:"trigger_type" validate:"required,oneof=first_message keyword outside_hours"`
	TriggerValue *string    `json:"trigger_value,omitempty" db:"trigger_value"`
	Message      string     `json:"message" db:"message" validate:"required"`
	MediaURL     *string    `json:"media_url,omitempty" db:"media_url"`
	MediaType    *string    `json:"media_type,omitempty" db:"media_type" validate:"omitempty,oneof=text image video audio file location contact button quick_reply link document"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	TriggerFirstMessage = "first_message"
	TriggerKeyword      = "keyword"
	TriggerOutsideHours = "outside_hours"

	AutoReplyMediaTypeText       = "text"
	AutoReplyMediaTypeImage      = "image"
	AutoReplyMediaTypeVideo      = "video"
	AutoReplyMediaTypeAudio      = "audio"
	AutoReplyMediaTypeFile       = "file"
	AutoReplyMediaTypeLocation   = "location"
	AutoReplyMediaTypeContact    = "contact"
	AutoReplyMediaTypeButton     = "button"
	AutoReplyMediaTypeQuickReply = "quick_reply"
	AutoReplyMediaTypeLink       = "link"
	AutoReplyMediaTypeDocument   = "document"
)

func (AutoReply) TableName() string {
	return "auto_replies"
}
