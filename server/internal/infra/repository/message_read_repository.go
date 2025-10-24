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

type MessageReadRepository interface {
	Create(ctx context.Context, messageRead *entity.MessageRead) error
	Update(ctx context.Context, messageRead *entity.MessageRead) (*entity.MessageRead, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.MessageRead, error)
	FindByMessageID(ctx context.Context, messageID uuid.UUID) (*entity.MessageRead, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*entity.MessageRead, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.MessageRead, int64, error)
	SetRead(ctx context.Context, id uuid.UUID) error
	SetUnread(ctx context.Context, id uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
}
type messageReadRepository struct {
	*baseRepository
}

func NewMessageReadRepository(db *pgxpool.Pool) MessageReadRepository {
	return &messageReadRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *messageReadRepository) Create(ctx context.Context, messageRead *entity.MessageRead) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `INSERT INTO message_reads (user_id, message_id, user_id, read_at, created_at)
	VALUES ($1, $2, $3, $4, $5, $6)
	ON CONFLICT ON CONSTRAINT chk_message_reads_user_id_message_id DO NOTHING
	RETURNING id, created_at, updated_at`

	args := []interface{}{
		messageRead.UserID,
		messageRead.MessageID,
		messageRead.UserID,
		messageRead.ReadAt,
		messageRead.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&messageRead.ID,
		&messageRead.CreatedAt,
		&messageRead.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_message_reads_user_id_message_id":
				return nil
			default:
				return fmt.Errorf("unknown constraint: %w", err)
			}
		}
		return fmt.Errorf("query row failed: %w", err)
	}
	return nil
}
func (r *messageReadRepository) Update(ctx context.Context, messageRead *entity.MessageRead) (*entity.MessageRead, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE message_reads
	SET read_at = $1
	WHERE id = $2
	RETURNING id, user_id, message_id, user_id, read_at, created_at, updated_at`

	args := []interface{}{
		messageRead.ReadAt,
		messageRead.ID,
	}

	var updatedMessageRead entity.MessageRead
	if err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updatedMessageRead.ID,
		&updatedMessageRead.UserID,
		&updatedMessageRead.MessageID,
		&updatedMessageRead.UserID,
		&updatedMessageRead.ReadAt,
		&updatedMessageRead.CreatedAt,
		&updatedMessageRead.UpdatedAt,
	); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_message_reads_user_id_message_id":
				return nil, nil
			default:
				return nil, fmt.Errorf("unknown constraint: %w", err)
			}
		}
		return nil, fmt.Errorf("failed to update message read: %w", err)
	}
	return &updatedMessageRead, nil
}
func (r *messageReadRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.MessageRead, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM message_reads WHERE id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		id,
	}

	var messageRead entity.MessageRead
	if err := pgxscan.Get(subCtx, r.db, &messageRead, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find message read by id: %w", err)
	}
	return &messageRead, nil
}
func (r *messageReadRepository) FindByMessageID(ctx context.Context, messageID uuid.UUID) (*entity.MessageRead, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM message_reads WHERE message_id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		messageID,
	}

	var messageRead entity.MessageRead
	if err := pgxscan.Get(subCtx, r.db, &messageRead, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find message read by message id: %w", err)
	}
	return &messageRead, nil
}
func (r *messageReadRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*entity.MessageRead, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM message_reads WHERE user_id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		userID,
	}

	var messageRead entity.MessageRead
	if err := pgxscan.Get(subCtx, r.db, &messageRead, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find message read by user id: %w", err)
	}
	return &messageRead, nil
}
func (r *messageReadRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE message_reads SET deleted_at = NOW() WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete message read: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message read not found")
	}
	return nil
}
func (r *messageReadRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `DELETE FROM message_reads WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete message read: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message read not found")
	}
	return nil
}
func (r *messageReadRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE message_reads SET deleted_at = NULL WHERE id = $1`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore message read: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message read not found")
	}
	return nil
}
func (r *messageReadRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildQuery("SELECT COUNT(*) FROM message_reads", filter)
	query, args := qb.Build()

	var count int64
	if err := r.db.QueryRow(subCtx, query, args...).Scan(&count); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count message reads: %w", err)
	}
	return count, nil
}
func (r *messageReadRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.MessageRead, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildQuery("SELECT * FROM message_reads", opts.Filter)

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

	var messageReads []*entity.MessageRead
	if err := pgxscan.Select(subCtx, r.db, &messageReads, query, args...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to search message reads: %w", err)
	}
	return messageReads, totalRows, nil
}
func (r *messageReadRepository) SetRead(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE message_reads SET read_at = NOW() WHERE id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to set message read as read: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message read not found")
	}
	return nil
}
func (r *messageReadRepository) SetUnread(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `UPDATE message_reads SET read_at = NULL WHERE id = $1 AND deleted_at IS NULL`

	args := []interface{}{
		id,
	}

	cmdTag, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to set message read as unread: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("message read not found")
	}
	return nil
}

func (r *messageReadRepository) buildQuery(baseQuery string, filter *Filter) *QueryBuilder {
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

	if filter.UserID != nil {
		qb.Where("user_id = $1", filter.UserID)
	}
	if filter.Extra != nil {
		if messageId, ok := filter.Extra["message_id"].(uuid.UUID); ok {
			qb.Where("message_id = $2", messageId)
		}
	}
	return qb
}
