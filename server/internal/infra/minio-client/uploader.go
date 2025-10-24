package minioclient

import (
	"context"
	"fmt"
	"io"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/minio/minio-go/v7"
	"go.uber.org/zap"
)

func (m *MinioClient) IsUp() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.isUp
}

func (m *MinioClient) UploadFile(ctx context.Context, objectName string, reader io.Reader, objectSize int64, contentType string) (string, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 5*time.Minute)
	defer cancel()

	_, err := m.client.PutObject(
		ctx,
		m.bucketName,
		objectName,
		reader,
		objectSize,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		m.logger.Error("Failed to upload file to MinIO",
			zap.String("object", objectName),
			zap.Error(err),
		)
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate public URL
	fileURL := fmt.Sprintf("%s/%s/%s", m.config.PublicURL, m.bucketName, objectName)

	m.logger.Debug("File uploaded successfully",
		zap.String("object", objectName),
		zap.String("url", fileURL),
	)

	return fileURL, nil
}
func (m *MinioClient) UploadImage(ctx context.Context, objectName string, reader io.Reader, objectSize int64) (string, error) {
	return m.UploadFile(ctx, objectName, reader, objectSize, "image/jpeg")
}
func (m *MinioClient) UploadVideo(ctx context.Context, objectName string, reader io.Reader, objectSize int64) (string, error) {
	return m.UploadFile(ctx, objectName, reader, objectSize, "video/mp4")
}
func (m *MinioClient) UploadDocument(ctx context.Context, objectName string, reader io.Reader, objectSize int64) (string, error) {
	return m.UploadFile(ctx, objectName, reader, objectSize, "application/octet-stream")
}
func (m *MinioClient) DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 5*time.Minute)
	defer cancel()

	object, err := m.client.GetObject(ctx, m.bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		m.logger.Error("Failed to download file from MinIO",
			zap.String("object", objectName),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to download file: %w", err)
	}

	return object, nil
}
func (m *MinioClient) GetFileInfo(ctx context.Context, objectName string) (*minio.ObjectInfo, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 10*time.Second)
	defer cancel()

	info, err := m.client.StatObject(ctx, m.bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	return &info, nil
}
func (m *MinioClient) DeleteFile(ctx context.Context, objectName string) error {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 10*time.Second)
	defer cancel()

	err := m.client.RemoveObject(ctx, m.bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		m.logger.Error("Failed to delete file from MinIO",
			zap.String("object", objectName),
			zap.Error(err),
		)
		return fmt.Errorf("failed to delete file: %w", err)
	}

	m.logger.Debug("File deleted successfully",
		zap.String("object", objectName),
	)

	return nil
}
func (m *MinioClient) MultiDeleteFiles(ctx context.Context, objectNames []string) error {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 30*time.Second)
	defer cancel()

	objectsCh := make(chan minio.ObjectInfo)

	go func() {
		defer close(objectsCh)
		for _, name := range objectNames {
			objectsCh <- minio.ObjectInfo{Key: name}
		}
	}()

	errorCh := m.client.RemoveObjects(ctx, m.bucketName, objectsCh, minio.RemoveObjectsOptions{})
	for err := range errorCh {
		if err.Err != nil {
			m.logger.Error("Failed to delete file",
				zap.String("object", err.ObjectName),
				zap.Error(err.Err),
			)
			return fmt.Errorf("failed to delete file %s: %w", err.ObjectName, err.Err)
		}
	}

	return nil
}
func (m *MinioClient) ListFiles(ctx context.Context, prefix string) ([]string, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 30*time.Second)
	defer cancel()

	var fileNames []string

	objectCh := m.client.ListObjects(ctx, m.bucketName, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			m.logger.Error("Error listing files",
				zap.Error(object.Err),
			)
			return nil, fmt.Errorf("failed to list files: %w", object.Err)
		}
		fileNames = append(fileNames, object.Key)
	}

	return fileNames, nil
}
func (m *MinioClient) GetPresignedURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 10*time.Second)
	defer cancel()

	presignedURL, err := m.client.PresignedGetObject(ctx, m.bucketName, objectName, expiry, nil)
	if err != nil {
		m.logger.Error("Failed to generate presigned URL",
			zap.String("object", objectName),
			zap.Error(err),
		)
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}
func (m *MinioClient) GetPresignedUploadURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 10*time.Second)
	defer cancel()

	presignedURL, err := m.client.PresignedPutObject(ctx, m.bucketName, objectName, expiry)
	if err != nil {
		m.logger.Error("Failed to generate presigned upload URL",
			zap.String("object", objectName),
			zap.Error(err),
		)
		return "", fmt.Errorf("failed to generate presigned upload URL: %w", err)
	}

	return presignedURL.String(), nil
}
func (m *MinioClient) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.isUp = false
	m.logger.Info("✅ MinIO client closed")
	return nil
}
