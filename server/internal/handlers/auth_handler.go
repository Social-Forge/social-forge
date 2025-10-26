package handlers

import (
	"social-forge/internal/dto"
	"social-forge/internal/helpers"
	"social-forge/internal/middlewares"
	"social-forge/internal/services"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	ctxinject   *middlewares.ContextMiddleware
	authService *services.AuthService
	logger      *zap.Logger
}

func NewAuthHandler(ctxinject *middlewares.ContextMiddleware, authService *services.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		ctxinject:   ctxinject,
		authService: authService,
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

	user, err := h.authService.Register(ctx, &req)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	user.PasswordHash = ""
	return helpers.Respond(c, fiber.StatusCreated, "User registered successfully", user)
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

	token, err := h.authService.Login(ctx, &req)
	if err != nil {
		return helpers.Respond(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return helpers.Respond(c, fiber.StatusOK, "Login successful", token)
}
