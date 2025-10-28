package handlers

import (
	"social-forge/internal/dto"
	"social-forge/internal/helpers"
	"social-forge/internal/middlewares"
	"social-forge/internal/services"
	"social-forge/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	ctxinject   *middlewares.ContextMiddleware
	authService *services.AuthService
	rateLimiter *middlewares.RateLimiterMiddleware
	logger      *zap.Logger
}

func NewAuthHandler(
	ctxinject *middlewares.ContextMiddleware,
	authService *services.AuthService,
	rateLimiter *middlewares.RateLimiterMiddleware,
	logger *zap.Logger,
) *AuthHandler {
	return &AuthHandler{
		ctxinject:   ctxinject,
		authService: authService,
		rateLimiter: rateLimiter,
		logger:      logger,
	}
}
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	var req dto.RegisterUserRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.Respond(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	if errs := helpers.ValidateStruct(req); len(errs) > 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, helpers.ValidationErrors{Errors: errs}.Error(), nil)
	}

	origin := utils.GetOriginHost(c)

	_, err := h.authService.Register(ctx, &req, origin)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return helpers.Respond(c, fiber.StatusCreated, "User registered successfully", nil)
}
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.Respond(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	if errs := helpers.ValidateStruct(req); len(errs) > 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, helpers.ValidationErrors{Errors: errs}.Error(), nil)
	}
	ip, ok := c.Locals("real_ip").(string)
	if !ok {
		ip = c.IP()
	}

	origin := utils.GetOriginHost(c)

	response, err := h.authService.Login(ctx, &req, ip, origin)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	h.rateLimiter.ResetLimitCounters(c)

	switch response.Status {
	case "require_email_verification":
		return helpers.Respond(c, fiber.StatusForbidden, "Email verification required", response)
	case "two_fa_required":
		return helpers.Respond(c, fiber.StatusAccepted, "Two-factor authentication required", response)
	default:
		return helpers.Respond(c, fiber.StatusOK, "Login successful", response)
	}
}
func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	var req dto.VerifyEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.Respond(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	if errs := helpers.ValidateStruct(req); len(errs) > 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, helpers.ValidationErrors{Errors: errs}.Error(), nil)
	}

	if err := h.authService.VerifyEmail(ctx, req.Token); err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return helpers.Respond(c, fiber.StatusOK, "Email verified successfully", nil)
}
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	var req dto.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.Respond(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	if errs := helpers.ValidateStruct(req); len(errs) > 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, helpers.ValidationErrors{Errors: errs}.Error(), nil)
	}

	ip, ok := c.Locals("real_ip").(string)
	if !ok {
		ip = c.IP()
	}
	origin := utils.GetOriginHost(c)

	if err := h.authService.ForgotPassword(ctx, &req, ip, origin); err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return helpers.Respond(c, fiber.StatusOK, "Password reset email sent", nil)
}
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	ctx := h.ctxinject.HandlerContext(c)

	var req dto.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.Respond(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	if errs := helpers.ValidateStruct(req); len(errs) > 0 {
		return helpers.Respond(c, fiber.StatusBadRequest, helpers.ValidationErrors{Errors: errs}.Error(), nil)
	}

	if err := h.authService.ResetPassword(ctx, &req); err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return helpers.Respond(c, fiber.StatusOK, "Password reset successfully", nil)
}
