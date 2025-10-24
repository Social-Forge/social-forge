package asynqclient

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

func (a *AsynqClientWrapper) EnqueueTask(taskType string, payload interface{}, opts ...asynq.Option) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(taskType, payloadBytes, opts...)
	info, err := a.client.Enqueue(task)
	if err != nil {
		a.logger.Error("Failed to enqueue task",
			zap.String("type", taskType),
			zap.Error(err),
		)
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	a.logger.Debug("Task enqueued successfully",
		zap.String("type", taskType),
		zap.String("queue", info.Queue),
		zap.String("task_id", info.ID),
	)
	return nil
}
func (a *AsynqClientWrapper) EnqueueTaskAt(taskType string, payload interface{}, processAt time.Time, opts ...asynq.Option) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(taskType, payloadBytes, opts...)
	info, err := a.client.Enqueue(task, asynq.ProcessAt(processAt))
	if err != nil {
		a.logger.Error("Failed to enqueue scheduled task",
			zap.String("type", taskType),
			zap.Time("process_at", processAt),
			zap.Error(err),
		)
		return fmt.Errorf("failed to enqueue scheduled task: %w", err)
	}

	a.logger.Debug("Scheduled task enqueued successfully",
		zap.String("type", taskType),
		zap.Time("process_at", processAt),
		zap.String("task_id", info.ID),
	)
	return nil
}
func (a *AsynqClientWrapper) EnqueueTaskIn(taskType string, payload interface{}, delay time.Duration, opts ...asynq.Option) error {
	return a.EnqueueTaskAt(taskType, payload, time.Now().Add(delay), opts...)
}
func (a *AsynqClientWrapper) EnqueueCriticalTask(taskType string, payload interface{}) error {
	return a.EnqueueTask(taskType, payload, asynq.Queue("critical"), asynq.MaxRetry(5))
}
func (a *AsynqClientWrapper) EnqueueDefaultTask(taskType string, payload interface{}) error {
	return a.EnqueueTask(taskType, payload, asynq.Queue("default"), asynq.MaxRetry(3))
}
func (a *AsynqClientWrapper) EnqueueLowTask(taskType string, payload interface{}) error {
	return a.EnqueueTask(taskType, payload, asynq.Queue("low"), asynq.MaxRetry(1))
}
