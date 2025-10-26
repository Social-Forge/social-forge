package helpers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"social-forge/internal/infra/contextpool"
	redisclient "social-forge/internal/infra/redis-client"
	"social-forge/internal/infra/repository"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"github.com/redis/go-redis/v9"
	"github.com/skip2/go-qrcode"
	"github.com/vmihailenco/msgpack/v5"
)

var (
	UserCacheTTL           = 24 * time.Hour
	UserPrefix             = "user:"
	ConfirmPassPerfix      = "confirm_password:"
	TwoFaCodePrefix        = "2fa:"
	TwoFaStatusPrefix      = "status_2fa_user:"
	TempSecrets            = make(map[string]string)
	BlockedCredential      = "blocked_credential:"
	DelayBlockedCredential = "delay_blocked_credential:"
)

type UserHelper struct {
	client   *redisclient.RedisClient
	userRepo repository.UserRepository
}

func NewUserHelper(client *redisclient.RedisClient, userRepo repository.UserRepository) *UserHelper {
	return &UserHelper{
		client:   client,
		userRepo: userRepo,
	}
}
func (us *UserHelper) SetPasswordConfirmed(ctx context.Context, userID string, status bool) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	key := fmt.Sprintf("%s%s", ConfirmPassPerfix, userID)
	err := us.client.SetAny(subCtx, key, status, UserCacheTTL)
	if err != nil {
		return fmt.Errorf("failed to set password confirmation: %w", err)
	}
	return nil
}
func (us *UserHelper) IsPasswordConfirmed(ctx context.Context, userID string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	key := fmt.Sprintf("%s%s", ConfirmPassPerfix, userID)
	val, err := us.client.GetBool(subCtx, key)
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return false, nil
		}
		return false, fmt.Errorf("failed to get password confirmation: %w", err)
	}
	return val, nil
}
func (us *UserHelper) ClearPasswordConfirmed(ctx context.Context, userID string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s", ConfirmPassPerfix, userID)
	return us.client.DeleteCache(subCtx, keys)
}
func (us *UserHelper) Set2FaStatus(ctx context.Context, sessionID, key, value string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s:%s", TwoFaStatusPrefix, sessionID, key)
	return us.client.SetAny(subCtx, keys, value, 10*time.Minute)
}
func (us *UserHelper) Get2FaStatus(ctx context.Context, sessionID, key string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s:%s", TwoFaStatusPrefix, sessionID, key)
	val, err := us.client.GetString(subCtx, keys)
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", nil
		}
		return "", fmt.Errorf("failed to get 2fa status: %w", err)
	}
	return val, nil
}
func (us *UserHelper) Clear2FaStatus(ctx context.Context, sessionID, key string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s:%s", TwoFaStatusPrefix, sessionID, key)
	return us.client.DeleteCache(subCtx, keys)
}
func (us *UserHelper) Set2FaCode(ctx context.Context, userID string, secret, qrCode string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s:%s", TwoFaCodePrefix, userID, secret)
	return us.client.SetAny(subCtx, keys, qrCode, 10*time.Minute)
}
func (us *UserHelper) Get2FaCode(ctx context.Context, userID string, secret string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s:%s", TwoFaCodePrefix, userID, secret)
	return us.client.GetString(subCtx, keys)
}
func (us *UserHelper) GetTemp2FASecret(ctx context.Context, userID string) (map[string]interface{}, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keys := fmt.Sprintf("%s%s", TwoFaCodePrefix, userID)
	val, err := us.client.GetByte(subCtx, keys)
	if err == nil {
		var result map[string]interface{}
		if err = json.Unmarshal([]byte(val), &result); err != nil {
			return nil, fmt.Errorf("failed to unmarshal Redis data: %v", err)
		}
		return result, nil
	} else if err != redis.Nil {
		return nil, fmt.Errorf("redis error: %v", err)
	}

	uuidID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id format: %v", err)
	}
	user, err := us.userRepo.FindByID(subCtx, uuidID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	if user.TwoFaSecret == nil || *user.TwoFaSecret == "" {
		urlQr, secret, err := us.Generate2FAQRCode(subCtx, user.ID.String(), user.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to generate 2FA QR: %v", err)
		}

		err = us.userRepo.UpdateTwoFaSecret(subCtx, user.ID, &secret)
		if err != nil {
			return nil, fmt.Errorf("failed to save 2FA secret: %v", err)
		}

		payload := map[string]interface{}{
			"qr_url":  urlQr,
			"secret":  secret,
			"user_id": user.ID,
		}

		if err := us.SetTemp2FASecret(subCtx, user.ID.String(), payload); err != nil {
			return nil, fmt.Errorf("failed to cache 2FA secret: %v", err)
		}

		return payload, nil
	}

	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(val), &payload); err != nil {
		return nil, err
	}
	return payload, nil
}
func (us *UserHelper) Generate2FAQRCode(ctx context.Context, userID string, email string) (string, string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Social-Forge",
		AccountName: email,
	})
	if err != nil {
		return "", "", err
	}

	qr, err := qrcode.Encode(key.URL(), qrcode.Medium, 256)
	if err != nil {
		return "", "", err
	}
	base64QR := "data:image/png;base64," + base64.StdEncoding.EncodeToString(qr)

	// Simpan ke Redis 10 menit
	err = us.Set2FaCode(subCtx, userID, key.Secret(), base64QR)
	if err != nil {
		return "", "", err
	}

	return base64QR, key.Secret(), nil
}
func (us *UserHelper) SetTemp2FASecret(ctx context.Context, userID string, payload map[string]interface{}) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %v", err)
	}
	keys := fmt.Sprintf("%s%s", TwoFaCodePrefix, userID)
	return us.client.Setbyte(subCtx, keys, jsonData, 30*time.Minute)
}
func (us *UserHelper) ClearTemp2FASecret(ctx context.Context, userID string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	return us.client.DeleteCache(subCtx, userID)
}
func (us *UserHelper) Validate2FA(ctx context.Context, userID, otp, secret string) (bool, error) {
	valid, err := totp.ValidateCustom(
		otp,
		secret,
		time.Now(),
		totp.ValidateOpts{
			Period: 30,
			Skew:   1,
			Digits: 6,
		},
	)
	if err != nil {
		return false, fmt.Errorf("failed to verity otp code: %w", err)
	}

	return valid, nil
}
func (us *UserHelper) SetBlockedAttemptCredential(ctx context.Context, key string, val interface{}, expiration time.Duration) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	return us.client.SetAny(subCtx, key, val, expiration)
}
func (us *UserHelper) SetExpireAttemptCredential(ctx context.Context, key string, expiration time.Duration) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	if err := us.client.Expire(subCtx, key, expiration); err != nil {
		return fmt.Errorf("failed to set attempt credential expiration for key %s: %w", key, err)
	}
	return nil
}
func (us *UserHelper) IncrementAndGet(ctx context.Context, key string, expiry time.Duration) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	pipe := us.client.Client().Pipeline()
	incrCmd := pipe.Incr(subCtx, key)
	if expiry > 0 {
		pipe.Expire(subCtx, key, expiry)
	}

	_, err := pipe.Exec(subCtx)
	if err != nil {
		return 0, fmt.Errorf("failed to increment: %w", err)
	}

	return incrCmd.Val(), nil
}
func (us *UserHelper) ResetCounter(ctx context.Context, key string) error {
	return us.client.DeleteCache(ctx, key)
}
func (us *UserHelper) IsBlockedAttempt(ctx context.Context, key string) (bool, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	val, err := us.client.GetString(subCtx, key)
	if err != nil {
		return false, err
	}

	switch {
	case isPlainNumber(val):
		count, _ := strconv.Atoi(val) // Error sudah dicek di isPlainNumber
		return count >= 3, nil

	case isBinaryData(val):
		count, err := decodeBinaryAttempts([]byte(val))
		if err != nil {
			return false, err
		}
		return count >= 3, nil

	default:
		return false, fmt.Errorf("unrecognized data format for key %s", key)
	}
}
func (us *UserHelper) ShouldBlockCredential(ctx context.Context, key string) int {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	val, err := us.client.GetInt(subCtx, key)
	if err != nil {
		return 0
	}
	return val
}

