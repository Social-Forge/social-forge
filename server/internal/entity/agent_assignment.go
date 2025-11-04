package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AgentAssignment represents agent assignment to division
type AgentAssignment struct {
	ID              uuid.UUID      `json:"id" db:"id"`
	UserID          uuid.UUID      `json:"user_id" db:"user_id" validate:"required"`
	TenantID        uuid.UUID      `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID      uuid.UUID      `json:"division_id" db:"division_id" validate:"required"`
	IsActive        bool           `json:"is_active" db:"is_active"`
	Status          string         `json:"status" db:"status" validate:"required,oneof=available busy offline"`
	AssignedCount   int            `json:"assigned_count" db:"assigned_count"`
	ResolvedCount   int            `json:"resolved_count" db:"resolved_count"`
	AvgResponseTime NullInt32      `json:"avg_response_time,omitempty" db:"avg_response_time"`
	Percentage      NullInt32      `json:"percentage,omitempty" db:"percentage"`
	Weight          NullInt32      `json:"weight,omitempty" db:"weight"`
	Priority        NullInt32      `json:"priority,omitempty" db:"priority"`
	MetaData        AssignMetaData `json:"meta_data,omitempty" db:"meta_data"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt       NullTime       `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	AgentStatusAvailable = "available"
	AgentStatusBusy      = "busy"
	AgentStatusOffline   = "offline"
)

type AssignMetaData map[string]interface{}

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
func (rc AssignMetaData) Value() (driver.Value, error) {
	if rc == nil {
		return nil, nil
	}
	return json.Marshal(rc)
}
func (rc *AssignMetaData) Scan(value interface{}) error {
	if value == nil {
		*rc = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, rc)
}
