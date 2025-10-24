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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChannelIntegrationRepository interface {
	Create(ctx context.Context, integration *entity.ChannelIntegration) error
	Update(ctx context.Context, integration *entity.ChannelIntegration) (*entity.ChannelIntegration, error)
	FindByID(ctx context.Context, id string) (*entity.ChannelIntegration, error)
	FindByIdentity(ctx context.Context, tenantID, divisionID, channelID, type_ string) (*entity.ChannelIntegration, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.ChannelIntegration, int64, error)
	Delete(ctx context.Context, id string) error
	HardDelete(ctx context.Context, id string) error
	Restore(ctx context.Context, id string) error
}
type channelIntegrationRepository struct {
	*baseRepository
}

func NewChannelIntegrationRepository(db *pgxpool.Pool) ChannelIntegrationRepository {
	return &channelIntegrationRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *channelIntegrationRepository) Create(ctx context.Context, integration *entity.ChannelIntegration) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO channel_integrations (id, tenant_id, division_id, channel_id, name, type, identifier, access_token, refresh_token, webhook_url, webhook_secret, config, is_active, is_verified, last_sync_at, created_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)							
		ON CONFLICT (tenant_id, division_id, channel_id, type) DO NOTHING
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		integration.ID, integration.TenantID, integration.DivisionID, integration.ChannelID, integration.Name, integration.Type, integration.Identifier, integration.AccessToken, integration.RefreshToken, integration.WebhookURL, integration.WebhookSecret, integration.Config, integration.IsActive, integration.IsVerified, integration.LastSyncAt, integration.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(&integration.ID, &integration.CreatedAt, &integration.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "channel_integrations_channel_id_type_key":
				return fmt.Errorf("channel integration for channel '%s' and type '%s' already exists: %w", integration.ChannelID, integration.Type, err)
			case "channel_integrations_tenant_id_division_id_channel_id_type_key":
				return fmt.Errorf("channel integration for tenant '%s', division '%s', channel '%s' and type '%s' already exists: %w", integration.TenantID, integration.DivisionID, integration.ChannelID, integration.Type, err)
			default:
				return fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return fmt.Errorf("failed to create channel integration: %w", err)
	}
	return nil
}
func (r *channelIntegrationRepository) Update(ctx context.Context, integration *entity.ChannelIntegration) (*entity.ChannelIntegration, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE channel_integrations
		SET name = $1, identifier = $2, access_token = $3, refresh_token = $4, webhook_url = $5, webhook_secret = $6, config = $7, is_active = $8, is_verified = $9, last_sync_at = $10
		WHERE id = $11 AND deleted_at IS NULL
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		integration.Name, integration.Identifier, integration.AccessToken, integration.RefreshToken, integration.WebhookURL, integration.WebhookSecret, integration.Config, integration.IsActive, integration.IsVerified, integration.LastSyncAt, integration.ID,
	}

	var updatedIntegration entity.ChannelIntegration
	err := r.db.QueryRow(subCtx, query, args...).Scan(&updatedIntegration.ID, &updatedIntegration.CreatedAt, &updatedIntegration.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23503" {
			switch pgErr.ConstraintName {
			case "chk_channel_integration_tenant_id_identifier_channel_id":
				return nil, fmt.Errorf("channel integration for tenant '%s', channel '%s' and type '%s' already exists: %w", integration.TenantID, integration.ChannelID, integration.Type, err)
			case "chk_channel_integration_type":
				return nil, fmt.Errorf("channel integration type '%s' is invalid: %w", integration.Type, err)
			default:
				return nil, fmt.Errorf("foreign key violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return nil, fmt.Errorf("failed to update channel integration by id '%s': %w", integration.ID, err)
	}
	return &updatedIntegration, nil
}
func (r *channelIntegrationRepository) FindByID(ctx context.Context, id string) (*entity.ChannelIntegration, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM channel_integrations
		WHERE id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{
		id,
	}

	var integration entity.ChannelIntegration
	err := pgxscan.Get(subCtx, r.db, &integration, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("channel integration with id '%s' not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to find channel integration by id '%s': %w", id, err)
	}
	return &integration, nil
}
func (r *channelIntegrationRepository) Delete(ctx context.Context, id string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE channel_integrations
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete channel integration by id '%s': %w", id, err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("channel integration with id '%s' not found or already deleted: %w", id, err)
	}
	return nil
}
func (r *channelIntegrationRepository) HardDelete(ctx context.Context, id string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM channel_integrations
		WHERE id = $1
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete channel integration by id '%s': %w", id, err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("channel integration with id '%s' not found or already deleted: %w", id, err)
	}
	return nil
}
func (r *channelIntegrationRepository) Restore(ctx context.Context, id string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE channel_integrations
		SET deleted_at = NULL
		WHERE id = $1 AND deleted_at IS NOT NULL
	`
	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore channel integration by id '%s': %w", id, err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("channel integration with id '%s' not found or already restored: %w", id, err)
	}
	return nil
}
func (r *channelIntegrationRepository) FindByIdentity(ctx context.Context, tenantID, divisionID, channelID, type_ string) (*entity.ChannelIntegration, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM channel_integrations
		WHERE tenant_id = $1 AND division_id = $2 AND channel_id = $3 AND type = $4 AND deleted_at IS NULL
	`
	args := []interface{}{
		tenantID, divisionID, channelID, type_,
	}

	var integration entity.ChannelIntegration
	err := pgxscan.Get(subCtx, r.db, &integration, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("channel integration for tenant '%s', division '%s', channel '%s' and type '%s' not found: %w", tenantID, divisionID, channelID, type_, err)
		}
		return nil, fmt.Errorf("failed to find channel integration by identity: %w", err)
	}
	return &integration, nil
}
func (r *channelIntegrationRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.baseQuery("SELECT COUNT(*) FROM channel_integrations", filter)
	query, args := qb.Build()

	var count int64
	err := pgxscan.Get(subCtx, r.db, &count, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count channel integrations: %w", err)
	}
	return count, nil
}
func (r *channelIntegrationRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.ChannelIntegration, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts != nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count channel integrations: %w", err)
	}

	qb := r.baseQuery("SELECT * FROM channel_integrations", opts.Filter)
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("created_at", "DESC")
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}
	query, args := qb.Build()

	var integrations []*entity.ChannelIntegration
	err = pgxscan.Select(subCtx, r.db, &integrations, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to search channel integrations: %w", err)
	}
	return integrations, totalRows, nil
}

func (r *channelIntegrationRepository) baseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
		qb.Where("(name ILIKE $? OR type ILIKE $? OR identifier ILIKE $?)",
			searchPattern, searchPattern, searchPattern)
	}
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", *filter.TenantID)
	}
	if filter.DivisionID != nil {
		qb.Where("division_id = $?", *filter.DivisionID)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $?", *filter.IsActive)
	}
	if filter.IsVerified != nil {
		qb.Where("is_verified = $?", *filter.IsVerified)
	}

	if filter.Extra != nil {
		if type_, ok := filter.Extra["type"].(string); ok {
			qb.Where("type = $?", type_)
		}
		if channelID, ok := filter.Extra["channel_id"].(uuid.UUID); ok {
			qb.Where("channel_id = $?", channelID)
		}
	}

	return qb
}
