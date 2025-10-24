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

type ChannelRepository interface {
	Create(ctx context.Context, channel *entity.Channel) error
	Update(ctx context.Context, channel *entity.Channel) (*entity.Channel, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Channel, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Channel, error)
	IsExistSlug(ctx context.Context, slug string) (bool, error)
	IsExistName(ctx context.Context, name string) (bool, error)
	List(ctx context.Context) ([]*entity.Channel, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SetActiveInActive(ctx context.Context, id uuid.UUID, isActive bool) error
}
type channelRepository struct {
	*baseRepository
}

func NewChannelRepository(db *pgxpool.Pool) ChannelRepository {
	return &channelRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *channelRepository) Create(ctx context.Context, channel *entity.Channel) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		INSERT INTO channels (id, name, slug, icon_url, description, is_active, created_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (name, slug) DO NOTHING
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		channel.ID, channel.Name, channel.Slug, channel.IconURL, channel.Description, channel.IsActive, channel.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(&channel.ID, &channel.CreatedAt, &channel.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "channels_name_key":
				return fmt.Errorf("channel name '%s' already exists: %w", channel.Name, err)
			case "channels_slug_key":
				return fmt.Errorf("channel slug '%s' already exists: %w", channel.Slug, err)
			default:
				return fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return fmt.Errorf("failed to create channel: %w", err)
	}
	return nil
}
func (r *channelRepository) Update(ctx context.Context, channel *entity.Channel) (*entity.Channel, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE channels
		SET name = $1, slug = $2, icon_url = $3, description = $4, is_active = $5
		WHERE id = $6
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		channel.Name, channel.Slug, channel.IconURL, channel.Description, channel.IsActive, channel.ID,
	}

	updateChannel := entity.Channel{}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&updateChannel.ID, &updateChannel.CreatedAt, &updateChannel.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "channels_name_key":
				return nil, fmt.Errorf("channel name '%s' already exists: %w", updateChannel.Name, err)
			case "channels_slug_key":
				return nil, fmt.Errorf("channel slug '%s' already exists: %w", updateChannel.Slug, err)
			default:
				return nil, fmt.Errorf("unique constraint violation (%s): %w", pgErr.ConstraintName, err)
			}
		}
		return nil, fmt.Errorf("failed to update channel: %w", err)
	}
	return &updateChannel, nil
}
func (r *channelRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Channel, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM channels
		WHERE id = $1
	`
	args := []interface{}{id}

	channel := entity.Channel{}
	err := pgxscan.Get(subCtx, r.db, &channel, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("channel with ID '%s' not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to find channel by ID '%s': %w", id, err)
	}
	return &channel, nil
}
func (r *channelRepository) FindBySlug(ctx context.Context, slug string) (*entity.Channel, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM channels
		WHERE slug = $1
	`
	args := []interface{}{slug}

	channel := entity.Channel{}
	err := pgxscan.Get(subCtx, r.db, &channel, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("channel with slug '%s' not found: %w", slug, err)
		}
		return nil, fmt.Errorf("failed to find channel by slug '%s': %w", slug, err)
	}
	return &channel, nil
}
func (r *channelRepository) IsExistSlug(ctx context.Context, slug string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT EXISTS (
			SELECT 1 FROM channels
			WHERE slug = $1
		)
	`
	args := []interface{}{slug}

	var exists bool
	err := r.db.QueryRow(subCtx, query, args...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if channel with slug '%s' exists: %w", slug, err)
	}
	return exists, nil
}
func (r *channelRepository) IsExistName(ctx context.Context, name string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT EXISTS (
			SELECT 1 FROM channels
			WHERE name = $1
		)
	`
	args := []interface{}{name}

	var exists bool
	err := r.db.QueryRow(subCtx, query, args...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if channel with name '%s' exists: %w", name, err)
	}
	return exists, nil
}
func (r *channelRepository) List(ctx context.Context) ([]*entity.Channel, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM channels
	`
	args := []interface{}{}

	channels := []*entity.Channel{}
	err := pgxscan.Select(subCtx, r.db, &channels, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list channels: %w", err)
	}
	return channels, nil
}
func (r *channelRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM channels
		WHERE id = $1
	`
	args := []interface{}{id}

	_, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete channel with ID '%s': %w", id, err)
	}
	return nil
}
func (r *channelRepository) SetActiveInActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE channels
		SET is_active = $1
		WHERE id = $2
		RETURNING id, created_at, updated_at
	`
	args := []interface{}{isActive, id}

	updateChannel := entity.Channel{}
	err := r.db.QueryRow(subCtx, query, args...).Scan(&updateChannel.ID, &updateChannel.CreatedAt, &updateChannel.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to set channel with ID '%s' active/inactive: %w", id, err)
	}
	return nil
}
