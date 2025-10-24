package asynqclient

import (
	"context"
	"errors"
	"fmt"
	"social-forge/config"
	"sync"
	"time"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

var (
	AsynqClientStorage *AsynqClientWrapper
	asynqOnce          sync.Once
)

type AsynqClientWrapper struct {
	client *asynq.Client
	server *asynq.Server
	mux    *asynq.ServeMux
	config *config.AsynqConfig
	logger *zap.Logger
	isUp   bool
	mu     sync.RWMutex
}

func NewAsynqClient(cfg *config.AsynqConfig, logger *zap.Logger) (*AsynqClientWrapper, error) {
	var initErr error
	asynqOnce.Do(func() {
		if cfg.RedisAddr == "" {
			initErr = errors.New("asynq redis address is required")
			logger.Error("Asynq Redis configuration missing")
			return
		}

		redisOpt := asynq.RedisClientOpt{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.DB,
		}

		client := asynq.NewClient(redisOpt)

		AsynqClientStorage = &AsynqClientWrapper{
			client: client,
			config: cfg,
			logger: logger,
			isUp:   true,
		}

		logger.Info("✅ Asynq client initialized successfully",
			zap.String("redis_addr", cfg.RedisAddr),
			zap.Int("db", cfg.DB),
		)
	})

	if initErr != nil {
		return nil, initErr
	}
	return AsynqClientStorage, nil
}
func (a *AsynqClientWrapper) NewAsynqServer() error {
	redisOpt := asynq.RedisClientOpt{
		Addr:     a.config.RedisAddr,
		Password: a.config.RedisPassword,
		DB:       1,
	}

	srv := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: a.config.Concurrency,
			Queues: map[string]int{
				"critical": 6, // Highest priority
				"default":  3, // Medium priority
				"low":      1, // Lowest priority
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				a.logger.Error("Task processing failed",
					zap.String("type", task.Type()),
					zap.Error(err),
				)
			}),
			RetryDelayFunc: func(n int, err error, task *asynq.Task) time.Duration {
				// Exponential backoff: 1min, 5min, 10min
				return time.Duration(n*n) * time.Minute
			},
		},
	)

	a.mu.Lock()
	a.server = srv
	a.mux = asynq.NewServeMux()
	a.mu.Unlock()

	a.logger.Info("✅ Asynq server initialized successfully",
		zap.Int("concurrency", a.config.Concurrency),
	)

	return nil
}
func GetAsynq() (*AsynqClientWrapper, error) {
	if AsynqClientStorage == nil {
		return nil, errors.New("asynq not initialized: call NewAsynqClient first")
	}
	return AsynqClientStorage, nil
}
func (a *AsynqClientWrapper) IsUp() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.isUp
}
func (a *AsynqClientWrapper) StartServer() error {
	a.mu.RLock()
	server := a.server
	mux := a.mux
	a.mu.RUnlock()

	if server == nil {
		return errors.New("asynq server not initialized: call NewAsynqServer first")
	}

	if mux == nil {
		return errors.New("asynq mux not initialized")
	}

	a.logger.Info("🚀 Starting Asynq server...")

	if err := server.Run(mux); err != nil {
		a.logger.Error("Asynq server failed to start",
			zap.Error(err),
		)
		return fmt.Errorf("failed to start asynq server: %w", err)
	}

	return nil
}
func (a *AsynqClientWrapper) RegisterHandler(pattern string, handler asynq.Handler) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.mux != nil {
		a.mux.Handle(pattern, handler)
		a.logger.Debug("Task handler registered",
			zap.String("pattern", pattern),
		)
	}
}
func (a *AsynqClientWrapper) RegisterHandlerFunc(pattern string, handler func(context.Context, *asynq.Task) error) {
	a.RegisterHandler(pattern, asynq.HandlerFunc(handler))
}
func (a *AsynqClientWrapper) ShutdownServer() {
	a.mu.RLock()
	server := a.server
	a.mu.RUnlock()

	if server != nil {
		a.logger.Info("Shutting down Asynq server...")
		server.Shutdown()
		a.logger.Info("✅ Asynq server shut down successfully")
	}
}
func (a *AsynqClientWrapper) Close() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client != nil {
		if err := a.client.Close(); err != nil {
			a.logger.Error("Failed to close Asynq client",
				zap.Error(err),
			)
			return err
		}
	}

	a.isUp = false
	a.logger.Info("✅ Asynq client closed successfully")
	return nil
}
func (a *AsynqClientWrapper) GetTaskInfo(queueName, taskID string) (*asynq.TaskInfo, error) {
	inspector := asynq.NewInspector(asynq.RedisClientOpt{
		Addr:     a.config.RedisAddr,
		Password: a.config.RedisPassword,
		DB:       1,
	})
	defer inspector.Close()

	return inspector.GetTaskInfo(queueName, taskID)
}
func (a *AsynqClientWrapper) DeleteTask(queueName, taskID string) error {
	inspector := asynq.NewInspector(asynq.RedisClientOpt{
		Addr:     a.config.RedisAddr,
		Password: a.config.RedisPassword,
		DB:       1,
	})
	defer inspector.Close()

	return inspector.DeleteTask(queueName, taskID)
}
