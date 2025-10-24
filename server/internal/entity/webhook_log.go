package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type WebhookLog struct {
	ID                   uuid.UUID            `json:"id" db:"id"`
	TenantID             *uuid.UUID           `json:"tenant_id,omitempty" db:"tenant_id"`
	ChannelIntegrationID *uuid.UUID           `json:"channel_integration_id,omitempty" db:"channel_integration_id"`
	EventType            string               `json:"event_type" db:"event_type" validate:"required,max=100"`
	EventID              string               `json:"event_id" db:"event_id" validate:"required,max=100"`
	URL                  string               `json:"url" db:"url" validate:"required,url"`
	Method               string               `json:"method" db:"method" validate:"required,oneof=GET POST PUT DELETE"`
	Payload              *WebhookPayload      `json:"payload" db:"payload" validate:"required"`
	Headers              *WebhookHeaders      `json:"headers,omitempty" db:"headers"`
	ResponseStatus       string               `json:"response_status" db:"response_status" validate:"required,oneof=pending processing success failed unknown"`
	ResponseBody         *WebhookResponseBody `json:"response_body,omitempty" db:"response_body"`
	ProcessedAt          *time.Time           `json:"processed_at,omitempty" db:"processed_at"`
	ErrorMessage         *string              `json:"error_message,omitempty" db:"error_message"`
	RetryCount           int                  `json:"retry_count" db:"retry_count"`
	CreatedAt            time.Time            `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at" db:"updated_at"`
	DeletedAt            *time.Time           `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	WebhookStatusPending    = "pending"
	WebhookStatusProcessing = "processing"
	WebhookStatusSuccess    = "success"
	WebhookStatusFailed     = "failed"
)

type WebhookPayload map[string]interface{}
type WebhookHeaders map[string]interface{}
type WebhookResponseBody map[string]interface{}

func (wp WebhookPayload) Value() (driver.Value, error) {
	if wp == nil {
		return nil, nil
	}
	return json.Marshal(wp)
}

func (wp *WebhookPayload) Scan(value interface{}) error {
	if value == nil {
		*wp = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, wp)
}

func (wh WebhookHeaders) Value() (driver.Value, error) {
	if wh == nil {
		return nil, nil
	}
	return json.Marshal(wh)
}

func (wh *WebhookHeaders) Scan(value interface{}) error {
	if value == nil {
		*wh = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, wh)
}

func (wb WebhookResponseBody) Value() (driver.Value, error) {
	if wb == nil {
		return nil, nil
	}
	return json.Marshal(wb)
}

func (wb *WebhookResponseBody) Scan(value interface{}) error {
	if value == nil {
		*wb = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, wb)
}

func (WebhookLog) TableName() string {
	return "webhook_logs"
}

func (wl *WebhookLog) MarkAsProcessing() {
	wl.ResponseStatus = WebhookStatusProcessing
}

func (wl *WebhookLog) MarkAsSuccess() {
	now := time.Now()
	wl.ResponseStatus = WebhookStatusSuccess
	wl.ProcessedAt = &now
}

func (wl *WebhookLog) MarkAsFailed(errorMsg string) {
	now := time.Now()
	wl.ResponseStatus = WebhookStatusFailed
	wl.ProcessedAt = &now
	wl.ErrorMessage = &errorMsg
	wl.RetryCount++
}
