package dependencies

import (
	"context"
	"fmt"
	"social-forge/config"
	"social-forge/internal/helpers"
	aiclient "social-forge/internal/infra/ai-client"
	asynqclient "social-forge/internal/infra/asynq-client"
	"social-forge/internal/infra/centrifugo"
	"social-forge/internal/infra/contextpool"
	"social-forge/internal/infra/metrics"
	minioclient "social-forge/internal/infra/minio-client"
	redisclient "social-forge/internal/infra/redis-client"
	"social-forge/internal/infra/repository"
	"social-forge/internal/infra/taskhandlers"
	"strings"
	"time"

	"go.uber.org/zap"
)

type Container struct {
	Config                 *config.Config
	Logger                 *zap.Logger
	Notifier               config.Notifier
	DBPool                 *config.Database
	AppMetrics             *metrics.AppMetrics
	RedisMetrics           *metrics.RedisMetrics
	RedisClient            *redisclient.RedisClient
	CentrifugoClient       *centrifugo.CentrifugoClient
	AsynqClient            *asynqclient.AsynqClientWrapper
	MinioClient            *minioclient.MinioClient
	AIClient               *aiclient.AIClient
	TaskHandlers           *taskhandlers.TaskHandlers
	RoleRepo               repository.RoleRepository
	PermissionRepo         repository.PermissionRepository
	UserRepo               repository.UserRepository
	SessionRepo            repository.SessionRepository
	TokenRepo              repository.TokenRepository
	TenantRepo             repository.TenantRepository
	UserTenantRepo         repository.UserTenantRepository
	DivisionRepo           repository.DivisionRepository
	ChannelRepo            repository.ChannelRepository
	ChannelIntegrationRepo repository.ChannelIntegrationRepository
	ConversationRepo       repository.ConversationRepository
	MessageRepo            repository.MessageRepository
	MessageReadRepo        repository.MessageReadRepository
	AgentAssignmentRepo    repository.AgentAssignmentRepository
	ContactRepo            repository.ContactRepository
	QuickReplyRepo         repository.QuickReplyRepository
	AutoReplyRepo          repository.AutoReplyRepository
	LabelRepo              repository.LabelRepository
	PageRepo               repository.PageRepository
	PageSectionRepo        repository.PageSectionRepository
	WorkingHourRepo        repository.WorkingHourRepository
	WebhookLogRepo         repository.WebhookLogRepository
	UserHelper             *helpers.UserHelper
	TokenHelper            *helpers.TokenHelper
	TenantHelper           *helpers.TenantHelper
	AuthHelper             *helpers.AuthHelper
	SecretHelper           *helpers.SecretHelper
}

