package dependencies

import (
	"context"
	"fmt"
	"social-forge/config"
	"social-forge/internal/infra/contextpool"
	"social-forge/internal/infra/metrics"
	minioclient "social-forge/internal/infra/minio-client"
	redisclient "social-forge/internal/infra/redis-client"
	"social-forge/internal/infra/repository"
	"strings"
	"time"

	"go.uber.org/zap"
)

type Container struct {
	Config           *config.Config
	Logger           *zap.Logger
	DBPool           *config.Database
	AppMetrics       *metrics.AppMetrics
	RedisMetrics     *metrics.RedisMetrics
	RedisClient      *redisclient.RedisClient
	MinioClient      *minioclient.MinioClient
	RoleRepo         *repository.RoleRepository
	PermissionRepo   *repository.PermissionRepository
	UserRepo         *repository.UserRepository
	TenantRepo       *repository.TenantRepository
	DivisionRepo     *repository.DivisionRepository
	ConversationRepo *repository.ConversationRepository
	MessageRepo      *repository.MessageRepository
	ContactRepo      *repository.ContactRepository
}

func NewContainer(ctx context.Context) (*Container, error) {
	init, err := config.Load()
	if err != nil {
		return nil, err
	}

	logger := config.GetLogger(&init.App)
	metrics.InitMetrics()

	dbPool, err := config.NewDatabase(ctx, &init.Database, &init.App)
	if err != nil {
		return nil, err
	}

	redis, err := initRedis(ctx, &init.Redis, metrics.GetRedisMetrics())
	if err != nil {
		return nil, err
	}
	minio, err := minioclient.NewMinioClient(ctx, &init.MinIO)
	if err != nil {
		return nil, err
	}

	roleRepo := repository.NewRoleRepository(dbPool.Pool)
	permissionRepo := repository.NewPermissionRepository(dbPool.Pool)
	userRepo := repository.NewUserRepository(dbPool.Pool)
	tenantRepo := repository.NewTenantRepository(dbPool.Pool)
	divisionRepo := repository.NewDivisionRepository(dbPool.Pool)
	// channelRepo := repository.NewChannelRepository(dbPool.Pool)
	conversationRepo := repository.NewConversationRepository(dbPool.Pool)
	messageRepo := repository.NewMessageRepository(dbPool.Pool)
	contactRepo := repository.NewContactRepository(dbPool.Pool)

	return &Container{
		Config:           init,
		Logger:           logger,
		AppMetrics:       metrics.GetAppMetrics(),
		RedisMetrics:     metrics.GetRedisMetrics(),
		DBPool:           dbPool,
		RedisClient:      redis,
		MinioClient:      minio,
		RoleRepo:         &roleRepo,
		PermissionRepo:   &permissionRepo,
		UserRepo:         &userRepo,
		TenantRepo:       &tenantRepo,
		DivisionRepo:     &divisionRepo,
		ConversationRepo: &conversationRepo,
		MessageRepo:      &messageRepo,
		ContactRepo:      &contactRepo,
	}, nil
}
func initRedis(
	ctx context.Context,
	cfg *config.RedisConfig,
	redisMetric *metrics.RedisMetrics,
) (*redisclient.RedisClient, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	redisclient.NewRedisClient(ctx, cfg, redisMetric)
	instance, err := redisclient.GetRedis()

	if err != nil || !instance.IsClosed() {
		return nil, fmt.Errorf("redis connection failed : %w", err)
	}

	return instance, nil
}
func (cont *Container) Close() error {
	var errs []error

	if cont.DBPool != nil {
		cont.DBPool.Close()
	}
	if cont.RedisClient != nil {
		if err := cont.RedisClient.Close(); err != nil {
			cont.Logger.Error("Redis shutdown error", zap.Error(err))
		} else {
			cont.Logger.Info("Redis connection closed successfully")
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

	return nil
}
func isHarmlessSyncError(err error) bool {
	return strings.Contains(err.Error(), "The handle is invalid") ||
		strings.Contains(err.Error(), "invalid argument")
}
