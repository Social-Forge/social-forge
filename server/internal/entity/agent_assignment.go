package entity

import (
	"time"

	"github.com/google/uuid"
)

// AgentAssignment represents agent assignment to division
type AgentAssignment struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	TenantID        uuid.UUID  `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID      uuid.UUID  `json:"division_id" db:"division_id" validate:"required"`
	IsActive        bool       `json:"is_active" db:"is_active"`
	Status          string     `json:"status" db:"status" validate:"required,oneof=available busy offline"`
	AssignedCount   int        `json:"assigned_count" db:"assigned_count"`
	ResolvedCount   int        `json:"resolved_count" db:"resolved_count"`
	AvgResponseTime *int       `json:"avg_response_time,omitempty" db:"avg_response_time"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	AgentStatusAvailable = "available"
	AgentStatusBusy      = "busy"
	AgentStatusOffline   = "offline"
)

func (AgentAssignment) TableName() string {
	return "agent_assignments"
}

func (aa *AgentAssignment) IsAvailable() bool {
	return aa.Status == AgentStatusAvailable && aa.IsActive
}

func (aa *AgentAssignment) IsBusy() bool {
	return aa.Status == AgentStatusBusy && aa.IsActive
}
func (aa *AgentAssignment) IsOffline() bool {
	return aa.Status == AgentStatusOffline && aa.IsActive
}
