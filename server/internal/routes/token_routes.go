package routes

import (
	"social-forge/internal/handlers"
	"social-forge/internal/middlewares"

	"github.com/gofiber/fiber/v2"
)

type TokenRoutes struct {
	path      string
	handler   *handlers.TokenHandler
	ctxinject *middlewares.ContextMiddleware
	auth      *middlewares.AuthMiddleware
	csrf      *middlewares.CSRFMiddleware
}

func NewTokenRoutes(
	handler *handlers.TokenHandler,
	ctxinject *middlewares.ContextMiddleware,
	auth *middlewares.AuthMiddleware,
	csrf *middlewares.CSRFMiddleware,
) *TokenRoutes {
	return &TokenRoutes{
		path:      "/token",
		handler:   handler,
		ctxinject: ctxinject,
		auth:      auth,
		csrf:      csrf,
	}
}
func (r *TokenRoutes) RegisterRoutes(parent fiber.Router) {
	router := parent.Group(r.path)
	router.Get("/csrf", r.handler.GetCSRFToken)
}
