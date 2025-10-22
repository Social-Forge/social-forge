package dependencies

import (
	"context"
	"fmt"
	"social-forge/config"
	"social-forge/internal/infra/contextpool"
	"social-forge/internal/infra/metrics"
	minioclient "social-forge/internal/infra/minio-client"
	redisclient "social-forge/internal/infra/redis-client"
	"strings"
	"time"

	"go.uber.org/zap"
)

type Container struct {
	Logger       *zap.Logger
	DBPool       *config.Database
	AppMetrics   *metrics.AppMetrics
	RedisMetrics *metrics.RedisMetrics
	Redis        *redisclient.RedisClient
	Minio        *minioclient.MinioClient
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

	return &Container{
		Logger:       logger,
		AppMetrics:   metrics.GetAppMetrics(),
		RedisMetrics: metrics.GetRedisMetrics(),
		DBPool:       dbPool,
		Redis:        redis,
		Minio:        minio,
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
func (dep *Container) Close() error {
	var errs []error

	if dep.DBPool != nil {
		dep.DBPool.Close()
	}
	if dep.Redis != nil {
		if err := dep.Redis.Close(); err != nil {
			dep.Logger.Error("Redis shutdown error", zap.Error(err))
		} else {
			dep.Logger.Info("Redis connection closed successfully")
		}
	}
	if dep.Logger != nil {
		if err := dep.Logger.Sync(); err != nil {
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
