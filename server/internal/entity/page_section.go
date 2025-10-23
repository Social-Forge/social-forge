package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PageSection struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	PageID      uuid.UUID       `json:"page_id" db:"page_id" validate:"required"`
	Type        string          `json:"type" db:"type" validate:"required,max=50"`
	OrderIndex  int             `json:"order_index" db:"order_index" validate:"required"`
	Content     *SectionContent `json:"content" db:"content" validate:"required"`
	StyleConfig *StyleConfig    `json:"style_config,omitempty" db:"style_config"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

type SectionContent map[string]interface{}
type StyleConfig map[string]interface{}

func (sc SectionContent) Value() (driver.Value, error) {
	if sc == nil {
		return nil, nil
	}
	return json.Marshal(sc)
}

func (sc *SectionContent) Scan(value interface{}) error {
	if value == nil {
		*sc = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, sc)
}

func (sc StyleConfig) Value() (driver.Value, error) {
	if sc == nil {
		return nil, nil
	}
	return json.Marshal(sc)
}

func (sc *StyleConfig) Scan(value interface{}) error {
	if value == nil {
		*sc = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, sc)
}

func (PageSection) TableName() string {
	return "page_sections"
}
