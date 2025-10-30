package entity

import (
	"time"

	"github.com/google/uuid"
)

// Permission represents a granular permission in the system
type Permission struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name" validate:"required,max=100"`
	Slug        string     `json:"slug" db:"slug" validate:"required,max=100"`
	Resource    string     `json:"resource" db:"resource" validate:"required,max=50"`
	Action      string     `json:"action" db:"action" validate:"required,max=50"`
	Description NullString `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Permission resources
const (
	ResourceUsers         = "users"
	ResourceTenants       = "tenants"
	ResourceDivisions     = "divisions"
	ResourceAgents        = "agents"
	ResourceConversations = "conversations"
	ResourceMessages      = "messages"
	ResourceContacts      = "contacts"
	ResourceQuickReplies  = "quick_replies"
	ResourceAutoReplies   = "auto_replies"
	ResourcePages         = "pages"
	ResourceChannels      = "channels"
	ResourceAnalytics     = "analytics"
	ResourceSettings      = "settings"
)

// Permission actions
const (
	ActionCreate = "create"
	ActionRead   = "read"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionManage = "manage" // Full control
	ActionAssign = "assign"
	ActionExport = "export"
)

// TableName returns the table name for Permission
func (Permission) TableName() string {
	return "permissions"
}

// IsManagePermission checks if this is a manage permission (full control)
func (p *Permission) IsManagePermission() bool {
	return p.Action == ActionManage
}

// GetFullSlug returns the full permission slug (resource.action)
func (p *Permission) GetFullSlug() string {
	return p.Resource + "." + p.Action
}
