package redisclient

import (
	"context"
	"errors"
	"social-forge/config"
	"social-forge/internal/infra/metrics"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var (
	RedisStorage *RedisClient
	redisOnce    sync.Once
)

type RedisClient struct {
	client  *redis.Client
	metrics *metrics.RedisMetrics
	config  *config.RedisConfig
	isUp    bool
}

func NewRedisClient(ctx context.Context, cfg *config.RedisConfig, metrics *metrics.RedisMetrics) (*RedisClient, error) {
	var initErr error
	redisOnce.Do(func() {
		if ctx == nil {
			ctx = context.Background()
		}
		subCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		client := redis.NewClient(&redis.Options{
			Addr:            cfg.GetAddr(),
			Password:        cfg.Password,
			DB:              cfg.DB,
			PoolSize:        100, // Default: 10
			MinIdleConns:    10,  // Default: 0
			ConnMaxIdleTime: 10 * time.Minute,
		})

		if _, err := client.Ping(subCtx).Result(); err != nil {
			initErr = err
			config.Logger.Error("Failed to connect to Redis",
				zap.String("host", cfg.GetAddr()),
				zap.Error(err))
			return
		}

		RedisStorage = &RedisClient{
			client:  client,
			metrics: metrics,
			isUp:    true,
			config:  cfg,
		}

		config.Logger.Info("Redis connected successfully",
			zap.String("host", cfg.GetAddr()),
			zap.Int("db", cfg.DB),
		)
	})
	if initErr != nil {
		return nil, initErr
	}
	return RedisStorage, nil
}
func GetRedis() (*RedisClient, error) {
	if RedisStorage == nil {
		return nil, errors.New("redis not initialized: call ConnectRedisClient first")
	}
	return RedisStorage, nil
}
