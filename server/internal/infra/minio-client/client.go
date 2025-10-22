package minioclient

import (
	"context"
	"social-forge/config"
	"sync"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var (
	Minio     *MinioClient
	minioOnce sync.Once
)

type MinioClient struct {
	client *minio.Client
}

func NewMinioClient(ctx context.Context, cfg *config.MinIOConfig) (*MinioClient, error) {
	minioOnce.Do(func() {
		client, err := minio.New(cfg.Endpoint, &minio.Options{
			Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
			Secure: cfg.UseSSL,
		})
		if err != nil {
			return
		}
		Minio = &MinioClient{
			client: client,
		}
	})
	return Minio, nil
}
func GetMinioClient() *MinioClient {
	if Minio == nil {
		config.Logger.Error("Minio client not initialized")
	}
	return Minio
}
