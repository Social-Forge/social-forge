package taskhandlers

import (
	"context"
	"encoding/json"
	"fmt"
	aiclient "social-forge/internal/infra/ai-client"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

type GenerateAutoReplyPayload struct {
	ConversationID  string `json:"conversation_id"`
	CustomerMessage string `json:"customer_message"`
	Context         string `json:"context"`
}
type AnalyzeSentimentPayload struct {
	MessageID string `json:"message_id"`
	Message   string `json:"message"`
}
type SummarizeConversationPayload struct {
	ConversationID string             `json:"conversation_id"`
	Messages       []aiclient.Message `json:"messages"`
}

func (h *TaskHandlers) HandleGenerateAutoReply(ctx context.Context, task *asynq.Task) error {
	var payload GenerateAutoReplyPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Generating auto reply",
		zap.String("conversation_id", payload.ConversationID),
	)

	if h.aiClient != nil && h.aiClient.IsUp() {
		reply, err := h.aiClient.GenerateAutoReply(ctx, payload.CustomerMessage, payload.Context)
		if err != nil {
			h.logger.Error("Failed to generate auto reply", zap.Error(err))
			return err
		}

		h.logger.Info("Auto reply generated",
			zap.String("conversation_id", payload.ConversationID),
			zap.String("reply", reply),
		)
	}

	return nil
}
func (h *TaskHandlers) HandleAnalyzeSentiment(ctx context.Context, task *asynq.Task) error {
	var payload AnalyzeSentimentPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Analyzing sentiment",
		zap.String("message_id", payload.MessageID),
	)

	if h.aiClient != nil && h.aiClient.IsUp() {
		sentiment, err := h.aiClient.AnalyzeSentiment(ctx, payload.Message)
		if err != nil {
			h.logger.Error("Failed to analyze sentiment", zap.Error(err))
			return err
		}

		h.logger.Info("Sentiment analyzed",
			zap.String("message_id", payload.MessageID),
			zap.String("sentiment", sentiment),
		)

		// TODO: Save sentiment to database
	}

	return nil
}
func (h *TaskHandlers) HandleSummarizeConversation(ctx context.Context, task *asynq.Task) error {
	var payload SummarizeConversationPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Summarizing conversation",
		zap.String("conversation_id", payload.ConversationID),
	)

	if h.aiClient != nil && h.aiClient.IsUp() {
		summary, err := h.aiClient.SummarizeConversation(ctx, payload.Messages)
		if err != nil {
			h.logger.Error("Failed to summarize conversation", zap.Error(err))
			return err
		}

		h.logger.Info("Conversation summarized",
			zap.String("conversation_id", payload.ConversationID),
			zap.String("summary", summary),
		)

		// TODO: Save summary to database
	}

	return nil
}
