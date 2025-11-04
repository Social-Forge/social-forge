package entity

import (
	"time"

	"github.com/google/uuid"
)

type MessageRead struct {
	ID        uuid.UUID `json:"id" db:"id"`
	MessageID uuid.UUID `json:"message_id" db:"message_id" validate:"required"`
	UserID    uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	ReadAt    time.Time `json:"read_at" db:"read_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	DeletedAt NullTime  `json:"deleted_at,omitempty" db:"deleted_at"`
}

func (MessageRead) TableName() string {
	return "message_reads"
}