func NewContainer(ctx context.Context) (*Container, error) {
	init, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	logger := config.GetLogger(&init.App)

	notifier, err := config.NewUnifiedNotifier(5, 100, 3*time.Second, &init.Telegram)
	if err != nil {
		return nil, fmt.Errorf("notifier worker initialization failed: %w", err)
	}

	metrics.InitMetrics()

	dbPool, err := config.NewDatabase(ctx, &init.Database, &init.App, notifier)
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	redis, err := initRedis(ctx, &init.Redis, metrics.GetRedisMetrics(), notifier)
	if err != nil {
		return nil, fmt.Errorf("failed to create redis client: %w", err)
	}

	centrifugoClient, err := centrifugo.NewCentrifugoClient(ctx, &init.Centrifugo, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create centrifugo client: %w", err)
	}

	minio, err := minioclient.NewMinioClient(ctx, &init.MinIO, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	asynqClient, err := asynqclient.NewAsynqClient(&init.Asynq, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create asynq client: %w", err)
	}

	if asynqClient != nil {
		if err = asynqClient.NewAsynqServer(); err != nil {
			logger.Warn("Asynq server initialization failed", zap.Error(err))
		}
	}

	aiClient, err := aiclient.NewAIClient(&init.AI, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create ai client: %w", err)
	}

	roleRepo := repository.NewRoleRepository(dbPool.Pool)
	permissionRepo := repository.NewPermissionRepository(dbPool.Pool)
	userRepo := repository.NewUserRepository(dbPool.Pool)
	sessionRepo := repository.NewSessionRepository(dbPool.Pool)
	tokenRepo := repository.NewTokenRepository(dbPool.Pool)
	tenantRepo := repository.NewTenantRepository(dbPool.Pool)
	userTenantRepo := repository.NewUserTenantRepository(dbPool.Pool)
	divisionRepo := repository.NewDivisionRepository(dbPool.Pool)
	channelRepo := repository.NewChannelRepository(dbPool.Pool)
	channelIntegrationRepo := repository.NewChannelIntegrationRepository(dbPool.Pool)
	conversationRepo := repository.NewConversationRepository(dbPool.Pool)
	messageRepo := repository.NewMessageRepository(dbPool.Pool)
	messageReadRepo := repository.NewMessageReadRepository(dbPool.Pool)
	agentAssignmentRepo := repository.NewAgentAssignmentRepository(dbPool.Pool)
	contactRepo := repository.NewContactRepository(dbPool.Pool)
	quickReplyRepo := repository.NewQuickReplyRepository(dbPool.Pool)
	autoReplyRepo := repository.NewAutoReplyRepository(dbPool.Pool)
	labelRepo := repository.NewLabelRepository(dbPool.Pool)
	pageRepo := repository.NewPageRepository(dbPool.Pool)
	pageSectionRepo := repository.NewPageSectionRepository(dbPool.Pool)
	workingHourRepo := repository.NewWorkingHourRepositoryImpl(dbPool.Pool)
	webhookLogRepo := repository.NewWebhookLogRepository(dbPool.Pool)

	var taskHandlers *taskhandlers.TaskHandlers
	if asynqClient != nil && aiClient != nil && centrifugoClient != nil && minio != nil {
		taskHandlers = taskhandlers.NewTaskHandlers(
			logger,
			aiClient,
			centrifugoClient,
			minio,
			asynqClient,
		)
		taskHandlers.RegisterAllHandlers()
		logger.Info("✅ Task handlers registered successfully")
	}

	userHelper := helpers.NewUserHelper(redis, userRepo)
	tokenHelper := helpers.NewTokenHelper(redis)
	authHelper := helpers.NewAuthHelper(userHelper, tokenHelper, &init.Email)

	tenantHelper := helpers.NewTenantHelper(redis, userRepo, tenantRepo, logger)
	secretHelper, err := helpers.NewSecretHelper(init.App.EncryptionKey, logger)
	if err != nil {
		logger.Error("Failed to create secret helper", zap.Error(err))
	}

	if err := tenantHelper.InitAllowedTenantIDs(ctx); err != nil {
		logger.Error("Failed to init allowed tenant ids", zap.Error(err))
	}
	go tenantHelper.StartTenantRefreshSubscribe(ctx)

	return &Container{
		Config:                 init,
		Logger:                 logger,
		Notifier:               notifier,
		AppMetrics:             metrics.GetAppMetrics(),
		RedisMetrics:           metrics.GetRedisMetrics(),
		DBPool:                 dbPool,
		RedisClient:            redis,
		CentrifugoClient:       centrifugoClient,
		AsynqClient:            asynqClient,
		MinioClient:            minio,
		AIClient:               aiClient,
		TaskHandlers:           taskHandlers,
		RoleRepo:               roleRepo,
		PermissionRepo:         permissionRepo,
		UserRepo:               userRepo,
		SessionRepo:            sessionRepo,
		TokenRepo:              tokenRepo,
		TenantRepo:             tenantRepo,
		UserTenantRepo:         userTenantRepo,
		DivisionRepo:           divisionRepo,
		ChannelRepo:            channelRepo,
		ChannelIntegrationRepo: channelIntegrationRepo,
		ConversationRepo:       conversationRepo,
		MessageRepo:            messageRepo,
		MessageReadRepo:        messageReadRepo,
		ContactRepo:            contactRepo,
		AgentAssignmentRepo:    agentAssignmentRepo,
		QuickReplyRepo:         quickReplyRepo,
		AutoReplyRepo:          autoReplyRepo,
		LabelRepo:              labelRepo,
		PageRepo:               pageRepo,
		PageSectionRepo:        pageSectionRepo,
		WorkingHourRepo:        workingHourRepo,
		WebhookLogRepo:         webhookLogRepo,
		UserHelper:             userHelper,
		TokenHelper:            tokenHelper,
		TenantHelper:           tenantHelper,
		AuthHelper:             authHelper,
		SecretHelper:           secretHelper,
	}, nil
}
func initRedis(
	ctx context.Context,
	cfg *config.RedisConfig,
	redisMetric *metrics.RedisMetrics,
	notifier config.Notifier,
) (*redisclient.RedisClient, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	_, err := redisclient.NewRedisClient(ctx, cfg, redisMetric)
	if err != nil {
		return nil, fmt.Errorf("redis initialization failed: %w", err)
	}

	instance, err := redisclient.GetRedis()
	if err != nil {
		notifier.SendAlert(config.AlertRequest{
			Subject: "Critical Redis connection failure",
			Message: err.Error(),
			Metadata: map[string]interface{}{
				"timestamp": time.Now(),
			},
		})
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	if instance.IsClosed() {
		return nil, fmt.Errorf("redis connection is closed")
	}

	return instance, nil
}
func (cont *Container) Close() error {
	var errs []error

	cont.Logger.Info("🔄 Starting graceful shutdown...")

	if cont.DBPool != nil {
		if err := cont.DBPool.Close(); err != nil {
			cont.Logger.Error("Database shutdown error", zap.Error(err))
			errs = append(errs, fmt.Errorf("database shutdown error: %w", err))
		} else {
			cont.Logger.Info("✅ Database connection closed successfully")
		}
	}
	if cont.RedisClient != nil {
		if err := cont.RedisClient.Close(); err != nil {
			cont.Logger.Error("Redis shutdown error", zap.Error(err))
			errs = append(errs, fmt.Errorf("redis shutdown error: %w", err))
		} else {
			cont.Logger.Info("✅ Redis connection closed successfully")
		}
	}
	if cont.AsynqClient != nil {
		cont.AsynqClient.ShutdownServer()
		if err := cont.AsynqClient.Close(); err != nil {
			cont.Logger.Error("Asynq shutdown error", zap.Error(err))
		} else {
			cont.Logger.Info("Asynq closed successfully")
		}
	}
	if cont.CentrifugoClient != nil {
		if err := cont.CentrifugoClient.Close(); err != nil {
			cont.Logger.Error("Centrifugo shutdown error", zap.Error(err))
			errs = append(errs, fmt.Errorf("centrifugo shutdown error: %w", err))
		} else {
			cont.Logger.Info("✅ Centrifugo connection closed successfully")
		}
	}
	if cont.AIClient != nil {
		if err := cont.AIClient.Close(); err != nil {
			cont.Logger.Error("AI shutdown error", zap.Error(err))
			errs = append(errs, fmt.Errorf("ai shutdown error: %w", err))
		} else {
			cont.Logger.Info("✅ AI connection closed successfully")
		}
	}
	if cont.MinioClient != nil {
		// MinIO client doesn't typically need explicit closing
		if err := cont.MinioClient.Close(); err != nil {
			cont.Logger.Error("MinIO shutdown error", zap.Error(err))
			errs = append(errs, fmt.Errorf("minio shutdown error: %w", err))
		} else {
			cont.Logger.Info("✅ MinIO client closed successfully")
		}
	}
	if cont.Logger != nil {
		if err := cont.Logger.Sync(); err != nil {
			// Handle known harmless errors (e.g., Windows file handle)
			if !isHarmlessSyncError(err) {
				errs = append(errs, fmt.Errorf("logger sync error: %w", err))
			}
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors during shutdown: %v", errs)
	}

	cont.Logger.Info("✅ All services shut down gracefully")
	return nil
}
func isHarmlessSyncError(err error) bool {
	errMsg := err.Error()
	return strings.Contains(errMsg, "The handle is invalid") ||
		strings.Contains(errMsg, "invalid argument") ||
		strings.Contains(errMsg, "bad file descriptor")
}

// GetDB returns the database connection pool
func (cont *Container) GetDB() *config.Database {
	return cont.DBPool
}

// GetRedis returns the Redis client
func (cont *Container) GetRedis() *redisclient.RedisClient {
	return cont.RedisClient
}

// GetLogger returns the logger instance
func (cont *Container) GetLogger() *zap.Logger {
	return cont.Logger
}

// GetConfig returns the application configuration
func (cont *Container) GetConfig() *config.Config {
	return cont.Config
}
