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

type MessageRepository interface {
	BaseRepository
	Create(ctx context.Context, msg *entity.Message) error
	CreateTx(ctx context.Context, tx pgx.Tx, msg *entity.Message) error
	CreateWithRecovery(ctx context.Context, msg *entity.Message) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Message, error)
	ListByConversation(ctx context.Context, conversationID uuid.UUID, opts *ListOptions) ([]*entity.Message, int64, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Message, int64, error)
	ListFromThreads(ctx context.Context, conversationID uuid.UUID, opts *ListOptions) ([]*entity.ConversationThread, int64, error)
	SearchMessages(ctx context.Context, tenantID uuid.UUID, searchQuery string, opts *ListOptions) ([]*entity.MessageSearch, int64, error)
	GetRecentMessages(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.RecentMessage, int64, error)
	GetMessageAnalytics(ctx context.Context, tenantID uuid.UUID, days int) (*entity.MessageAnalytics, error)
	Count(ctx context.Context, conversationID uuid.UUID) (int64, error)
	Update(ctx context.Context, msg *entity.Message) (*string, *string, error)
	UpdateTx(ctx context.Context, tx pgx.Tx, msg *entity.Message) (*string, *string, error)
	UpdateWithRecovery(ctx context.Context, msg *entity.Message) (*string, *string, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) (string, error)
	Delete(ctx context.Context, id uuid.UUID) error
	BulkDelete(ctx context.Context, ids []uuid.UUID) error
	CleanUpDeletedMessages(ctx context.Context) error
	MarkAsDelivered(ctx context.Context, id uuid.UUID) error
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	RefreshMessageViews(ctx context.Context) error
	RefreshConversationThreads(ctx context.Context) error
	FullTextSearch(ctx context.Context, tenantID uuid.UUID, query string, opts *ListOptions) ([]*entity.Message, int64, error)
}

type messageRepository struct {
	*baseRepository
}

