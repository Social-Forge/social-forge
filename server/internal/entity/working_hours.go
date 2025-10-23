package entity

import (
	"time"

	"github.com/google/uuid"
)

type WorkingHours struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	TenantID   uuid.UUID  `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID uuid.UUID  `json:"division_id" db:"division_id" validate:"required"`
	DayOfWeek  int        `json:"day_of_week" db:"day_of_week" validate:"required,min=0,max=6"`
	StartTime  string     `json:"start_time" db:"start_time" validate:"required"`
	EndTime    string     `json:"end_time" db:"end_time" validate:"required"`
	IsActive   bool       `json:"is_active" db:"is_active"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

func (WorkingHours) TableName() string {
	return "working_hours"
}

func (wh *WorkingHours) IsWithinWorkingHours(t time.Time) bool {
	if !wh.IsActive {
		return false
	}

	if int(t.Weekday()) != wh.DayOfWeek {
		return false
	}

	currentTime := t.Format("15:04:05")
	return currentTime >= wh.StartTime && currentTime <= wh.EndTime
}
