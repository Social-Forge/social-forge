package middlewares

import (
	"context"
	"runtime/debug"
	"social-forge/internal/helpers"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type RecoveryMiddleware struct {
	ctxinject *ContextMiddleware
	logger    *zap.Logger
}

func NewRecoveryMiddleware(
	ctxinject *ContextMiddleware,
	logger *zap.Logger,
) *RecoveryMiddleware {
	return &RecoveryMiddleware{
		ctxinject: ctxinject,
		logger:    logger,
	}
}
func (rm *RecoveryMiddleware) NewRecoveryMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				originalCtx := rm.ctxinject.From(c)

				isTimeout := originalCtx.Err() == context.DeadlineExceeded
				isCanceled := originalCtx.Err() == context.Canceled

				rm.logger.Error("⚠️ Panic recovered",
					zap.String("path", c.Path()),
					zap.Any("error", r),
					zap.Bool("is_timeout", isTimeout),
					zap.Bool("is_canceled", isCanceled),
					zap.String("stack", string(debug.Stack())),
				)

				status := fiber.StatusInternalServerError
				message := "Internal Server Error"

				if isTimeout {
					status = fiber.StatusGatewayTimeout
					message = "Request Timeout"
				}

				c.Locals(timeoutKey, 10*time.Second)

				_ = helpers.Respond(c, status, message, fiber.Map{
					"request_id":  c.Locals("request_id"),
					"incident_id": uuid.New().String(),
					"is_timeout":  isTimeout,
				})
			}
		}()
		return c.Next()
	}
}