func (us *UserHelper) ClearSession(ctx context.Context, userID string, key string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 3*time.Second)
	defer cancel()

	keysConfirm := fmt.Sprintf("%s%s", ConfirmPassPerfix, userID)
	if err := us.client.DeleteCache(subCtx, keysConfirm); err != nil {
		return fmt.Errorf("failed to delete confirmation key: %w", err)
	}

	return nil
}

// Cara pakai : r.ClearKeys(ConfirmPassPerfix+userID, TwoFaStatusPrefix+sessionID+":"+key)
func (us *UserHelper) ClearKeys(ctx context.Context, keys ...string) error {
	subCtx, cancel := contextpool.WithTimeoutFallback(ctx, 3*time.Second)
	defer cancel()

	return us.client.Client().Del(subCtx, keys...).Err()
}
func isPlainNumber(s string) bool {
	_, err := strconv.Atoi(s)
	return err == nil
}
func isBinaryData(s string) bool {
	return len(s) > 0 && s[0] == '\x83' // Magic byte MessagePack
}
func decodeBinaryAttempts(data []byte) (int, error) {
	var result struct {
		CurrHits int `msgpack:"currHits"`
	}
	if err := msgpack.Unmarshal(data, &result); err != nil {
		return 0, err
	}
	return result.CurrHits, nil
}
