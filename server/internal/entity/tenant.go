package entity

import (
	"time"

	"github.com/google/uuid"
)

// Tenant represents an organization/company in the system
type Tenant struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	Name               string     `json:"name" db:"name" validate:"required,max=255"`
	Slug               string     `json:"slug" db:"slug" validate:"required,max=100"`
	OwnerID            uuid.UUID  `json:"owner_id" db:"owner_id" validate:"required"`
	Subdomain          *string    `json:"subdomain,omitempty" db:"subdomain" validate:"omitempty,max=100"`
	LogoURL            *string    `json:"logo_url,omitempty" db:"logo_url"`
	Description        *string    `json:"description,omitempty" db:"description"`
	MaxDivisions       int        `json:"max_divisions" db:"max_divisions"`
	MaxAgents          int        `json:"max_agents" db:"max_agents"`
	MaxQuickReplies    int        `json:"max_quick_replies" db:"max_quick_replies"`
	MaxPages           int        `json:"max_pages" db:"max_pages"`
	MaxWhatsApp        int        `json:"max_whatsapp" db:"max_whatsapp"`
	MaxMetaWhatsApp    int        `json:"max_meta_whatsapp" db:"max_meta_whatsapp"`
	MaxMetaMessenger   int        `json:"max_meta_messenger" db:"max_meta_messenger"`
	MaxInstagram       int        `json:"max_instagram" db:"max_instagram"`
	MaxTelegram        int        `json:"max_telegram" db:"max_telegram"`
	MaxWebChat         int        `json:"max_webchat" db:"max_webchat"`
	MaxLinkChat        int        `json:"max_linkchat" db:"max_linkchat"`
	SubscriptionPlan   string     `json:"subscription_plan" db:"subscription_plan" validate:"required,oneof=free starter pro enterprise"`
	SubscriptionStatus string     `json:"subscription_status" db:"subscription_status" validate:"required,oneof=active suspended cancelled expired"`
	TrialEndsAt        *time.Time `json:"trial_ends_at,omitempty" db:"trial_ends_at"`
	IsActive           bool       `json:"is_active" db:"is_active"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt          *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Subscription plans
const (
	PlanFree       = "free"
	PlanStarter    = "starter"
	PlanPro        = "pro"
	PlanEnterprise = "enterprise"
)

// Subscription statuses
const (
	StatusActive    = "active"
	StatusSuspended = "suspended"
	StatusCancelled = "cancelled"
	StatusExpired   = "expired"
)

// TenantWithOwner represents a tenant with owner information
type TenantWithOwner struct {
	Tenant
	Owner *User `json:"owner,omitempty"`
}

// TableName returns the table name for Tenant
func (Tenant) TableName() string {
	return "tenants"
}

// IsDeleted checks if tenant is soft deleted
func (t *Tenant) IsDeleted() bool {
	return t.DeletedAt != nil
}

// IsSubscriptionActive checks if subscription is active
func (t *Tenant) IsSubscriptionActive() bool {
	return t.SubscriptionStatus == StatusActive && t.IsActive
}

func (t *Tenant) IsSubscriptionExpired() bool {
	return t.SubscriptionStatus == StatusExpired && t.IsActive
}

// IsOnTrial checks if tenant is on trial
func (t *Tenant) IsOnTrial() bool {
	if t.TrialEndsAt == nil {
		return false
	}
	return time.Now().Before(*t.TrialEndsAt)
}

// IsTrialExpired checks if trial has expired
func (t *Tenant) IsTrialExpired() bool {
	if t.TrialEndsAt == nil {
		return false
	}
	return time.Now().After(*t.TrialEndsAt)
}

// CanCreateDivision checks if tenant can create more divisions
func (t *Tenant) CanCreateDivision(currentCount int) bool {
	return currentCount < t.MaxDivisions
}

// CanAddAgent checks if tenant can add more agents
func (t *Tenant) CanAddAgent(currentCount int) bool {
	return currentCount < t.MaxAgents
}

// CanCreatePage checks if tenant can create more pages
func (t *Tenant) CanCreatePage(currentCount int) bool {
	return currentCount < t.MaxPages
}

// CanAddChannel checks if tenant can add more of specific channel type
func (t *Tenant) CanAddChannel(channelType string, currentCount int) bool {
	switch channelType {
	case "whatsapp":
		return currentCount < t.MaxWhatsApp
	case "meta_whatsapp":
		return currentCount < t.MaxMetaWhatsApp
	case "meta_messenger":
		return currentCount < t.MaxMetaMessenger
	case "instagram":
		return currentCount < t.MaxInstagram
	case "telegram":
		return currentCount < t.MaxTelegram
	case "webchat":
		return currentCount < t.MaxWebChat
	case "linkchat":
		return currentCount < t.MaxLinkChat
	default:
		return false
	}
}

// GetPlanLimits returns the limits for the current subscription plan
func (t *Tenant) GetPlanLimits() map[string]int {
	return map[string]int{
		"divisions":      t.MaxDivisions,
		"agents":         t.MaxAgents,
		"quick_replies":  t.MaxQuickReplies,
		"pages":          t.MaxPages,
		"whatsapp":       t.MaxWhatsApp,
		"meta_whatsapp":  t.MaxMetaWhatsApp,
		"meta_messenger": t.MaxMetaMessenger,
		"instagram":      t.MaxInstagram,
		"telegram":       t.MaxTelegram,
		"webchat":        t.MaxWebChat,
		"linkchat":       t.MaxLinkChat,
	}
}

// UpgradePlan upgrades tenant to a new plan with updated limits
func (t *Tenant) UpgradePlan(plan string) {
	t.SubscriptionPlan = plan

	// Set limits based on plan
	switch plan {
	case PlanStarter:
		t.MaxDivisions = 5
		t.MaxAgents = 5
		t.MaxQuickReplies = 500
		t.MaxPages = 5
		t.MaxWhatsApp = 1
		t.MaxMetaWhatsApp = 1
		t.MaxMetaMessenger = 5
		t.MaxInstagram = 5
		t.MaxTelegram = 5
	case PlanPro:
		t.MaxDivisions = 20
		t.MaxAgents = 20
		t.MaxQuickReplies = 1000
		t.MaxPages = 20
		t.MaxWhatsApp = 5
		t.MaxMetaWhatsApp = 5
		t.MaxMetaMessenger = 10
		t.MaxInstagram = 10
		t.MaxTelegram = 10
	case PlanEnterprise:
		t.MaxDivisions = 100
		t.MaxAgents = 100
		t.MaxQuickReplies = 1000
		t.MaxPages = 100
		t.MaxWhatsApp = 10
		t.MaxMetaWhatsApp = 10
		t.MaxMetaMessenger = 100
		t.MaxInstagram = 100
		t.MaxTelegram = 100
	default: // free
		t.MaxDivisions = 1
		t.MaxAgents = 1
		t.MaxQuickReplies = 5
		t.MaxPages = 1
		t.MaxWhatsApp = 0
		t.MaxMetaWhatsApp = 0
		t.MaxMetaMessenger = 1
		t.MaxInstagram = 1
		t.MaxTelegram = 1
	}
}
