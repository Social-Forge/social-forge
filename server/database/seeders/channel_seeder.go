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
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 5*time.Second)
	defer cancel()

	channels := []entity.Channel{
		{
			ID:          uuid.New(),
			Name:        "Whatsapp",
			Slug:        entity.ChannelWhatsApp,
			IconURL:     stringPtr("/images/channel/whatsapp-unofficial.svg"),
			Description: stringPtr("Whatsapp channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Meta Whatsapp",
			Slug:        entity.ChannelMetaWhatsApp,
			IconURL:     stringPtr("/images/channel/whatsapp-official.svg"),
			Description: stringPtr("Meta Whatsapp channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Meta Messenger",
			Slug:        entity.ChannelMetaMessenger,
			IconURL:     stringPtr("/images/channel/messenger.svg"),
			Description: stringPtr("Meta Messenger channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Instagram",
			Slug:        entity.ChannelInstagram,
			IconURL:     stringPtr("/images/channel/instagram.svg"),
			Description: stringPtr("Instagram channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Telegram",
			Slug:        entity.ChannelTelegram,
			IconURL:     stringPtr("/images/channel/telegram.svg"),
			Description: stringPtr("Telegram channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Web Chat",
			Slug:        entity.ChannelWebChat,
			IconURL:     stringPtr("/images/channel/webchat.svg"),
			Description: stringPtr("Web Chat channel"),
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			Name:        "Link Chat",
			Slug:        entity.ChannelLinkChat,
			IconURL:     stringPtr("/images/channel/linkchat.svg"),
			Description: stringPtr("Link Chat channel"),
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
