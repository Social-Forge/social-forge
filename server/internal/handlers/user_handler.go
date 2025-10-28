package handlers

import (
	"social-forge/internal/helpers"
	"social-forge/internal/middlewares"
	"social-forge/internal/services"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type UserHandler struct {
	ctxinject   *middlewares.ContextMiddleware
	userService *services.UserService
	rateLimiter *middlewares.RateLimiterMiddleware
	logger      *zap.Logger
}

func NewUserHandler(ctxinject *middlewares.ContextMiddleware, userService *services.UserService, rateLimiter *middlewares.RateLimiterMiddleware, logger *zap.Logger) *UserHandler {
	return &UserHandler{
		ctxinject:   ctxinject,
		userService: userService,
		rateLimiter: rateLimiter,
		logger:      logger,
	}
}
func (h *UserHandler) GetCurrentUser(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return helpers.Respond(c, fiber.StatusInternalServerError, "User ID not found", nil)
	}
	userTenant, err := h.userService.GetUserByID(ctx, userID)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return helpers.Respond(c, fiber.StatusOK, "User found", userTenant)
}
