package middlewares

import (
	"social-forge/config"
	"social-forge/internal/helpers"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type TenantMiddleware struct {
	notifier     config.Notifier
	ctxinject    *ContextMiddleware
	logger       *zap.Logger
	tenantHelper *helpers.TenantHelper
}

func NewTenantMiddleware(notifier config.Notifier, ctxinject *ContextMiddleware, logger *zap.Logger, tenantHelper *helpers.TenantHelper) *TenantMiddleware {
	return &TenantMiddleware{
		notifier:     notifier,
		ctxinject:    ctxinject,
		logger:       logger,
		tenantHelper: tenantHelper,
	}
}
func (m *TenantMiddleware) TenantGuard() fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx := m.ctxinject.From(c)
		defer m.ctxinject.LogDuration(ctx, c.Path())()

		subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
		defer cancel()

		tenantID := c.Locals("tenant_id").(string)

		if tenantID == "" {
			m.logger.Error("Tenant ID is required")
			return helpers.Respond(c, fiber.StatusBadRequest, "Unauthorized, tenant ID is required", nil)
		}

		tenantUUID, err := uuid.Parse(tenantID)
		if err != nil {
			m.logger.Error("Invalid tenant ID format", zap.Error(err))
			return helpers.Respond(c, fiber.StatusBadRequest, "Invalid tenant ID format", nil)
		}

		tenant, err := m.tenantHelper.GetCacheTenantByUserID(subCtx, tenantUUID)
		if err != nil || tenant == nil {
			m.logger.Error("Failed to get tenant by ID", zap.Error(err))
			return helpers.Respond(c, fiber.StatusInternalServerError, "Internal server error, tenant not registered", nil)
		}
		return c.Next()
	}
}
