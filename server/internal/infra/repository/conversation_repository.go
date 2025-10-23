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

type ConversationRepository interface {
	BaseRepository
	Create(ctx context.Context, conv *entity.Conversation) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Conversation, error)
	FindByContactID(ctx context.Context, contactID uuid.UUID) ([]*entity.Conversation, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error)
	ListByAgent(ctx context.Context, agentID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error)
	ListByDivision(ctx context.Context, divisionID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error)
	Count(ctx context.Context, tenantID uuid.UUID, filter *Filter) (int64, error)
	Update(ctx context.Context, conv *entity.Conversation) (*entity.Conversation, error)
	AssignToAgent(ctx context.Context, id uuid.UUID, agentID uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) (string, error)
	IncrementMessageCount(ctx context.Context, id uuid.UUID) error
}

type conversationRepository struct {
	*baseRepository
}

func NewConversationRepository(db *pgxpool.Pool) ConversationRepository {
	return &conversationRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *conversationRepository) Create(ctx context.Context, conv *entity.Conversation) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `
		INSERT INTO conversations (id, tenant_id, division_id, contact_id, assigned_agent_id, 
		channel_integration_id, status, priority, message_count, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT ON CONSTRAINT chk_conversation_tenant_id_division_id_assigned_agent_id_contact_id_channel_integration_id
		DO UPDATE SET
			status = EXCLUDED.status,
			priority = EXCLUDED.priority,
			message_count = EXCLUDED.message_count
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		conv.ID,
		conv.TenantID,
		conv.DivisionID,
		conv.ContactID,
		conv.AssignedAgentID,
		conv.ChannelIntegrationID,
		conv.Status,
		conv.Priority,
		conv.MessageCount,
		conv.CreatedAt,
	}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&conv.ID, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("conversation not found: %w", err)
		}
		return fmt.Errorf("failed to create conversation: %w", err)
	}
	return nil
}
func (r *conversationRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Conversation, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `SELECT * FROM conversations WHERE id = $1 AND deleted_at IS NULL`
	args := []interface{}{id}
	conv := &entity.Conversation{}
	err := pgxscan.Get(subCtx, r.db, conv, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find conversation: %w", err)
	}
	return conv, nil
}
func (r *conversationRepository) FindByContactID(ctx context.Context, contactID uuid.UUID) ([]*entity.Conversation, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `SELECT * FROM conversations WHERE contact_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`
	args := []interface{}{contactID}
	var conversations []*entity.Conversation
	err := pgxscan.Select(subCtx, r.db, &conversations, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find conversations by contact id: %w", err)
	}
	return conversations, nil
}
func (r *conversationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	if opts.Filter == nil {
		opts.Filter = &Filter{}
	}
	opts.Filter.TenantID = &tenantID

	totalRows, err := r.Count(ctx, tenantID, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	// Get data
	qb := r.buildBaseQuery("SELECT * FROM conversations", opts.Filter)

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
	var conversations []*entity.Conversation

	err = pgxscan.Select(subCtx, r.db, &conversations, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to list conversations by tenant id: %w", err)
	}
	return conversations, totalRows, nil
}
func (r *conversationRepository) ListByAgent(ctx context.Context, agentID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}
	if opts.Filter == nil {
		opts.Filter = &Filter{}
	}
	opts.Filter.AssignedAgentID = &agentID

	totalRows, err := r.countQuery(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	// Get data
	qb := r.buildBaseQuery("SELECT * FROM conversations", opts.Filter)

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

	var conversations []*entity.Conversation
	err = pgxscan.Select(subCtx, r.db, &conversations, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to list conversations by agent id: %w", err)
	}
	return conversations, totalRows, nil
}
func (r *conversationRepository) ListByDivision(ctx context.Context, divisionID uuid.UUID, opts *ListOptions) ([]*entity.Conversation, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}
	if opts.Filter == nil {
		opts.Filter = &Filter{}
	}
	opts.Filter.DivisionID = &divisionID

	totalRows, err := r.countQuery(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	// Get data
	qb := r.buildBaseQuery("SELECT * FROM conversations", opts.Filter)

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

	var conversations []*entity.Conversation
	err = pgxscan.Select(subCtx, r.db, &conversations, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to list conversations by division id: %w", err)
	}
	return conversations, totalRows, nil
}
func (r *conversationRepository) Count(ctx context.Context, tenantID uuid.UUID, filter *Filter) (int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM conversations", filter)
	qb.Where("tenant_id = $?", tenantID)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count conversations: %w", err)
	}
	return count, nil
}
func (r *conversationRepository) Update(ctx context.Context, conv *entity.Conversation) (*entity.Conversation, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE FROM conversations
	SET status = $1, priority = $2, assigned_agent_id = $3
	WHERE id = $4 AND deleted_at IS NULL
	ON CONFLICT ON CONSTRAINT chk_conversation_tenant_id_division_id_assigned_agent_id_contact_id_channel_integration_id DO UPDATE
	SET status = EXCLUDED.status,
		priority = EXCLUDED.priority,
		assigned_agent_id = EXCLUDED.assigned_agent_id
	RETURNING id, tenant_id, division_id, contact_id, assigned_agent_id, channel_integration_id, status, priority, 
	label_ids, tags, first_message_at, last_message_at, assigned_at, resolved_at, closed_at, 
	message_count, agent_response_time, metadata, created_at, updated_at`

	args := []interface{}{
		conv.Status,
		conv.Priority,
		conv.AssignedAgentID,
		conv.ID,
	}

	var updateConv entity.Conversation
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updateConv.ID,
		&updateConv.TenantID,
		&updateConv.DivisionID,
		&updateConv.ContactID,
		&updateConv.AssignedAgentID,
		&updateConv.ChannelIntegrationID,
		&updateConv.Status,
		&updateConv.Priority,
		&updateConv.LabelIDs,
		&updateConv.Tags,
		&updateConv.FirstMessageAt,
		&updateConv.LastMessageAt,
		&updateConv.AssignedAt,
		&updateConv.ResolvedAt,
		&updateConv.ClosedAt,
		&updateConv.MessageCount,
		&updateConv.AgentResponseTime,
		&updateConv.Metadata,
		&updateConv.CreatedAt,
		&updateConv.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("conversation not found: %w", err)
		}
		return nil, fmt.Errorf("failed to update conversation: %w", err)
	}
	return &updateConv, nil
}
func (r *conversationRepository) AssignToAgent(ctx context.Context, id uuid.UUID, agentID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE conversations
	SET assigned_agent_id = $1, status = 'assigned', assigned_at = NOW()
	WHERE id = $2 AND deleted_at IS NULL
	RETURNING id, created_at, updated_at`

	args := []interface{}{
		agentID,
		id,
	}

	var convID uuid.UUID
	var createdAt time.Time
	var updatedAt time.Time
	err := r.db.QueryRow(subCtx, query, args...).Scan(&convID, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("conversation not found: %w", err)
		}
		return fmt.Errorf("failed to assign conversation to agent: %w", err)
	}
	return nil
}
func (r *conversationRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE conversations
	SET status = $1, updated_at = NOW()
	WHERE id = $2 AND deleted_at IS NULL
	RETURNING status`

	args := []interface{}{
		status,
		id,
	}

	var updatedStatus string
	err := r.db.QueryRow(subCtx, query, args...).Scan(&updatedStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("conversation not found: %w", err)
		}
		return "", fmt.Errorf("failed to update conversation status: %w", err)
	}
	return updatedStatus, nil
}
func (r *conversationRepository) IncrementMessageCount(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE conversations
	SET message_count = message_count + 1, last_message_at = NOW()
	WHERE id = $1 AND deleted_at IS NULL
	RETURNING id, message_count`

	args := []interface{}{
		id,
	}

	var convID uuid.UUID
	var messageCount int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&convID, &messageCount)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("conversation not found: %w", err)
		}
		return fmt.Errorf("failed to increment message count: %w", err)
	}
	return nil
}

// Helpers
func (r *conversationRepository) countQuery(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM conversations", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count conversations: %w", err)
	}
	return count, nil
}
func (r *conversationRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
	qb := NewQueryBuilder(baseQuery)

	// Handle nil filter
	if filter == nil {
		qb.Where("deleted_at IS NULL")
		return qb
	}

	// ✅ Tenant ID filter (jika ada)
	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", *filter.TenantID)
	}

	// ✅ Assigned Agent ID filter (jika ada)
	if filter.AssignedAgentID != nil {
		qb.Where("assigned_agent_id = $?", *filter.AssignedAgentID)
	}

	// ✅ Division ID filter (jika ada)
	if filter.DivisionID != nil {
		qb.Where("division_id = $?", *filter.DivisionID)
	}
	// Deleted filter
	if filter.IncludeDeleted != nil && *filter.IncludeDeleted {
		qb.Where("deleted_at IS NOT NULL")
	} else {
		qb.Where("deleted_at IS NULL")
	}

	// Other filters
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(first_message_at::text ILIKE $? OR last_message_at::text ILIKE $?)",
			searchPattern, searchPattern)
	}
	if filter.Status != "" {
		qb.Where("status = $?", filter.Status)
	}
	if filter.UserID != nil {
		qb.Where("assigned_agent_id = $?", *filter.UserID)
	}

	if filter.Extra != nil {
		for key, value := range filter.Extra {
			if !isValidColumnName(key) {
				continue // Skip invalid keys
			}
			qb.Where(key+" = $?", value)
		}
	}

	return qb
}
