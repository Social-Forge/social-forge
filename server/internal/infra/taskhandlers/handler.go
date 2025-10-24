package taskhandlers

import (
	aiclient "social-forge/internal/infra/ai-client"
	asynqclient "social-forge/internal/infra/asynq-client"
	"social-forge/internal/infra/centrifugo"
	minioclient "social-forge/internal/infra/minio-client"

	"go.uber.org/zap"
)

const (
	// Messaging tasks
	TaskSendWhatsAppMessage     = "message:send:whatsapp"
	TaskSendWhatsappMetaMessage = "message:send:whatsapp:meta"
	TaskSendMessengerMessage    = "message:send:messenger"
	TaskSendInstagramMessage    = "message:send:instagram"
	TaskSendTelegramMessage     = "message:send:telegram"
	// AI tasks
	TaskGenerateAutoReply     = "ai:generate:auto_reply"
	TaskAnalyzeSentiment      = "ai:analyze:sentiment"
	TaskSummarizeConversation = "ai:summarize:conversation"
	// File processing tasks
	TaskProcessImageUpload = "file:process:image"
	TaskProcessVideoUpload = "file:process:video"
	TaskDeleteFiles        = "file:delete:bulk"
	// Notification tasks
	TaskSendEmailNotification = "notification:email"
	TaskBroadcastMessage      = "notification:broadcast"
	// Maintenance tasks
	TaskCleanupOldMessages = "maintenance:cleanup:messages"
	TaskGenerateReports    = "maintenance:reports:generate"
	TaskSyncChannelStatus  = "maintenance:sync:channels"
)

type TaskHandlers struct {
	logger      *zap.Logger
	aiClient    *aiclient.AIClient
	centrifugo  *centrifugo.CentrifugoClient
	minioClient *minioclient.MinioClient
	asynqClient *asynqclient.AsynqClientWrapper
}

func NewTaskHandlers(
	logger *zap.Logger,
	aiClient *aiclient.AIClient,
	centrifugo *centrifugo.CentrifugoClient,
	minioClient *minioclient.MinioClient,
	asynqClient *asynqclient.AsynqClientWrapper,
) *TaskHandlers {
	return &TaskHandlers{
		logger:      logger,
		aiClient:    aiClient,
		centrifugo:  centrifugo,
		minioClient: minioClient,
		asynqClient: asynqClient,
	}
}
func (h *TaskHandlers) RegisterAllHandlers() {
	// Messaging handlers
	h.asynqClient.RegisterHandlerFunc(TaskSendWhatsAppMessage, h.HandleSendWhatsAppMessage)
	h.asynqClient.RegisterHandlerFunc(TaskSendWhatsappMetaMessage, h.HandleSendWhatsappMetaMessage)
	h.asynqClient.RegisterHandlerFunc(TaskSendMessengerMessage, h.HandleSendMessengerMessage)
	h.asynqClient.RegisterHandlerFunc(TaskSendInstagramMessage, h.HandleSendInstagramMessage)
	h.asynqClient.RegisterHandlerFunc(TaskSendTelegramMessage, h.HandleSendTelegramMessage)

	// AI handlers
	h.asynqClient.RegisterHandlerFunc(TaskGenerateAutoReply, h.HandleGenerateAutoReply)
	h.asynqClient.RegisterHandlerFunc(TaskAnalyzeSentiment, h.HandleAnalyzeSentiment)
	h.asynqClient.RegisterHandlerFunc(TaskSummarizeConversation, h.HandleSummarizeConversation)

	// File processing handlers
	h.asynqClient.RegisterHandlerFunc(TaskProcessImageUpload, h.HandleProcessImageUpload)
	h.asynqClient.RegisterHandlerFunc(TaskProcessVideoUpload, h.HandleProcessVideoUpload)
	h.asynqClient.RegisterHandlerFunc(TaskDeleteFiles, h.HandleDeleteFiles)

	// Notification handlers
	h.asynqClient.RegisterHandlerFunc(TaskSendEmailNotification, h.HandleSendEmailNotification)
	h.asynqClient.RegisterHandlerFunc(TaskBroadcastMessage, h.HandleBroadcastMessage)

	// Maintenance handlers
	h.asynqClient.RegisterHandlerFunc(TaskCleanupOldMessages, h.HandleCleanupOldMessages)
	h.asynqClient.RegisterHandlerFunc(TaskGenerateReports, h.HandleGenerateReports)
	h.asynqClient.RegisterHandlerFunc(TaskSyncChannelStatus, h.HandleSyncChannelStatus)

	h.logger.Info("✅ All task handlers registered successfully")
}