func NewMessageRepository(db *pgxpool.Pool) MessageRepository {
	return &messageRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *messageRepository) Create(ctx context.Context, msg *entity.Message) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO messages (
			id, conversation_id, tenant_id, sender_type, sender_id, message_type,
			content, media_url, media_type, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, created_at, updated_at`

	args := []interface{}{
		msg.ID, msg.ConversationID, msg.TenantID, msg.SenderType, msg.SenderID,
		msg.MessageType, msg.Content, msg.MediaURL, msg.MediaType, msg.Status, msg.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(&msg.ID, &msg.CreatedAt, &msg.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	return nil
}
func (r *messageRepository) CreateTx(ctx context.Context, tx pgx.Tx, msg *entity.Message) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO messages (
			id, conversation_id, tenant_id, sender_type, sender_id, message_type,
			content, media_url, media_type, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, created_at, updated_at`

	args := []interface{}{
		msg.ID, msg.ConversationID, msg.TenantID, msg.SenderType, msg.SenderID,
		msg.MessageType, msg.Content, msg.MediaURL, msg.MediaType, msg.Status, msg.CreatedAt,
	}

	err := tx.QueryRow(subCtx, query, args...).Scan(&msg.ID, &msg.CreatedAt, &msg.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	return nil
}
func (r *messageRepository) CreateWithRecovery(ctx context.Context, msg *entity.Message) error {
	return r.WithTransaction(ctx, func(tx pgx.Tx) error {
		return r.CreateTx(ctx, tx, msg)
	})
}
func (r *messageRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Message, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM messages WHERE id = $1 AND deleted_at IS NULL`

	var msg entity.Message
	err := pgxscan.Get(subCtx, r.db, &msg, query, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("message %s not found", id)
		}
		return nil, fmt.Errorf("failed to find message: %w", err)
	}
	return &msg, nil
}
func (r *messageRepository) Update(ctx context.Context, msg *entity.Message) (*string, *string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE messages SET
			content = $1, status = $2
		WHERE id = $3 AND deleted_at IS NULL
		RETURNING content, status`

	args := []interface{}{
		msg.Content, msg.Status, msg.ID,
	}

	var oldContent, oldStatus string
	err := r.db.QueryRow(subCtx, query, args...).Scan(&oldContent, &oldStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil
		}
		return nil, nil, fmt.Errorf("failed to update message: %w", err)
	}
	return &oldContent, &oldStatus, nil
}
func (r *messageRepository) UpdateTx(ctx context.Context, tx pgx.Tx, msg *entity.Message) (*string, *string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE messages SET
			content = $1, status = $2
		WHERE id = $3 AND deleted_at IS NULL
		RETURNING content, status`

	args := []interface{}{
		msg.Content, msg.Status, msg.ID,
	}

	var oldContent, oldStatus string
	err := tx.QueryRow(subCtx, query, args...).Scan(&oldContent, &oldStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil
		}
		return nil, nil, fmt.Errorf("failed to update message: %w", err)
	}
	return &oldContent, &oldStatus, nil
}
func (r *messageRepository) UpdateWithRecovery(ctx context.Context, msg *entity.Message) (*string, *string, error) {
	var oldContent, oldStatus string

	r.WithTransaction(ctx, func(tx pgx.Tx) error {
		var err error
		var oc, os *string
		oc, os, err = r.UpdateTx(ctx, tx, msg)
		if err != nil {
			return err
		}
		if oc != nil {
			oldContent = *oc
		}
		if os != nil {
			oldStatus = *os
		}
		return nil
	})
	return &oldContent, &oldStatus, nil
}
func (r *messageRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE messages SET
			status = $1
		WHERE id = $2 AND deleted_at IS NULL
		RETURNING status`

	args := []interface{}{
		status, id,
	}

	var oldStatus string
	err := r.db.QueryRow(subCtx, query, args...).Scan(&oldStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", fmt.Errorf("failed to update message status: %w", err)
	}
	return oldStatus, nil
}
func (r *messageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE messages SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	args := []interface{}{
		id,
	}
	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message with id %s not found", id)
	}
	return nil
}
func (r *messageRepository) BulkDelete(ctx context.Context, ids []uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE messages SET deleted_at = NOW() WHERE id = ANY($1) AND deleted_at IS NULL`
	args := []interface{}{
		ids,
	}
	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete messages: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no messages found with ids %v", ids)
	}
	return nil
}
func (r *messageRepository) CleanUpDeletedMessages(ctx context.Context) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM messages WHERE deleted_at IS NOT NULL`
	cmdTag, err := r.db.Exec(subCtx, query)
	if err != nil {
		return fmt.Errorf("failed to clean up deleted messages: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("no deleted messages found")
	}
	return nil
}

func (r *messageRepository) MarkAsDelivered(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()
	query := `UPDATE messages SET status = 'delivered', delivered_at = NOW() 
	WHERE id = $1 AND deleted_at IS NULL
	RETURNING id`

	args := []interface{}{
		id,
	}
	var deliveredID uuid.UUID
	err := r.db.QueryRow(subCtx, query, args...).Scan(&deliveredID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("message with id %s not found", id)
		}
		return fmt.Errorf("failed to mark message as delivered: %w", err)
	}
	if deliveredID != id {
		return fmt.Errorf("message with id %s not marked as delivered", id)
	}
	return nil
}
func (r *messageRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()
	query := `UPDATE messages SET status = 'read', read_at = NOW() 
	WHERE id = $1 AND deleted_at IS NULL
	RETURNING id`

	args := []interface{}{
		id,
	}
	var readID uuid.UUID
	err := r.db.QueryRow(subCtx, query, args...).Scan(&readID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("message with id %s not found", id)
		}
		return fmt.Errorf("failed to mark message as read: %w", err)
	}
	if readID != id {
		return fmt.Errorf("message with id %s not marked as read", id)
	}
	return nil
}
func (r *messageRepository) Count(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	var count int64
	query := `SELECT COUNT(*) FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL`
	err := r.db.QueryRow(subCtx, query, conversationID).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count messages: %w", err)
	}
	return count, nil
}
func (r *messageRepository) ListByConversation(ctx context.Context, conversationID uuid.UUID, opts *ListOptions) ([]*entity.Message, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	if opts == nil {
		opts = NewListOptions()
		opts.OrderBy = "created_at"
		opts.OrderDir = "ASC"
	}

	totalRows, err := r.Count(subCtx, conversationID)
	if err != nil {
		return nil, 0, err
	}

	qb := NewQueryBuilder("SELECT * FROM messages")
	qb.Where("conversation_id = $? AND deleted_at IS NULL", conversationID)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	}

	if opts.Pagination != nil {
		qb.WithLimit(opts.Pagination.Limit)
		qb.WithOffset(opts.Pagination.GetOffset())
	}

	query, args := qb.Build()

	var messages []*entity.Message
	err = pgxscan.Select(subCtx, r.db, &messages, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to list messages: %w", err)
	}
	return messages, totalRows, nil
}

