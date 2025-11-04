package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// Conversation represents a chat conversation
type Conversation struct {
	ID                   uuid.UUID             `json:"id" db:"id"`
	TenantID             uuid.UUID             `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID           uuid.UUID             `json:"division_id" db:"division_id" validate:"required"`
	ContactID            uuid.UUID             `json:"contact_id" db:"contact_id" validate:"required"`
	AssignedAgentID      *uuid.UUID            `json:"assigned_agent_id,omitempty" db:"assigned_agent_id"`
	ChannelIntegrationID uuid.UUID             `json:"channel_integration_id" db:"channel_integration_id" validate:"required"`
	Status               string                `json:"status" db:"status" validate:"required,oneof=open assigned resolved closed"`
	Priority             string                `json:"priority" db:"priority" validate:"required,oneof=low normal high urgent"`
	LabelIDs             pq.StringArray        `json:"label_ids,omitempty" db:"label_ids"`
	Tags                 pq.StringArray        `json:"tags,omitempty" db:"tags"`
	FirstMessageAt       NullTime              `json:"first_message_at,omitempty" db:"first_message_at"`
	LastMessageAt        NullTime              `json:"last_message_at,omitempty" db:"last_message_at"`
	AssignedAt           NullTime              `json:"assigned_at,omitempty" db:"assigned_at"`
	ResolvedAt           NullTime              `json:"resolved_at,omitempty" db:"resolved_at"`
	ClosedAt             NullTime              `json:"closed_at,omitempty" db:"closed_at"`
	ArchivedAt           NullTime              `json:"archived_at,omitempty" db:"archived_at"`
	MessageCount         int                   `json:"message_count" db:"message_count"`
	AgentResponseTime    NullInt16             `json:"agent_response_time,omitempty" db:"agent_response_time"`
	Metadata             *ConversationMetadata `json:"metadata,omitempty" db:"metadata"`
	IsActive             bool                  `json:"is_active" db:"is_active"`
	CreatedAt            time.Time             `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time             `json:"updated_at" db:"updated_at"`
	DeletedAt            NullTime              `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	ConversationStatusOpen     = "open"
	ConversationStatusAssigned = "assigned"
	ConversationStatusResolved = "resolved"
	ConversationStatusClosed   = "closed"

	PriorityLow    = "low"
	PriorityNormal = "normal"
	PriorityHigh   = "high"
	PriorityUrgent = "urgent"
)

type ConversationMetadata map[string]interface{}

func (cm ConversationMetadata) Value() (driver.Value, error) {
	if cm == nil {
		return nil, nil
	}
	return json.Marshal(cm)
}

func (cm *ConversationMetadata) Scan(value interface{}) error {
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

func (Conversation) TableName() string {
	return "conversations"
}

func (c *Conversation) IsOpen() bool {
	return c.Status == ConversationStatusOpen || c.Status == ConversationStatusAssigned
}

func (c *Conversation) AssignToAgent(agentID uuid.UUID) {
	now := time.Now()
	c.AssignedAgentID = &agentID
	c.Status = ConversationStatusAssigned
	c.AssignedAt = NewNullTime(now)
}

func (c *Conversation) Resolve() {
	now := time.Now()
	c.Status = ConversationStatusResolved
	c.ResolvedAt = NewNullTime(now)
}

func (c *Conversation) Close() {
	now := time.Now()
	c.Status = ConversationStatusClosed
	c.ClosedAt = NewNullTime(now)
}
