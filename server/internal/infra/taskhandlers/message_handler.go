package taskhandlers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

type SendMessagePayload struct {
	ConversationID string                 `json:"conversation_id"`
	To             string                 `json:"to"`
	Message        string                 `json:"message"`
	MediaURL       string                 `json:"media_url,omitempty"`
	MediaType      string                 `json:"media_type,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

func (h *TaskHandlers) HandleSendWhatsAppMessage(ctx context.Context, task *asynq.Task) error {
	var payload SendMessagePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing WhatsApp message",
		zap.String("conversation_id", payload.ConversationID),
		zap.String("to", payload.To),
	)

	// TODO: Implement actual WhatsApp sending via whatsmeow
	// For now, just broadcast to Centrifugo
	if h.centrifugo != nil && h.centrifugo.IsUp() {
		messageData := map[string]interface{}{
			"id":              fmt.Sprintf("msg_%d", time.Now().Unix()),
			"conversation_id": payload.ConversationID,
			"content":         payload.Message,
			"sender":          "system",
			"timestamp":       time.Now().Unix(),
			"channel":         "whatsapp",
		}

		if err := h.centrifugo.BroadcastNewMessage(ctx, payload.ConversationID, messageData); err != nil {
			h.logger.Error("Failed to broadcast message", zap.Error(err))
		}
	}

	return nil
}
func (h *TaskHandlers) HandleSendWhatsappMetaMessage(ctx context.Context, task *asynq.Task) error {
	var payload SendMessagePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing WhatsApp message",
		zap.String("conversation_id", payload.ConversationID),
		zap.String("to", payload.To),
	)

	// TODO: Implement actual WhatsApp sending via meta message
	// For now, just broadcast to Centrifugo
	if h.centrifugo != nil && h.centrifugo.IsUp() {
		messageData := map[string]interface{}{
			"id":              fmt.Sprintf("msg_%d", time.Now().Unix()),
			"conversation_id": payload.ConversationID,
			"content":         payload.Message,
			"sender":          "system",
			"timestamp":       time.Now().Unix(),
			"channel":         "whatsapp",
		}

		if err := h.centrifugo.BroadcastNewMessage(ctx, payload.ConversationID, messageData); err != nil {
			h.logger.Error("Failed to broadcast message", zap.Error(err))
		}
	}

	return nil
}
func (h *TaskHandlers) HandleSendMessengerMessage(ctx context.Context, task *asynq.Task) error {
	var payload SendMessagePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing Messenger message",
		zap.String("conversation_id", payload.ConversationID),
		zap.String("to", payload.To),
	)

	// TODO: Implement actual Messenger sending via Meta API
	return nil
}
func (h *TaskHandlers) HandleSendInstagramMessage(ctx context.Context, task *asynq.Task) error {
	var payload SendMessagePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing Instagram message",
		zap.String("conversation_id", payload.ConversationID),
		zap.String("to", payload.To),
	)

	// TODO: Implement actual Instagram sending via Meta API
	return nil
}
func (h *TaskHandlers) HandleSendTelegramMessage(ctx context.Context, task *asynq.Task) error {
	var payload SendMessagePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing Telegram message",
		zap.String("conversation_id", payload.ConversationID),
		zap.String("to", payload.To),
	)

	// TODO: Implement actual Telegram sending via Telegram Bot API
	return nil
}
