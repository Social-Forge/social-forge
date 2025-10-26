package helpers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"social-forge/config"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	redisclient "social-forge/internal/infra/redis-client"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type TokenHelper struct {
	client *redisclient.RedisClient
}

func NewTokenHelper(client *redisclient.RedisClient) *TokenHelper {
	return &TokenHelper{client: client}
}
func (ts *TokenHelper) StoreSessionCSRF(ctx context.Context, token string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("csrf:%s", token)
	return ts.client.SetAny(subCtx, keys, token, 1*time.Minute)
}
func (ts *TokenHelper) GetCSRFBySession(ctx context.Context, token string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("csrf:%s", token)
	return ts.client.GetString(subCtx, keys)
}
func (ts *TokenHelper) ClearCSRFBySession(ctx context.Context, token string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("csrf:%s", token)
	return ts.client.DeleteCache(subCtx, keys)
}
func (ts *TokenHelper) SetSessionToken(ctx context.Context, token string, metadata *entity.TokenMetadata, expiry time.Duration) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("access_token:%s", token)
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}
	return ts.client.Setbyte(subCtx, keys, metadataJSON, expiry)
}
func (ts *TokenHelper) GetSessionTokenMetadata(ctx context.Context, token string) (*entity.TokenMetadata, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("access_token:%s", token)
	data, err := ts.client.GetByte(subCtx, keys)
	if err != nil {
		return nil, fmt.Errorf("failed to get token metadata from cache storage : %w", err)
	}

	var metadata entity.TokenMetadata
	if err := json.Unmarshal([]byte(data), &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &metadata, nil
}
func (ts *TokenHelper) IsSessionTokenRevoked(ctx context.Context, token string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("revoked_token:%s", token)
	return ts.client.GetBool(subCtx, keys)
}
func (ts *TokenHelper) RevokeSessionToken(ctx context.Context, token string, remainingTTL time.Duration) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("revoked_token:%s", token)
	return ts.client.SetAny(subCtx, keys, "revoked", remainingTTL)
}
func (ts *TokenHelper) ClearSessionToken(ctx context.Context, token string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("access_token:%s", token)
	return ts.client.DeleteCache(subCtx, keys)
}
func (ts *TokenHelper) DeleteAllExceptCurrent(ctx context.Context, currentToken string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	currentMeta, err := ts.GetSessionTokenMetadata(subCtx, currentToken)
	if err != nil {
		return fmt.Errorf("failed to get current token metadata: %w", err)
	}

	var deletedCount int
	var cursor uint64
	var lastErr error
	// SCAN loop
	for {
		keys, nextCursor, err := ts.client.Client().Scan(subCtx, cursor, "access_token:*", 100).Result()
		if err != nil {
			lastErr = fmt.Errorf("scan failed: %w", err)
			break
		}
		for _, key := range keys {
			if strings.Contains(key, currentToken) {
				continue
			}

			metaJson, err := ts.client.Client().Get(subCtx, key).Result()
			if err != nil && !errors.Is(err, redis.Nil) {
				config.Logger.Warn("Failed to get token metadata", zap.Error(err))
				continue
			}

			var meta entity.TokenMetadata
			if err := json.Unmarshal([]byte(metaJson), &meta); err != nil {
				config.Logger.Warn("Failed to unmarshal token metadata", zap.Error(err))
				continue
			}

			if meta.UserID == currentMeta.UserID {
				if err := ts.client.Client().Del(subCtx, key).Err(); err != nil {
					lastErr = fmt.Errorf("failed to delete token %s: %w", key, err)
					continue
				}
				deletedCount++
			}
		}

		if nextCursor == 0 {
			break
		}
		cursor = nextCursor
	}

	return lastErr

}
func (ts *TokenHelper) ClearAllSessionToken(ctx context.Context, token, domain string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	csrfKey := fmt.Sprintf("csrf:%s", domain)
	tokenKey := fmt.Sprintf("access_token:%s", token)

	_, err := ts.client.Client().Pipelined(subCtx, func(pipe redis.Pipeliner) error {
		pipe.Del(subCtx, csrfKey)
		pipe.Del(subCtx, tokenKey)
		return nil
	})
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return fmt.Errorf("redis operation timed out: %w", err)
		}
		return fmt.Errorf("failed to clear session tokens: %w", err)
	}
	return nil
}
