package whatsapp

import (
	"context"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.uber.org/zap"
)

// Read Docs : https://github.com/tulir/whatsmeow/issues/786#issuecomment-2789082287

type WhatsappClient struct {
	Client *whatsmeow.Client
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewWhatsappClient(ctx context.Context, db *pgxpool.Pool, addr string, logger *zap.Logger) *WhatsappClient {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 5*time.Second)
	defer cancel()

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	container, err := sqlstore.New(subCtx, "postgres", addr, clientLog)
	if err != nil {
		logger.Fatal("Failed to create SQL store", zap.Error(err))
	}

	deviceStore, err := container.GetAllDevices(subCtx)
	if err != nil {
		logger.Error("Failed to get all devices", zap.Error(err))
	}
	if len(deviceStore) == 0 {
		logger.Warn("No devices found")
	}

	waClient := whatsmeow.NewClient(deviceStore[0], clientLog)
	return &WhatsappClient{
		Client: waClient,
		logger: logger,
		db:     db,
	}
}
