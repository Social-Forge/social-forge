package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tenant struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	Name               string     `json:"name" db:"name" validate:"required,max=255"`
	Slug               string     `json:"slug" db:"slug" validate:"required,max=100"`
	OwnerID            uuid.UUID  `json:"owner_id" db:"owner_id" validate:"required"`
	Subdomain          NullString `json:"subdomain,omitempty" db:"subdomain" validate:"omitempty,max=100"`
	LogoURL            NullString `json:"logo_url,omitempty" db:"logo_url"`
	Description        NullString `json:"description,omitempty" db:"description"`
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
	TrialEndsAt        NullTime   `json:"trial_ends_at,omitempty" db:"trial_ends_at"`
	IsActive           bool       `json:"is_active" db:"is_active"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt          NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
}

const (
	PlanFree       = "free"
	PlanStarter    = "starter"
	PlanPro        = "pro"
	PlanEnterprise = "enterprise"
)

const (
	StatusActive    = "active"
	StatusSuspended = "suspended"
	StatusCancelled = "cancelled"
	StatusExpired   = "expired"
)

type TenantWithOwner struct {
	Tenant
	Owner *User `json:"owner,omitempty"`
}

func (Tenant) TableName() string {
	return "tenants"
}

func (t *Tenant) IsDeleted() bool {
	return t.DeletedAt.Valid
}

func (t *Tenant) IsSubscriptionActive() bool {
	return t.SubscriptionStatus == StatusActive && t.IsActive
}

func (t *Tenant) IsSubscriptionExpired() bool {
	return t.SubscriptionStatus == StatusExpired && t.IsActive
}

func (t *Tenant) IsOnTrial() bool {
	if !t.TrialEndsAt.Valid {
		return false
	}
	return time.Now().Before(t.TrialEndsAt.Time)
}

func (t *Tenant) IsTrialExpired() bool {
	if !t.TrialEndsAt.Valid {
		return false
	}
	return time.Now().After(t.TrialEndsAt.Time)
}

func (t *Tenant) CanCreateDivision(currentCount int) bool {
	return currentCount < t.MaxDivisions
}

func (t *Tenant) CanAddAgent(currentCount int) bool {
	return currentCount < t.MaxAgents
}

func (t *Tenant) CanCreatePage(currentCount int) bool {
	return currentCount < t.MaxPages
}

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
