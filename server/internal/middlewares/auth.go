package middlewares

import (
	"context"
	"errors"
	"fmt"
	"social-forge/config"
	"social-forge/internal/entity"
	"social-forge/internal/helpers"
	"social-forge/internal/infra/contextpool"
	"social-forge/internal/infra/metrics"
	redisclient "social-forge/internal/infra/redis-client"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	ErrMissingToken   = "Unauthorized - Missing token"
	ErrMissMatchToken = "Unauthorized - Token mismatch"
	ErrInvalidToken   = "Unauthorized - Invalid token format"
	ErrExpiredToken   = "Unauthorized - Invalid or expired token"
	ErrInvalidAuth    = "Unauthorized - Invalid authorization header"
)

type AuthMiddleware struct {
	notifier    config.Notifier
	ctxinject   *ContextMiddleware
	redisClient *redisclient.RedisClient
	tokenHelper *helpers.TokenHelper
	logger      *zap.Logger
	jwtSecret   string
}

func NewAuthMiddleware(notifier config.Notifier, ctxinject *ContextMiddleware, redisClient *redisclient.RedisClient, tokenHelper *helpers.TokenHelper, logger *zap.Logger, jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		notifier:    notifier,
		ctxinject:   ctxinject,
		redisClient: redisClient,
		tokenHelper: tokenHelper,
		logger:      logger,
		jwtSecret:   jwtSecret,
	}
}

func (m *AuthMiddleware) JWTAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx := m.ctxinject.From(c)
		defer m.ctxinject.LogDuration(ctx, c.Path())()

		tokenStr, err := m.extractTokenFromHeader(c)
		if err != nil {
			return helpers.Respond(c, fiber.StatusUnauthorized, err.Error(), nil)
		}

		m.logger.Debug("🔐 Processing JWT token",
			zap.String("path", c.Path()),
			zap.String("method", c.Method()))

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(m.jwtSecret), nil
		})

		if err != nil {
			m.logger.Warn("❌ JWT validation failed",
				zap.Error(err),
				zap.String("path", c.Path()))
			return m.handleTokenError(c, err)
		}

		if !token.Valid {
			m.logger.Warn("❌ Invalid token")
			return helpers.Respond(c, fiber.StatusUnauthorized, ErrInvalidToken, nil)
		}

		tokenMetadata, err := m.validateTokenSession(ctx, tokenStr)
		if err != nil {
			return helpers.Respond(c, fiber.StatusUnauthorized, err.Error(), nil)
		}

		m.setContextLocals(c, tokenMetadata)

		m.logger.Debug("✅ JWT authentication successful",
			zap.String("user_id", tokenMetadata.UserID.String()),
			zap.String("path", c.Path()))

		return c.Next()
	}
}
func (m *AuthMiddleware) extractTokenFromHeader(c *fiber.Ctx) (string, error) {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return "", errors.New(ErrMissingToken)
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", errors.New(ErrInvalidAuth)
	}

	if parts[1] == "" {
		return "", errors.New(ErrMissingToken)
	}

	return parts[1], nil
}
func (m *AuthMiddleware) handleTokenError(c *fiber.Ctx, err error) error {
	errorMsg := ErrInvalidToken
	if errors.Is(err, jwt.ErrTokenExpired) {
		errorMsg = ErrExpiredToken
	}

	// Log metrics untuk monitoring
	metrics.GetAppMetrics().JWTErrorTotal.WithLabelValues("validation_failed").Inc()

	return helpers.Respond(c, fiber.StatusUnauthorized, errorMsg, nil)
}
func (m *AuthMiddleware) validateTokenSession(ctx context.Context, tokenStr string) (*entity.TokenMetadata, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	tokenMetadata, err := m.tokenHelper.GetSessionTokenMetadata(subCtx, tokenStr)
	if err != nil {
		m.logger.Error("❌ Failed to get token metadata", zap.Error(err))
		return nil, errors.New(ErrInvalidToken)
	}

	// Validasi required fields
	if err := m.validateTokenMetadata(tokenMetadata); err != nil {
		m.logger.Warn("❌ Invalid token metadata", zap.Error(err))
		return nil, err
	}

	return tokenMetadata, nil
}
func (m *AuthMiddleware) validateTokenMetadata(metadata *entity.TokenMetadata) error {
	if metadata.UserID == uuid.Nil {
		return fmt.Errorf("invalid user ID in token")
	}
	if metadata.Role == nil || metadata.Role.ID == uuid.Nil {
		return fmt.Errorf("invalid role in token")
	}
	if metadata.TenantID == nil || *metadata.TenantID == uuid.Nil {
		return fmt.Errorf("invalid tenant ID in token")
	}
	if metadata.UserTenantID == nil || *metadata.UserTenantID == uuid.Nil {
		return fmt.Errorf("invalid user tenant ID in token")
	}
	return nil
}
func (m *AuthMiddleware) setContextLocals(c *fiber.Ctx, metadata *entity.TokenMetadata) {
	c.Locals("user_id", metadata.UserID.String())
	c.Locals("tenant_id", metadata.TenantID.String())
	c.Locals("user_tenant_id", metadata.UserTenantID.String())
	c.Locals("role_id", metadata.Role.ID.String())
	c.Locals("email", metadata.Email)

	if len(metadata.RoleName) > 0 {
		c.Locals("role_name", metadata.RoleName)
	}
	if len(metadata.PermissionResource) > 0 {
		c.Locals("permission_resources", metadata.PermissionResource)
	}
	if len(metadata.PermissionName) > 0 {
		c.Locals("permissions", metadata.PermissionName)
	}
	if len(metadata.PermissionAction) > 0 {
		c.Locals("permission_actions", metadata.PermissionAction)
	}
}
func (am *AuthMiddleware) LogUnauthorized(c *fiber.Ctx, subject string, requestID string) {
	metrics.GetAppMetrics().JWTErrorTotal.WithLabelValues("invalid_signature").Inc()
	am.notifier.SendAlert(config.AlertRequest{
		Subject: subject,
		Message: subject,
		Metadata: map[string]interface{}{
			"request_id": requestID,
			"timestamp":  time.Now(),
			"user_agent": c.Get("User-Agent"),
			"ip":         c.Locals("real_ip").(string),
		},
	})
}