func (r *messageRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Message, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
		opts.OrderBy = "created_at"
		opts.OrderDir = "ASC"
	}

	var totalRows int64
	query := `SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND deleted_at IS NULL`
	err := r.db.QueryRow(subCtx, query, tenantID).Scan(&totalRows)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to count messages: %w", err)
	}

	qb := NewQueryBuilder("SELECT * FROM messages")
	qb.Where("tenant_id = $? AND deleted_at IS NULL", tenantID)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	}

	if opts.Pagination != nil {
		qb.WithLimit(opts.Pagination.Limit)
		qb.WithOffset(opts.Pagination.GetOffset())
	}

	query, args := qb.Build()

	var messages []*entity.Message
	err = pgxscan.Select(subCtx, r.db, &messages, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to list messages: %w", err)
	}
	return messages, totalRows, nil
}

func (r *messageRepository) ListFromThreads(ctx context.Context, conversationID uuid.UUID, opts *ListOptions) ([]*entity.ConversationThread, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Gunakan materialized view untuk performance
	qb := NewQueryBuilder("SELECT * FROM mv_conversation_threads")
	qb.Where("conversation_id = $?", conversationID)

	// Apply additional filters
	if opts.Filter != nil {
		if opts.Filter.Search != "" {
			searchPattern := "%" + opts.Filter.Search + "%"
			qb.Where("(content ILIKE $? OR contact_name ILIKE $? OR agent_name ILIKE $?)",
				searchPattern, searchPattern, searchPattern)
		}
		if opts.Filter.Status != "" {
			qb.Where("status = $?", opts.Filter.Status)
		}
	}

	// Count total
	countQb := qb.Clone().ChangeBase("SELECT COUNT(*) FROM mv_conversation_threads")
	countQuery, countArgs := countQb.Build()
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count threads: %w", err)
	}

	// Apply ordering & pagination
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("sent_at", "ASC") // Chronological for threads
	}

	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	query, args := qb.Build()
	var threads []*entity.ConversationThread
	err = pgxscan.Select(subCtx, r.db, &threads, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list conversation threads: %w", err)
	}

	return threads, totalRows, nil
}
func (r *messageRepository) SearchMessages(ctx context.Context, tenantID uuid.UUID, searchQuery string, opts *ListOptions) ([]*entity.MessageSearch, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Gunakan materialized view dengan full-text search
	qb := NewQueryBuilder("SELECT * FROM mv_message_search")
	qb.Where("tenant_id = $?", tenantID)

	// ✅ Full-text search menggunakan tsvector
	if searchQuery != "" {
		qb.Where("search_vector @@ plainto_tsquery('english', $?)", searchQuery)
	}

	// Count total
	countQb := qb.Clone().ChangeBase("SELECT COUNT(*) FROM mv_message_search")
	countQuery, countArgs := countQb.Build()
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply ordering & pagination
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		// Default ordering by relevance (ts_rank)
		if searchQuery != "" {
			qb.OrderBy = "ts_rank(search_vector, plainto_tsquery('english', $?)) DESC"
			// Note: perlu handle args untuk ts_rank
		} else {
			qb.OrderByField("sent_at", "DESC")
		}
	}

	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	query, args := qb.Build()
	var results []*entity.MessageSearch
	err = pgxscan.Select(subCtx, r.db, &results, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search messages: %w", err)
	}

	return results, totalRows, nil
}
func (r *messageRepository) GetRecentMessages(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.RecentMessage, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Gunakan materialized view untuk recent messages
	qb := NewQueryBuilder("SELECT * FROM mv_recent_messages")
	qb.Where("tenant_id = $?", tenantID)

	// Count total
	countQb := qb.Clone().ChangeBase("SELECT COUNT(*) FROM mv_recent_messages")
	countQuery, countArgs := countQb.Build()
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count recent messages: %w", err)
	}

	// Apply ordering & pagination
	qb.OrderByField("sent_at", "DESC")

	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	query, args := qb.Build()
	var recentMessages []*entity.RecentMessage
	err = pgxscan.Select(subCtx, r.db, &recentMessages, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get recent messages: %w", err)
	}

	return recentMessages, totalRows, nil
}
func (r *messageRepository) GetMessageAnalytics(ctx context.Context, tenantID uuid.UUID, days int) (*entity.MessageAnalytics, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT 
			COALESCE(SUM(total_messages), 0) as total_messages,
			COALESCE(SUM(text_messages), 0) as text_messages,
			COALESCE(SUM(media_messages), 0) as media_messages,
			COALESCE(SUM(delivered_count), 0) as delivered_count,
			COALESCE(SUM(read_count), 0) as read_count,
			COALESCE(SUM(failed_count), 0) as failed_count,
			COALESCE(AVG(avg_text_length), 0) as avg_text_length,
			COALESCE(SUM(unique_conversations), 0) as unique_conversations,
			COALESCE(SUM(unique_contacts), 0) as unique_contacts,
			COALESCE(SUM(unique_agents), 0) as unique_agents
		FROM mv_message_analytics 
		WHERE tenant_id = $1 
		AND message_date >= CURRENT_DATE - $2 * INTERVAL '1 day'
	`

	analytics := &entity.MessageAnalytics{}
	err := pgxscan.Get(subCtx, r.db, &analytics, query, tenantID, days)
	if err != nil {
		return nil, fmt.Errorf("failed to get message analytics: %w", err)
	}

	return analytics, nil
}
func (r *messageRepository) RefreshMessageViews(ctx context.Context) error {
	// ✅ Refresh semua materialized views concurrently
	queries := []string{
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_threads",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_message_analytics",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_messages",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_message_search",
	}

	for _, query := range queries {
		_, err := r.db.Exec(ctx, query)
		if err != nil {
			return fmt.Errorf("failed to refresh view: %w", err)
		}
	}

	return nil
}
func (r *messageRepository) FullTextSearch(ctx context.Context, tenantID uuid.UUID, query string, opts *ListOptions) ([]*entity.Message, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Direct full-text search menggunakan tsvector index
	baseQuery := `
		SELECT *, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank 
		FROM messages 
		WHERE tenant_id = $2 AND deleted_at IS NULL 
		AND search_vector @@ plainto_tsquery('english', $1)
	`

	qb := NewQueryBuilder(baseQuery)

	// Count total
	countQuery := `
		SELECT COUNT(*) FROM messages 
		WHERE tenant_id = $1 AND deleted_at IS NULL 
		AND search_vector @@ plainto_tsquery('english', $2)
	`
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, tenantID, query).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply pagination
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	// Always order by relevance for search
	qb.OrderBy = "rank DESC, sent_at DESC"

	finalQuery, args := qb.Build()
	// Prepend search query and tenantID to args
	args = append([]interface{}{query, tenantID}, args...)

	var messages []*entity.Message
	err = pgxscan.Select(subCtx, r.db, &messages, finalQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to perform full-text search: %w", err)
	}

	return messages, totalRows, nil
}
func (r *messageRepository) RefreshConversationThreads(ctx context.Context) error {
	// ✅ Refresh specific materialized view untuk conversation threads
	_, err := r.db.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_threads")
	if err != nil {
		return fmt.Errorf("failed to refresh conversation threads: %w", err)
	}
	return nil
}
