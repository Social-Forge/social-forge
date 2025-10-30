package handlers

import (
	"errors"
	"social-forge/internal/dto"
	"social-forge/internal/helpers"
	"social-forge/internal/middlewares"
	"social-forge/internal/services"
	"strings"

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
	if !ok || userID == "" {
		return helpers.Respond(c, fiber.StatusInternalServerError, "User ID not found", nil)
	}
	userTenant, err := h.userService.GetUserByID(ctx, userID)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return helpers.Respond(c, fiber.StatusOK, "User found", userTenant)
}
func (h *UserHandler) Logout(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return helpers.Respond(c, fiber.StatusInternalServerError, "User ID not found", nil)
	}
	if err := h.userService.Logout(ctx, userID); err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	h.rateLimiter.ResetLimitCounters(c)
	return helpers.Respond(c, fiber.StatusOK, "Logout success", nil)
}
func (h *UserHandler) ChangeAvatar(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return helpers.Respond(c, fiber.StatusUnauthorized, "User authentication required", nil)
	}

	c.Request().Header.Set("Content-Type", "multipart/form-data")

	form, err := c.MultipartForm()
	if err != nil {
		h.logger.Error("Failed to parse multipart form",
			zap.String("user_id", userID),
			zap.Error(err))
		return helpers.Respond(c, fiber.StatusBadRequest, "Invalid form data", nil)
	}
	defer form.RemoveAll()

	files, exists := form.File["avatar"]
	if !exists || len(files) == 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, "Avatar file is required", nil)
	}

	avatarFile := files[0]

	const maxFileSize = 5 << 20 // 5MB
	if avatarFile.Size > maxFileSize {
		return helpers.Respond(c, fiber.StatusBadRequest,
			"File too large. Maximum size is 5MB", nil)
	}

	fileHeader := avatarFile.Header.Get("Content-Type")
	if !h.isValidImageType(fileHeader) {
		return helpers.Respond(c, fiber.StatusBadRequest,
			"Invalid image type. Only JPEG, JPG, PNG, GIF, and WebP are allowed", nil)
	}

	avatarURL, err := h.userService.ChangeAvatar(ctx, userID, avatarFile)
	if err != nil {
		h.logger.Error("Failed to change avatar",
			zap.String("user_id", userID),
			zap.Error(err))

		switch {
		case errors.Is(err, dto.ErrUserNotFound):
			return helpers.Respond(c, fiber.StatusNotFound, "User not found", nil)
		case strings.Contains(err.Error(), "upload"):
			return helpers.Respond(c, fiber.StatusInternalServerError, "Failed to upload avatar", nil)
		default:
			return helpers.Respond(c, fiber.StatusInternalServerError, "Failed to update avatar", nil)
		}
	}
	return helpers.Respond(c, fiber.StatusOK, "Avatar changed successfully", fiber.Map{
		"avatar_url": avatarURL,
	})
}
func (h *UserHandler) isValidImageType(contentType string) bool {
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	return allowedTypes[contentType]
}
