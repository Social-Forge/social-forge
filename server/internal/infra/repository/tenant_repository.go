package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepository interface {
	BaseRepository
	Create(ctx context.Context, tenant *entity.Tenant) error
	CreateTx(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant) error
	CreateWithRecovery(ctx context.Context, tenant *entity.Tenant) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Tenant, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Tenant, error)
	FindByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]*entity.Tenant, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.Tenant, int64, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Update(ctx context.Context, tenant *entity.Tenant) (*entity.Tenant, error)
	UpdateTx(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant) (*entity.Tenant, error)
	UpdateWithRecovery(ctx context.Context, tenant *entity.Tenant) (*entity.Tenant, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	ExistsBySlug(ctx context.Context, slug string) (bool, error)
}

type tenantRepository struct {
	*baseRepository
}

func NewTenantRepository(db *pgxpool.Pool) TenantRepository {
	return &tenantRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *tenantRepository) Create(ctx context.Context, tenant *entity.Tenant) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO tenants (
			id, name, slug, owner_id, subdomain, logo_url, description,
			max_divisions, max_agents, max_quick_replies, max_pages,
			max_whatsapp, max_meta_whatsapp, max_meta_messenger, max_instagram, max_telegram, max_webchat, max_linkchat,
			subscription_plan, subscription_status, is_active, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		) ON CONFLICT (slug) DO NOTHING RETURNING id, created_at, updated_at`

	args := []interface{}{
		tenant.ID,
		tenant.Name,
		tenant.Slug,
		tenant.OwnerID,
		tenant.Subdomain,
		tenant.LogoURL,
		tenant.Description,
		tenant.MaxDivisions,
		tenant.MaxAgents,
		tenant.MaxQuickReplies,
		tenant.MaxPages,
		tenant.MaxWhatsApp,
		tenant.MaxMetaWhatsApp,
		tenant.MaxMetaMessenger,
		tenant.MaxInstagram,
		tenant.MaxTelegram,
		tenant.MaxWebChat,
		tenant.MaxLinkChat,
		tenant.SubscriptionPlan,
		tenant.SubscriptionStatus,
		tenant.IsActive,
		tenant.CreatedAt,
	}

	err := r.db.QueryRow(
		subCtx,
		query,
		args...).Scan(
		&tenant.ID,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("tenant already exists: %w", err)
		}
		return fmt.Errorf("failed to create tenant: %w", err)
	}
	return nil
}
func (r *tenantRepository) CreateTx(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO tenants (
			id, name, slug, owner_id, subdomain, logo_url, description,
			max_divisions, max_agents, max_quick_replies, max_pages,
			max_whatsapp, max_meta_whatsapp, max_meta_messenger, max_instagram, max_telegram, max_webchat, max_linkchat,
			subscription_plan, subscription_status, is_active, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		) ON CONFLICT (slug) DO NOTHING RETURNING id, created_at, updated_at`

	args := []interface{}{
		tenant.ID,
		tenant.Name,
		tenant.Slug,
		tenant.OwnerID,
		tenant.Subdomain,
		tenant.LogoURL,
		tenant.Description,
		tenant.MaxDivisions,
		tenant.MaxAgents,
		tenant.MaxQuickReplies,
		tenant.MaxPages,
		tenant.MaxWhatsApp,
		tenant.MaxMetaWhatsApp,
		tenant.MaxMetaMessenger,
		tenant.MaxInstagram,
		tenant.MaxTelegram,
		tenant.MaxWebChat,
		tenant.MaxLinkChat,
		tenant.SubscriptionPlan,
		tenant.SubscriptionStatus,
		tenant.IsActive,
		tenant.CreatedAt,
	}
	err := tx.QueryRow(subCtx, query, args...).Scan(
		&tenant.ID,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("tenant already exists: %w", err)
		}
		return fmt.Errorf("failed to create tenant: %w", err)
	}
	return nil
}
func (r *tenantRepository) CreateWithRecovery(ctx context.Context, tenant *entity.Tenant) error {
	return r.WithTransaction(ctx, func(tx pgx.Tx) error {
		return r.CreateTx(ctx, tx, tenant)
	})
}
func (r *tenantRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Tenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL
	`
	var tenant entity.Tenant
	err := pgxscan.Get(subCtx, r.db, &tenant, query, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found: %w", err)
		}
		return nil, fmt.Errorf("failed to find tenant by id: %w", err)
	}
	return &tenant, nil
}
func (r *tenantRepository) FindBySlug(ctx context.Context, slug string) (*entity.Tenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if slug == "" {
		return nil, fmt.Errorf("slug is required")
	}
	query := `
		SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL
	`
	var tenant entity.Tenant
	err := pgxscan.Get(subCtx, r.db, &tenant, query, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found: %w", err)
		}
		return nil, fmt.Errorf("failed to find tenant by slug: %w", err)
	}
	return &tenant, nil
}
func (r *tenantRepository) FindByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]*entity.Tenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if ownerID == uuid.Nil {
		return nil, fmt.Errorf("owner id is required")
	}

	query := `
		SELECT * FROM tenants WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC
	`
	var tenants []*entity.Tenant
	err := pgxscan.Select(subCtx, r.db, &tenants, query, ownerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found: %w", err)
		}
		return nil, fmt.Errorf("failed to find tenant by owner id: %w", err)
	}
	return tenants, nil
}
func (r *tenantRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.Tenant, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = &ListOptions{}
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM tenants", opts.Filter)

	// Add ordering & pagination
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	query, args := qb.Build()

	var tenants []*entity.Tenant
	err = pgxscan.Select(subCtx, r.db, &tenants, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("tenant not found: %w", err)
		}
		return nil, 0, fmt.Errorf("failed to get list tenant: %w", err)
	}
	return tenants, totalRows, nil
}
func (r *tenantRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM tenants", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("tenant not found: %w", err)
		}
		return 0, fmt.Errorf("failed to count tenant: %w", err)
	}
	return count, nil
}
func (r *tenantRepository) Update(ctx context.Context, tenant *entity.Tenant) (*entity.Tenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE tenants SET
			name = $1,
			subdomain = $2,
			logo_url = $3,
			description = $4,
			subscription_plan = $5,
			subscription_status = $6,
			is_active = $7
		WHERE id = $8 AND deleted_at IS NULL
		ON CONFLICT (subdomain) DO UPDATE SET
			name = EXCLUDED.name,
			logo_url = EXCLUDED.logo_url,
			description = EXCLUDED.description,
			subscription_plan = EXCLUDED.subscription_plan,
			subscription_status = EXCLUDED.subscription_status,
			is_active = EXCLUDED.is_active
		RETURNING id, slug, name, owner_id, subdomain, logo_url, description, 
		max_divisions, max_agents, max_quick_replies, max_pages, max_whatsapp,
		max_meta_whatsapp, max_meta_messenger, max_instagram, max_telegram,
		max_webchat, max_linkchat, subscription_plan, subscription_status, trial_ends_at,
		is_active, created_at, updated_at
	`
	args := []interface{}{
		tenant.Name,
		tenant.Subdomain,
		tenant.LogoURL,
		tenant.Description,
		tenant.SubscriptionPlan,
		tenant.SubscriptionStatus,
		tenant.IsActive,
		tenant.ID,
	}

	updateTenant := &entity.Tenant{}
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updateTenant.ID,
		&updateTenant.Slug,
		&updateTenant.Name,
		&updateTenant.OwnerID,
		&updateTenant.Subdomain,
		&updateTenant.LogoURL,
		&updateTenant.Description,
		&updateTenant.MaxDivisions,
		&updateTenant.MaxAgents,
		&updateTenant.MaxQuickReplies,
		&updateTenant.MaxPages,
		&updateTenant.MaxWhatsApp,
		&updateTenant.MaxMetaWhatsApp,
		&updateTenant.MaxMetaMessenger,
		&updateTenant.MaxInstagram,
		&updateTenant.MaxTelegram,
		&updateTenant.MaxWebChat,
		&updateTenant.MaxLinkChat,
		&updateTenant.SubscriptionPlan,
		&updateTenant.SubscriptionStatus,
		&updateTenant.TrialEndsAt,
		&updateTenant.IsActive,
		&updateTenant.CreatedAt,
		&updateTenant.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found or already updated")
		}
		return nil, fmt.Errorf("failed to update tenant: %w", err)
	}
	return updateTenant, nil
}
func (r *tenantRepository) UpdateTx(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant) (*entity.Tenant, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE tenants SET
			name = $1,
			subdomain = $2,
			logo_url = $3,
			description = $4,
			subscription_plan = $5,
			subscription_status = $6,
			is_active = $7
		WHERE id = $8 AND deleted_at IS NULL
		ON CONFLICT (subdomain) DO UPDATE SET
			name = EXCLUDED.name,
			logo_url = EXCLUDED.logo_url,
			description = EXCLUDED.description,
			subscription_plan = EXCLUDED.subscription_plan,
			subscription_status = EXCLUDED.subscription_status,
			is_active = EXCLUDED.is_active
		RETURNING id, slug, name, owner_id, subdomain, logo_url, description, 
		max_divisions, max_agents, max_quick_replies, max_pages, max_whatsapp,
		max_meta_whatsapp, max_meta_messenger, max_instagram, max_telegram,
		max_webchat, max_linkchat, subscription_plan, subscription_status, trial_ends_at,
		is_active, created_at, updated_at
	`
	args := []interface{}{
		tenant.Name,
		tenant.Subdomain,
		tenant.LogoURL,
		tenant.Description,
		tenant.SubscriptionPlan,
		tenant.SubscriptionStatus,
		tenant.IsActive,
		tenant.ID,
	}

	updateTenant := &entity.Tenant{}
	err := tx.QueryRow(subCtx, query, args...).Scan(
		&updateTenant.ID,
		&updateTenant.Slug,
		&updateTenant.Name,
		&updateTenant.OwnerID,
		&updateTenant.Subdomain,
		&updateTenant.LogoURL,
		&updateTenant.Description,
		&updateTenant.MaxDivisions,
		&updateTenant.MaxAgents,
		&updateTenant.MaxQuickReplies,
		&updateTenant.MaxPages,
		&updateTenant.MaxWhatsApp,
		&updateTenant.MaxMetaWhatsApp,
		&updateTenant.MaxMetaMessenger,
		&updateTenant.MaxInstagram,
		&updateTenant.MaxTelegram,
		&updateTenant.MaxWebChat,
		&updateTenant.MaxLinkChat,
		&updateTenant.SubscriptionPlan,
		&updateTenant.SubscriptionStatus,
		&updateTenant.TrialEndsAt,
		&updateTenant.IsActive,
		&updateTenant.CreatedAt,
		&updateTenant.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found or already updated")
		}
		return nil, fmt.Errorf("failed to update tenant: %w", err)
	}
	return updateTenant, nil
}
func (r *tenantRepository) UpdateWithRecovery(ctx context.Context, tenant *entity.Tenant) (*entity.Tenant, error) {
	var updateTenant *entity.Tenant

	err := r.WithTransaction(ctx, func(tx pgx.Tx) error {
		var err error
		updateTenant, err = r.UpdateTx(ctx, tx, tenant)
		return err
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tenant not found or already updated")
		}
		return nil, fmt.Errorf("failed to update tenant with recovery: %w", err)
	}
	return updateTenant, nil
}
func (r *tenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE tenants SET
			deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("tenant not found or already deleted")
	}

	return nil
}
func (r *tenantRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM tenants WHERE id = $1
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete tenant: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("tenant not found or already deleted")
	}

	return nil
}
func (r *tenantRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE tenants SET
			deleted_at = NULL
		WHERE id = $1 AND deleted_at IS NOT NULL
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore tenant: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("tenant not found or already restored")
	}

	return nil
}
func (r *tenantRepository) ExistsBySlug(ctx context.Context, slug string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT EXISTS(
			SELECT 1 FROM tenants WHERE subdomain = $1 AND deleted_at IS NULL
		)
	`
	args := []interface{}{
		slug,
	}

	var exists bool
	err := r.db.QueryRow(subCtx, query, args...).Scan(&exists)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check tenant existence by slug: %w", err)
	}

	return exists, nil
}
func (r *tenantRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
	qb := NewQueryBuilder(baseQuery)

	if filter == nil {
		qb.Where("deleted_at IS NULL")
		return qb
	}

	if filter.IncludeDeleted != nil && *filter.IncludeDeleted {
		qb.Where("deleted_at IS NOT NULL")
	} else {
		qb.Where("deleted_at IS NULL")
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(name ILIKE $? OR slug ILIKE $?)", searchPattern, searchPattern)
	}
	if filter.Status != "" {
		qb.Where("subscription_status = $?", filter.Status)
	}

	return qb
}
