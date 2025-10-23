package repository

import (
	"context"
	"social-forge/internal/entity"

	"github.com/google/uuid"
)

type ChannelRepository interface {
	Create(ctx context.Context, channel *entity.Channel) (*entity.Channel, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Channel, error)
	FindBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*entity.Channel, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Channel, int64, error)
	Update(ctx context.Context, channel *entity.Channel) (*entity.Channel, error)
	Delete(ctx context.Context, id uuid.UUID) error
}
