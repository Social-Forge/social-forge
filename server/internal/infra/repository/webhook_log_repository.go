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

type WebhookLogRepository interface {
	Create(ctx context.Context, log *entity.WebhookLog) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.WebhookLog, error)
	Delete(ctx context.Context, id uuid.UUID) error
	CleanUpWebhookLogs(ctx context.Context) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.WebhookLog, int64, error)
	FindByEventID(ctx context.Context, eventID string) ([]*entity.WebhookLog, error)
	GetRecentLogs(ctx context.Context, tenantID uuid.UUID, limit int) ([]*entity.WebhookLog, error)
	GetFailedLogs(ctx context.Context, tenantID uuid.UUID, limit int) ([]*entity.WebhookLog, error)
	CountByStatus(ctx context.Context, tenantID uuid.UUID, status string) (int64, error)
	PurgeOldLogs(ctx context.Context, beforeDate time.Time) (int64, error)
}

type webhookLogRepository struct {
	*baseRepository
}

func NewWebhookLogRepository(db *pgxpool.Pool) WebhookLogRepository {
	return &webhookLogRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *webhookLogRepository) Create(ctx context.Context, log *entity.WebhookLog) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO webhook_logs (
			id, tenant_id, channel_integration_id, event_type, event_id, url,
			method, headers, payload, response_status,
			response_body, error_message, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at
	`

	args := []interface{}{
		log.ID,
		log.TenantID,
		log.ChannelIntegrationID,
		log.EventType,
		log.EventID,
		log.URL,
		log.Method,
		log.Headers,
		log.Payload,
		log.ResponseStatus,
		log.ResponseBody,
		log.ErrorMessage,
		log.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&log.ID,
		&log.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "webhook_logs_event_id_key":
				return fmt.Errorf("webhook log with event ID %s already exists", log.EventID)
			default:
				return fmt.Errorf("duplicate constraint violation: %w", err)
			}
		}
		return fmt.Errorf("failed to create webhook log: %w", err)
	}

	return nil
}
func (r *webhookLogRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.WebhookLog, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM webhook_logs
		WHERE id = $1
	`

	var log entity.WebhookLog
	err := pgxscan.Get(subCtx, r.db, &log, query, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("webhook log not found")
		}
		return nil, fmt.Errorf("failed to find webhook log: %w", err)
	}

	return &log, nil
}
func (r *webhookLogRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM webhook_logs WHERE id = $1 AND deleted_at IS NULL`

	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete webhook log: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("webhook log not found")
	}

	return nil
}
func (r *webhookLogRepository) CleanUpWebhookLogs(ctx context.Context) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM webhook_logs WHERE deleted_at IS NOT NULL`

	cmdTag, err := r.db.Exec(subCtx, query)
	if err != nil {
		return fmt.Errorf("failed to clean up webhook logs: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no webhook logs to clean up")
	}

	return nil
}
func (r *webhookLogRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	baseQuery := `SELECT COUNT(*) FROM webhook_logs`
	qb := r.buildBaseQuery(baseQuery, filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count webhook logs: %w", err)
	}

	return count, nil
}
func (r *webhookLogRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.WebhookLog, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}
	qb := r.buildBaseQuery("SELECT * FROM webhook_logs", opts.Filter)

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
	var webhookLogs []*entity.WebhookLog
	err = pgxscan.Select(subCtx, r.db, &webhookLogs, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, fmt.Errorf("no webhook logs found")
		}
		return nil, 0, fmt.Errorf("failed to list webhook logs: %w", err)
	}

	return webhookLogs, totalRows, nil
}
func (r *webhookLogRepository) FindByEventID(ctx context.Context, eventID string) ([]*entity.WebhookLog, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT* FROM webhook_logs
		WHERE event_id = $1
		ORDER BY created_at DESC
	`

	var logs []*entity.WebhookLog
	err := pgxscan.Select(subCtx, r.db, &logs, query, eventID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []*entity.WebhookLog{}, nil
		}
		return nil, fmt.Errorf("failed to find webhook logs: %w", err)
	}

	return logs, nil
}
func (r *webhookLogRepository) GetRecentLogs(ctx context.Context, tenantID uuid.UUID, limit int) ([]*entity.WebhookLog, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT * FROM webhook_logs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	var logs []*entity.WebhookLog
	err := pgxscan.Select(subCtx, r.db, &logs, query, tenantID, limit)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []*entity.WebhookLog{}, nil
		}
		return nil, fmt.Errorf("failed to get recent logs: %w", err)
	}

	return logs, nil
}
func (r *webhookLogRepository) GetFailedLogs(ctx context.Context, tenantID uuid.UUID, limit int) ([]*entity.WebhookLog, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT * FROM webhook_logs
		WHERE tenant_id = $1
		  AND (response_status >= 400 OR error_message IS NOT NULL)
		ORDER BY created_at DESC
		LIMIT $2
	`

	var logs []*entity.WebhookLog
	err := pgxscan.Select(subCtx, r.db, &logs, query, tenantID, limit)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []*entity.WebhookLog{}, nil
		}
		return nil, fmt.Errorf("failed to get failed logs: %w", err)
	}

	return logs, nil
}
func (r *webhookLogRepository) CountByStatus(ctx context.Context, tenantID uuid.UUID, status string) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	var query string
	var args []interface{}

	if status == "success" {
		query = `
			SELECT COUNT(*)
			FROM webhook_logs
			WHERE tenant_id = $1
			  AND response_status >= 200
			  AND response_status < 300
		`
		args = []interface{}{tenantID}
	} else if status == "failed" {
		query = `
			SELECT COUNT(*)
			FROM webhook_logs
			WHERE tenant_id = $1
			  AND (response_status >= 400 OR error_message IS NOT NULL)
		`
		args = []interface{}{tenantID}
	} else {
		query = `
			SELECT COUNT(*)
			FROM webhook_logs
			WHERE tenant_id = $1
		`
		args = []interface{}{tenantID}
	}

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count by status: %w", err)
	}

	return count, nil
}
func (r *webhookLogRepository) PurgeOldLogs(ctx context.Context, beforeDate time.Time) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM webhook_logs
		WHERE created_at < $1
	`

	cmdTag, err := r.db.Exec(subCtx, query, beforeDate)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to purge old logs: %w", err)
	}

	return cmdTag.RowsAffected(), nil
}

func (r *webhookLogRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", filter.TenantID)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(event_type ILIKE $? OR event_id ILIKE $? OR response_status::text ILIKE $? OR error_message ILIKE $? OR url ILIKE $?)", searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}
	if filter.Extra != nil {
		if channelIntegrationID, ok := filter.Extra["channel_integration_id"].(uuid.UUID); ok {
			qb.Where("channel_integration_id = $?", channelIntegrationID)
		}
		if method, ok := filter.Extra["method"].(string); ok {
			qb.Where("method ILIKE $?", "%"+method+"%")
		}
		if responseStatus, ok := filter.Extra["response_status"].(int); ok {
			qb.Where("response_status = $?", responseStatus)
		}
		if processedAt, ok := filter.Extra["processed_at"].(time.Time); ok {
			qb.Where("processed_at = $?", processedAt)
		}
	}

	return qb
}
