package seeders

import (
	"context"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (s *Seeder) ChannelSeed(ctx context.Context) error {
	subCtx, cancel := contextpool.WithTimeoutFallback(ctx, 10*time.Second)
	defer cancel()

	channels := []entity.Channel{
		{
			ID:          uuid.New(),
			Name:        "Whatsapp",
			Slug:        entity.ChannelWhatsApp,
			IconURL:     entity.NewNullString("/images/channel/whatsapp-unofficial.svg"),
			Description: entity.NewNullString("Whatsapp channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Meta Whatsapp",
			Slug:        entity.ChannelMetaWhatsApp,
			IconURL:     entity.NewNullString("/images/channel/whatsapp-official.svg"),
			Description: entity.NewNullString("Meta Whatsapp channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Meta Messenger",
			Slug:        entity.ChannelMetaMessenger,
			IconURL:     entity.NewNullString("/images/channel/messenger.svg"),
			Description: entity.NewNullString("Meta Messenger channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Instagram",
			Slug:        entity.ChannelInstagram,
			IconURL:     entity.NewNullString("/images/channel/instagram.svg"),
			Description: entity.NewNullString("Instagram channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Telegram",
			Slug:        entity.ChannelTelegram,
			IconURL:     entity.NewNullString("/images/channel/telegram.svg"),
			Description: entity.NewNullString("Telegram channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Web Chat",
			Slug:        entity.ChannelWebChat,
			IconURL:     entity.NewNullString("/images/channel/webchat.svg"),
			Description: entity.NewNullString("Web Chat channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Link Chat",
			Slug:        entity.ChannelLinkChat,
			IconURL:     entity.NewNullString("/images/channel/linkchat.svg"),
			Description: entity.NewNullString("Link Chat channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}
	var anyError error
	for _, channel := range channels {
		if err := s.channelRepo.Create(subCtx, &channel); err != nil {
			s.logger.Error("Failed to create role", zap.Error(err))
			if anyError == nil {
				anyError = err
			}
			continue
		}
	}
	if anyError != nil {
		s.logger.Error("Failed to seed channels", zap.Error(anyError))
		return anyError
	}
	s.logger.Info("Successfully seeded channels")
	return nil
}
