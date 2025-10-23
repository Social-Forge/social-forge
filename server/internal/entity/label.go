package entity

import (
	"time"

	"github.com/google/uuid"
)

type Label struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	TenantID     uuid.UUID  `json:"tenant_id" db:"tenant_id" validate:"required"`
	AgentOwnerID uuid.UUID  `json:"agent_owner_id" db:"agent_owner_id" validate:"required"`
	Name         string     `json:"name" db:"name" validate:"required"`
	Slug         string     `json:"slug" db:"slug" validate:"required"`
	Description  string     `json:"description" db:"description"`
	Color        string     `json:"color" db:"color"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

func (Label) TableName() string {
	return "labels"
}
