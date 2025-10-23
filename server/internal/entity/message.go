package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID               uuid.UUID        `json:"id" db:"id"`
	ConversationID   uuid.UUID        `json:"conversation_id" db:"conversation_id" validate:"required"`
	TenantID         uuid.UUID        `json:"tenant_id" db:"tenant_id" validate:"required"`
	SenderType       string           `json:"sender_type" db:"sender_type" validate:"required,oneof=contact agent system bot"`
	SenderID         *uuid.UUID       `json:"sender_id,omitempty" db:"sender_id"`
	MessageType      string           `json:"message_type" db:"message_type" validate:"required,oneof=text image video audio document location file contact reaction sticker interactive template list link"`
	Content          *string          `json:"content,omitempty" db:"content"`
	MediaURL         *string          `json:"media_url,omitempty" db:"media_url"`
	MediaType        *string          `json:"media_type,omitempty" db:"media_type"`
	MediaSize        *int64           `json:"media_size,omitempty" db:"media_size"`
	ThumbnailURL     *string          `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	ChannelMessageID *string          `json:"channel_message_id,omitempty" db:"channel_message_id"`
	ReplyToID        *uuid.UUID       `json:"reply_to_id,omitempty" db:"reply_to_id"`
	Status           string           `json:"status" db:"status" validate:"required,oneof=sent delivered read failed"`
	SentAt           *time.Time       `json:"sent_at,omitempty" db:"sent_at"`
	DeliveredAt      *time.Time       `json:"delivered_at,omitempty" db:"delivered_at"`
	ReadAt           *time.Time       `json:"read_at,omitempty" db:"read_at"`
	FailedAt         *time.Time       `json:"failed_at,omitempty" db:"failed_at"`
	ErrorMessage     *string          `json:"error_message,omitempty" db:"error_message"`
	Metadata         *MessageMetadata `json:"metadata,omitempty" db:"metadata"`
	SearchVector     *string          `json:"-" db:"search_vector"`
	CreatedAt        time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at" db:"updated_at"`
	DeletedAt        *time.Time       `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	SenderTypeContact = "contact"
	SenderTypeAgent   = "agent"
	SenderTypeSystem  = "system"
	SenderTypeBot     = "bot"

	MessageTypeText        = "text"
	MessageTypeImage       = "image"
	MessageTypeVideo       = "video"
	MessageTypeAudio       = "audio"
	MessageTypeDocument    = "document"
	MessageTypeLocation    = "location"
	MessageTypeFile        = "file"
	MessageTypeContact     = "contact"
	MessageTypeReaction    = "reaction"
	MessageTypeSticker     = "sticker"
	MessageTypeInteractive = "interactive"
	MessageTypeTemplate    = "template"
	MessageTypeList        = "list"
	MessageTypeLink        = "link"

	MessageStatusSent      = "sent"
	MessageStatusDelivered = "delivered"
	MessageStatusRead      = "read"
	MessageStatusFailed    = "failed"
)

type MessageMetadata map[string]interface{}

type ConversationThread struct {
	Message
	ContactName               string     `db:"contact_name"`
	AgentName                 string     `db:"agent_name"`
	ConversationAssignedAgent *uuid.UUID `db:"conversation_assigned_agent"`
	PrevMessageID             *uuid.UUID `db:"prev_message_id"`
	NextMessageID             *uuid.UUID `db:"next_message_id"`
	MessageCountInConvo       int        `db:"message_count_in_convo"`
}
type MessageSearch struct {
	Message
	ContactName         string `db:"contact_name"`
	AgentName           string `db:"agent_name"`
	ConversationSubject string `db:"conversation_subject"`
}
type RecentMessage struct {
	Message
	ContactName   string  `db:"contact_name"`
	ContactAvatar string  `db:"contact_avatar"`
	AgentName     string  `db:"agent_name"`
	AgentAvatar   string  `db:"agent_avatar"`
	SecondsAgo    float64 `db:"seconds_ago"`
}
type MessageAnalytics struct {
	TotalMessages  int64   `db:"total_messages"`
	TextMessages   int64   `db:"text_messages"`
	MediaMessages  int64   `db:"media_messages"`
	DeliveredCount int64   `db:"delivered_count"`
	ReadCount      int64   `db:"read_count"`
	FailedCount    int64   `db:"failed_count"`
	AvgTextLength  float64 `db:"avg_text_length"`
	UniqueConvos   int64   `db:"unique_conversations"`
	UniqueContacts int64   `db:"unique_contacts"`
	UniqueAgents   int64   `db:"unique_agents"`
}

func (mm MessageMetadata) Value() (driver.Value, error) {
	if mm == nil {
		return nil, nil
	}
	return json.Marshal(mm)
}

func (mm *MessageMetadata) Scan(value interface{}) error {
	if value == nil {
		*mm = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, mm)
}

func (Message) TableName() string {
	return "messages"
}

func (m *Message) IsFromContact() bool {
	return m.SenderType == SenderTypeContact
}

func (m *Message) IsFromAgent() bool {
	return m.SenderType == SenderTypeAgent
}

func (m *Message) MarkAsDelivered() {
	now := time.Now()
	m.Status = MessageStatusDelivered
	m.DeliveredAt = &now
}

func (m *Message) MarkAsRead() {
	now := time.Now()
	m.Status = MessageStatusRead
	m.ReadAt = &now
}

func (m *Message) MarkAsFailed(errorMsg string) {
	now := time.Now()
	m.Status = MessageStatusFailed
	m.FailedAt = &now
	m.ErrorMessage = &errorMsg
}
