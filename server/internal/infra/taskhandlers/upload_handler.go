package taskhandlers

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

type ProcessFilePayload struct {
	FileURL  string `json:"file_url"`
	FileName string `json:"file_name"`
	FileType string `json:"file_type"`
}
type DeleteFilesPayload struct {
	FileNames []string `json:"file_names"`
}

func (h *TaskHandlers) HandleProcessImageUpload(ctx context.Context, task *asynq.Task) error {
	var payload ProcessFilePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing image upload",
		zap.String("file_name", payload.FileName),
	)

	// TODO: Implement image processing (resize, compress, thumbnail generation)
	return nil
}
func (h *TaskHandlers) HandleProcessVideoUpload(ctx context.Context, task *asynq.Task) error {
	var payload ProcessFilePayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Processing video upload",
		zap.String("file_name", payload.FileName),
	)

	// TODO: Implement video processing (compress, generate thumbnail)
	return nil
}
func (h *TaskHandlers) HandleDeleteFiles(ctx context.Context, task *asynq.Task) error {
	var payload DeleteFilesPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %w", err)
	}

	h.logger.Info("Deleting files",
		zap.Int("count", len(payload.FileNames)),
	)

	if h.minioClient != nil && h.minioClient.IsUp() {
		if err := h.minioClient.MultiDeleteFiles(ctx, payload.FileNames); err != nil {
			h.logger.Error("Failed to delete files", zap.Error(err))
			return err
		}
	}

	return nil
}
